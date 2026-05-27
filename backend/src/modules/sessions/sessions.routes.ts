// REST de sesiones Baileys. Cada endpoint que toca el estado de WhatsApp
// delega al módulo `baileys/` para que arranque/cierre el socket real.
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { NotFound } from "../../lib/errors.js";
import * as baileys from "../../baileys/index.js";

const assignSchema = z.object({
  userIds: z.array(z.string()),
});

const exclusiveSchema = z.object({
  exclusive: z.boolean(),
  ownerId: z.string().nullable().optional(),
});

const createSchema = z.object({
  // El frontend genera un slug legible (sess_abc). Si llega vacío, lo
  // generamos aquí.
  slug: z.string().optional(),
  // Pre-asignaciones opcionales (usernames).
  userIds: z.array(z.string()).optional(),
});

export async function sessionRoutes(app: FastifyInstance) {
  app.get("/", async () => {
    const sessions = await prisma.baileysSession.findMany({
      orderBy: { createdAt: "asc" },
      include: { assignments: { include: { user: { select: { username: true } } } } },
    });
    return sessions.map((s) => ({
      id: s.id,
      slug: s.slug,
      phoneNumber: s.phoneNumber,
      status: s.status,
      quality: s.quality,
      platform: s.platform,
      exclusive: s.exclusive,
      ops: s.assignments.map((a) => a.user.username),
      connectedAt: s.connectedAt,
    }));
  });

  app.get("/:id", async (req) => {
    const { id } = req.params as { id: string };
    const session = await prisma.baileysSession.findUnique({
      where: { id },
      include: { assignments: { include: { user: true } } },
    });
    if (!session) throw NotFound("Sesión no encontrada");
    return session;
  });

  /**
   * POST /api/sessions
   * Crea un registro de sesión y arranca Baileys. El QR llega vía Socket.IO
   * en el canal `session:<slug>`.
   */
  app.post("/", async (req) => {
    const { slug: providedSlug, userIds = [] } = createSchema.parse(req.body ?? {});
    const slug = providedSlug || `sess_${Date.now().toString().slice(-6)}`;

    const created = await prisma.baileysSession.create({
      data: {
        slug,
        // El número real se completa cuando WhatsApp confirma la conexión.
        // Mientras tanto guardamos un placeholder único (el slug).
        phoneNumber: `pending_${slug}`,
        status: "Reconectando",
        assignments: {
          create: userIds.map((userId) => ({ userId })),
        },
      },
    });

    // Arranca Baileys async — el endpoint vuelve inmediatamente; el frontend
    // escucha el QR por Socket.IO.
    baileys.startSession(slug).catch((err) =>
      req.log.error({ err, slug }, "failed to start baileys session"),
    );

    return created;
  });

  app.post("/:id/assign", async (req) => {
    const { id } = req.params as { id: string };
    const { userIds } = assignSchema.parse(req.body);
    await prisma.$transaction([
      prisma.sessionAssignment.deleteMany({ where: { sessionId: id } }),
      ...userIds.map((userId) =>
        prisma.sessionAssignment.create({ data: { sessionId: id, userId } }),
      ),
    ]);
    return { ok: true, assigned: userIds.length };
  });

  app.post("/:id/exclusive", async (req) => {
    const { id } = req.params as { id: string };
    const { exclusive, ownerId } = exclusiveSchema.parse(req.body);
    return prisma.baileysSession.update({
      where: { id },
      data: { exclusive, exclusiveUserId: exclusive ? ownerId : null },
    });
  });

  /**
   * POST /api/sessions/:id/restart
   * Cierra el socket actual y abre uno nuevo (las credenciales sobreviven).
   */
  app.post("/:id/restart", async (req) => {
    const { id } = req.params as { id: string };
    const session = await prisma.baileysSession.findUnique({ where: { id } });
    if (!session) throw NotFound("Sesión no encontrada");
    await baileys.stopSession(session.slug);
    // No esperamos a que arranque, devolvemos el estado intermedio.
    baileys.startSession(session.slug).catch((err) =>
      req.log.error({ err, slug: session.slug }, "restart failed"),
    );
    return { ok: true, status: "Reconectando" };
  });

  app.delete("/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const session = await prisma.baileysSession.findUnique({ where: { id } });
    if (!session) throw NotFound("Sesión no encontrada");
    // Borra credenciales y cierra el socket antes de tirar el registro.
    await baileys.unlinkSession(session.slug);
    await prisma.baileysSession.delete({ where: { id } });
    reply.code(204).send();
  });
}
