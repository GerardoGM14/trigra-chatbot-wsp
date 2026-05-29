// REST de la bandeja de conversaciones.
//
//   GET    /api/conversations                → listado con filtros
//   GET    /api/conversations/:id            → detalle + mensajes
//   POST   /api/conversations/:id/read       → marca como leídas
//   POST   /api/conversations/:id/send       → operador envía un mensaje manual
//   POST   /api/conversations/:id/handoff    → toma control (status = handed_off)
//   POST   /api/conversations/:id/release    → devuelve al bot (status = bot)
//   POST   /api/conversations/:id/close      → cierra la conversación

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { NotFound, BadRequest } from "../../lib/errors.js";
import { emitConversationEvent } from "../../realtime/io.js";
import * as baileys from "../../baileys/index.js";

const listSchema = z.object({
  status: z.enum(["bot", "handed_off", "closed"]).optional(),
  assignedToMe: z.coerce.boolean().optional(),
  q: z.string().optional(),
  take: z.coerce.number().int().positive().max(200).default(50),
});

const sendSchema = z.object({
  body: z.string().min(1),
});

export async function conversationRoutes(app: FastifyInstance) {
  app.get("/", async (req) => {
    const { status, assignedToMe, q, take } = listSchema.parse(req.query);
    const where = {
      ...(status ? { status } : {}),
      ...(assignedToMe ? { assignedUserId: req.user.sub } : {}),
      ...(q
        ? {
            OR: [
              { contactName: { contains: q, mode: "insensitive" as const } },
              { contactPhone: { contains: q.replace(/\D/g, "") } },
            ],
          }
        : {}),
    };

    const rows = await prisma.conversation.findMany({
      where,
      orderBy: { lastMessageAt: "desc" },
      take,
      include: {
        session: { select: { slug: true, phoneNumber: true } },
        assignedUser: { select: { username: true, name: true } },
        // Último mensaje para preview en la lista.
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { body: true, direction: true, createdAt: true },
        },
      },
    });

    return rows.map((c) => ({
      id: c.id,
      contactPhone: c.contactPhone,
      contactName: c.contactName,
      status: c.status,
      session: c.session,
      assignedUser: c.assignedUser,
      unreadCount: c.unreadCount,
      lastMessageAt: c.lastMessageAt,
      lastMessage: c.messages[0] ?? null,
    }));
  });

  app.get("/:id", async (req) => {
    const { id } = req.params as { id: string };
    const conv = await prisma.conversation.findUnique({
      where: { id },
      include: {
        session: { select: { slug: true, phoneNumber: true } },
        assignedUser: { select: { username: true, name: true } },
        currentFlow: { select: { id: true, name: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          take: 200,
          include: { sentByUser: { select: { username: true } } },
        },
      },
    });
    if (!conv) throw NotFound("Conversación no encontrada");
    return conv;
  });

  app.post("/:id/read", async (req) => {
    const { id } = req.params as { id: string };
    await prisma.conversation.update({ where: { id }, data: { unreadCount: 0 } });
    return { ok: true };
  });

  app.post("/:id/send", async (req) => {
    const { id } = req.params as { id: string };
    const { body } = sendSchema.parse(req.body);

    const conv = await prisma.conversation.findUnique({
      where: { id },
      include: { session: true },
    });
    if (!conv) throw NotFound("Conversación no encontrada");
    if (conv.status === "closed") throw BadRequest("La conversación está cerrada");

    // Envía por Baileys. Si falla, propagamos el error para que el frontend
    // muestre el toast — no persistimos el mensaje fantasma.
    await baileys.sendMessage(conv.session.slug, conv.contactPhone, body);

    const stored = await prisma.message.create({
      data: {
        conversationId: id,
        direction: "outbound",
        body,
        sentByUserId: req.user.sub,
      },
    });
    await prisma.conversation.update({
      where: { id },
      data: { lastMessageAt: new Date() },
    });

    emitConversationEvent("message", { conversationId: id, message: stored });
    return stored;
  });

  app.post("/:id/handoff", async (req) => {
    const { id } = req.params as { id: string };
    const conv = await prisma.conversation.update({
      where: { id },
      data: {
        status: "handed_off",
        assignedUserId: req.user.sub,
        currentFlowId: null,
        currentNodeId: null,
      },
    });
    emitConversationEvent("status", { conversationId: id, status: conv.status });
    return conv;
  });

  app.post("/:id/release", async (req) => {
    const { id } = req.params as { id: string };
    const conv = await prisma.conversation.update({
      where: { id },
      data: { status: "bot", assignedUserId: null },
    });
    emitConversationEvent("status", { conversationId: id, status: conv.status });
    return conv;
  });

  app.post("/:id/close", async (req) => {
    const { id } = req.params as { id: string };
    const conv = await prisma.conversation.update({
      where: { id },
      data: { status: "closed", currentFlowId: null, currentNodeId: null },
    });
    emitConversationEvent("status", { conversationId: id, status: conv.status });
    return conv;
  });
}
