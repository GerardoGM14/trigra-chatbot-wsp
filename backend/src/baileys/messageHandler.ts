// Handler de mensajes entrantes de Baileys.
//
// Por cada mensaje entrante:
//   1. Persiste el inbound en `Message` + crea/actualiza la `Conversation`
//   2. Emite Socket.IO para que la bandeja del frontend se refresque en vivo
//   3. Si la conversación está en modo bot, consulta al BotEngine y responde
//      automáticamente (encadenando el envío con baileys.sendMessage)
//
// Diseñado para ser idempotente: deduplicamos por `whatsappId` para no
// procesar dos veces el mismo mensaje (Baileys reenvía a veces).

import type { WAMessage } from "baileys";
import type { Logger } from "pino";
import { prisma } from "../lib/prisma.js";
import { emitConversationEvent } from "../realtime/io.js";
import { decideReply } from "../bot/engine.js";

type SendFn = (slug: string, phone: string, body: string) => Promise<{ ok: true; messageId: string }>;

/**
 * Procesa un mensaje entrante. Llamar desde el listener `messages.upsert`
 * de Baileys, una vez por mensaje.
 *
 * `sendFn` es inyectado en lugar de importar baileys directo para romper el
 * ciclo de dependencias (baileys → messageHandler → baileys).
 */
export async function handleIncomingMessage(opts: {
  sessionSlug: string;
  message: WAMessage;
  log: Logger;
  send: SendFn;
}): Promise<void> {
  const { sessionSlug, message, log, send } = opts;

  // Ignorar mensajes propios (Baileys notifica también lo que TÚ envías desde
  // el teléfono — no queremos confundirlos con mensajes del cliente).
  if (message.key.fromMe) return;

  // Extraer texto del mensaje. Baileys lo guarda en distintos lugares según
  // el tipo. Por ahora solo procesamos texto plano y captions de imagen.
  const body = extractText(message);
  if (!body) {
    log.debug({ key: message.key }, "incoming non-text message, skipping (media support pending)");
    return;
  }

  // De WhatsApp llega "51999412220@s.whatsapp.net"; extraemos solo dígitos.
  const remoteJid = message.key.remoteJid ?? "";
  if (!remoteJid.endsWith("@s.whatsapp.net")) {
    // Ignoramos grupos, broadcasts, status — solo 1-a-1.
    log.debug({ remoteJid }, "non-individual chat, skipping");
    return;
  }
  const contactPhone = remoteJid.split("@")[0].split(":")[0];
  const whatsappId = message.key.id ?? undefined;

  // Resolver la sesión Baileys en DB (necesitamos el id interno).
  const session = await prisma.baileysSession.findUnique({ where: { slug: sessionSlug } });
  if (!session) {
    log.warn({ sessionSlug }, "incoming msg for unknown session, skipping");
    return;
  }

  // Dedup por whatsappId.
  if (whatsappId) {
    const exists = await prisma.message.findUnique({ where: { whatsappId } });
    if (exists) return;
  }

  // Upsert de la conversación. Si es la primera vez que escribe, la creamos.
  const conversation = await prisma.conversation.upsert({
    where: {
      sessionId_contactPhone: { sessionId: session.id, contactPhone },
    },
    update: {
      lastMessageAt: new Date(),
      unreadCount: { increment: 1 },
    },
    create: {
      sessionId: session.id,
      contactPhone,
      contactName: message.pushName ?? null,
      lastMessageAt: new Date(),
      unreadCount: 1,
    },
    include: { currentFlow: { include: { nodes: true } } },
  });

  // Persistir el mensaje inbound.
  const stored = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      direction: "inbound",
      body,
      whatsappId,
    },
  });

  // Emitir evento al frontend para que la bandeja se refresque sola.
  emitConversationEvent("message", {
    conversationId: conversation.id,
    message: stored,
  });

  // Si la conversación está en modo bot, consultamos al motor.
  if (conversation.status !== "bot") return;

  let result;
  try {
    result = await decideReply(conversation, body);
  } catch (err) {
    log.error({ err, conversationId: conversation.id }, "bot engine failed");
    return;
  }

  if (result.type === "silence") return;

  // Enviar la respuesta del bot por Baileys.
  try {
    await send(sessionSlug, contactPhone, result.body);
  } catch (err) {
    log.error({ err, contactPhone }, "failed to send bot reply");
    return;
  }

  // Persistir el outbound + actualizar estado del flow.
  const outbound = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      direction: "outbound",
      body: result.body,
      // sentByUserId queda null → indica "el bot lo envió"
    },
  });
  emitConversationEvent("message", { conversationId: conversation.id, message: outbound });

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      currentFlowId: result.flowId,
      currentNodeId: result.nextNodeId,
      status: result.handoff ? "handed_off" : "bot",
      lastMessageAt: new Date(),
    },
  });

  if (result.handoff) {
    emitConversationEvent("handoff", { conversationId: conversation.id });
  }
}

// Extrae el texto de un WAMessage. Cubre: conversation, extendedTextMessage,
// imageMessage.caption, videoMessage.caption. El resto se ignora por ahora.
function extractText(msg: WAMessage): string | null {
  const m = msg.message;
  if (!m) return null;
  if (m.conversation) return m.conversation;
  if (m.extendedTextMessage?.text) return m.extendedTextMessage.text;
  if (m.imageMessage?.caption) return m.imageMessage.caption;
  if (m.videoMessage?.caption) return m.videoMessage.caption;
  return null;
}
