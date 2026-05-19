// REST de sesiones Baileys. La creación/conexión real con WhatsApp la hace
// el módulo `baileys/` cuando lo conectemos; aquí solo manejamos metadatos
// + asignaciones operador↔sesión.
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { NotFound } from "../../lib/errors.js";

const assignSchema = z.object({
  userIds: z.array(z.string()),
});

const exclusiveSchema = z.object({
  exclusive: z.boolean(),
  ownerId: z.string().nullable().optional(),
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

  // POST /api/sessions/:id/assign  { userIds: [] }
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

  // POST /api/sessions/:id/restart → marca como Reconectando.
  // El módulo Baileys real cierra el socket y reabre cuando esté conectado.
  app.post("/:id/restart", async (req) => {
    const { id } = req.params as { id: string };
    return prisma.baileysSession.update({
      where: { id },
      data: { status: "Reconectando" },
    });
  });

  app.delete("/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    await prisma.baileysSession.delete({ where: { id } });
    reply.code(204).send();
  });
}
