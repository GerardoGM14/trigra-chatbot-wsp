// Módulo Baileys — gestiona N sesiones WhatsApp simultáneas, una por número.
//
// Decisiones:
//   · Cada sesión persiste sus credenciales en BAILEYS_AUTH_DIR/<slug>/
//     (sobrevive a reinicios del proceso Node)
//   · Los eventos (qr, ready, disconnect, error) se emiten al frontend vía
//     Socket.IO con canal `session:<slug>`
//   · Los estados se sincronizan con Postgres en cada cambio relevante
//   · Cuando un usuario llama `startSession()`, si ya existe `creds.json`
//     se reconecta automáticamente; si no, emite QR para vincular un dispositivo nuevo
//   · Las funciones son idempotentes: llamar `startSession` con una sesión ya
//     conectada devuelve sin reabrir

import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  type WASocket,
} from "baileys";
import { Boom } from "@hapi/boom";
import QRCode from "qrcode";
import path from "node:path";
import fs from "node:fs/promises";
import pino from "pino";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { emitSessionUpdate } from "../realtime/io.js";

// Logger silencioso para Baileys — la librería loguea muchísimo por defecto.
const baileysLogger = pino({ level: "warn" });

// Pool de sockets activos en memoria. Key = session.slug.
const activeSessions = new Map<string, WASocket>();

// Helper: ruta absoluta a la carpeta de auth de una sesión.
function authDirFor(slug: string) {
  return path.resolve(env.BAILEYS_AUTH_DIR, slug);
}

// Helper: sincroniza estado en DB + emite por Socket.IO.
async function syncStatus(
  slug: string,
  status: "Conectado" | "Reconectando" | "Desconectado",
  extra: { phoneNumber?: string; quality?: string } = {},
) {
  const data: Record<string, unknown> = { status };
  if (status === "Conectado") data.connectedAt = new Date();
  if (extra.phoneNumber) data.phoneNumber = extra.phoneNumber;
  if (extra.quality) data.quality = extra.quality;

  await prisma.baileysSession.update({ where: { slug }, data });
  emitSessionUpdate(slug, { status, ...extra });
}

/**
 * Arranca (o reconecta) la sesión identificada por `slug`. Si ya hay credenciales
 * en disco, intenta reconectar silenciosamente; si no, dispara un QR.
 *
 * Idempotente: si la sesión ya está conectada, no abre un nuevo socket.
 */
export async function startSession(slug: string): Promise<void> {
  if (activeSessions.has(slug)) {
    baileysLogger.info({ slug }, "session already running, skip");
    return;
  }

  const authDir = authDirFor(slug);
  await fs.mkdir(authDir, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(authDir);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    auth: state,
    version,
    logger: baileysLogger,
    printQRInTerminal: false,    // el QR lo emitimos vía Socket.IO
    browser: ["WSP Control", "Chrome", "1.0"],
    syncFullHistory: false,
    markOnlineOnConnect: false,
  });

  activeSessions.set(slug, sock);

  // Persistir credenciales cada vez que cambian — sin esto, al reiniciar
  // el proceso habría que reescanear QR.
  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, qr, lastDisconnect } = update;

    if (qr) {
      // Convertimos el string de QR a data URL (PNG base64) para que el
      // frontend pueda renderizarlo con un <img src=...> directamente.
      try {
        const dataUrl = await QRCode.toDataURL(qr, { width: 256, margin: 1 });
        emitSessionUpdate(slug, {
          type: "qr",
          qr: dataUrl,
          // El QR caduca a los ~45s, Baileys emitirá otro automáticamente.
          expiresAt: new Date(Date.now() + 45_000).toISOString(),
        });
      } catch (err) {
        baileysLogger.error({ slug, err }, "failed to render QR");
      }
    }

    if (connection === "open") {
      const me = sock.user;
      // me?.id viene como "51999412220:42@s.whatsapp.net" — extraemos solo el número.
      const phoneNumber = me?.id?.split(":")[0]?.split("@")[0];
      const formatted = phoneNumber ? `+${phoneNumber}` : undefined;
      await syncStatus(slug, "Conectado", { phoneNumber: formatted, quality: "Alta" });
      await logActivity("baileys.connected", slug, `Sesión vinculada${formatted ? ` — ${formatted}` : ""}`);
    }

    if (connection === "close") {
      const error = lastDisconnect?.error as Boom | undefined;
      const statusCode = error?.output?.statusCode;
      // 401 = loggedOut → el usuario cerró sesión desde el teléfono
      const loggedOut = statusCode === DisconnectReason.loggedOut;

      if (loggedOut) {
        await syncStatus(slug, "Desconectado");
        await logActivity("baileys.logged_out", slug, "Sesión cerrada desde el teléfono", "warn");
        activeSessions.delete(slug);
        // Borramos las credenciales — siguiente startSession() pedirá QR nuevo.
        await fs.rm(authDir, { recursive: true, force: true }).catch(() => {});
      } else {
        // Cualquier otra desconexión: reintentamos
        await syncStatus(slug, "Reconectando");
        activeSessions.delete(slug);
        // Backoff simple: 3 segundos.
        setTimeout(() => startSession(slug).catch((e) => baileysLogger.error({ slug, e }, "reconnect failed")), 3000);
      }
    }
  });
}

/**
 * Cierra el socket WhatsApp sin borrar credenciales. Próxima llamada a
 * `startSession` reconectará sin pedir QR.
 */
export async function stopSession(slug: string): Promise<void> {
  const sock = activeSessions.get(slug);
  if (!sock) return;
  try {
    // logout() cierra "limpio" desde el lado de WhatsApp. end() solo cierra el socket TCP.
    await sock.logout();
  } catch {
    sock.end(undefined);
  }
  activeSessions.delete(slug);
  await syncStatus(slug, "Desconectado");
}

/**
 * Borra completamente las credenciales. Tras esto, `startSession` arrancará
 * desde cero pidiendo un QR nuevo.
 */
export async function unlinkSession(slug: string): Promise<void> {
  await stopSession(slug);
  await fs.rm(authDirFor(slug), { recursive: true, force: true }).catch(() => {});
}

/**
 * Envía un mensaje de texto plano. Lo llama el worker BullMQ.
 * Devuelve el messageId para que el SendJob pueda persistirlo.
 *
 * El número debe venir en formato E.164 sin signos (ej. "51999412220").
 */
export async function sendMessage(
  slug: string,
  phone: string,
  body: string,
): Promise<{ ok: true; messageId: string }> {
  const sock = activeSessions.get(slug);
  if (!sock) throw new Error(`Sesión "${slug}" no está conectada`);

  const jid = phone.replace(/\D/g, "") + "@s.whatsapp.net";
  const result = await sock.sendMessage(jid, { text: body });
  return { ok: true, messageId: result?.key.id ?? "" };
}

/**
 * Re-arranca todas las sesiones marcadas como Conectado/Reconectando en DB
 * cuando el proceso Node arranca. Sin esto, tras un reinicio del servidor
 * habría que reescanear QR para cada sesión.
 */
export async function resumeAllSessions(): Promise<void> {
  const sessions = await prisma.baileysSession.findMany({
    where: { status: { in: ["Conectado", "Reconectando"] } },
  });
  baileysLogger.info({ count: sessions.length }, "resuming baileys sessions");
  for (const s of sessions) {
    startSession(s.slug).catch((err) => baileysLogger.error({ slug: s.slug, err }, "resume failed"));
  }
}

// Mini-helper para registrar entradas en la auditoría. Está aquí porque
// activity.routes.ts no expone la función públicamente — lo refactorizamos
// cuando otro módulo también necesite escribir.
async function logActivity(
  action: string,
  target: string,
  detail: string,
  level: "ok" | "info" | "warn" | "err" = "info",
) {
  await prisma.activityLog.create({
    data: { action, target, detail, level, userId: null },
  }).catch(() => { /* swallow */ });
}
