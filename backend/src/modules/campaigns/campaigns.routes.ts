// REST de campañas. Las transiciones de estado (pausar/reanudar/lanzar) son
// endpoints separados para que el frontend pueda llamarlos sin pasar el cuerpo
// completo de la campaña. La cola BullMQ se conecta más adelante.
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { NotFound } from "../../lib/errors.js";

const querySchema = z.object({
  status: z.enum(["Borrador", "Programada", "Enviando", "Pausada", "Completada", "Archivada"]).optional(),
  ownerId: z.string().optional(),
});

const createSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(["Texto", "Imagen", "Video", "Documento", "Lista", "Botones"]),
  body: z.string().min(1),
  ownerId: z.string(),
  templateId: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
  groupIds: z.array(z.string()).default([]),
  items: z.unknown().optional(),
});

export async function campaignRoutes(app: FastifyInstance) {
  app.get("/", async (req) => {
    const { status, ownerId } = querySchema.parse(req.query);
    const where = { ...(status ? { status } : {}), ...(ownerId ? { ownerId } : {}) };
    return prisma.campaign.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { owner: { select: { username: true } } },
    });
  });

  app.get("/:id", async (req) => {
    const { id } = req.params as { id: string };
    const c = await prisma.campaign.findUnique({
      where: { id },
      include: {
        owner: { select: { username: true, name: true } },
        groups: { include: { group: true } },
        template: true,
      },
    });
    if (!c) throw NotFound("Campaña no encontrada");
    return c;
  });

  app.post("/", async (req) => {
    const { groupIds, items, scheduledAt, ...rest } = createSchema.parse(req.body);
    return prisma.campaign.create({
      data: {
        ...rest,
        items: (items ?? undefined) as never,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        groups: { create: groupIds.map((groupId) => ({ groupId })) },
      },
      include: { groups: true },
    });
  });

  // Transiciones de estado — endpoints concretos para que el frontend dispare
  // acciones sin enviar el cuerpo completo.
  app.post("/:id/pause", async (req) => {
    const { id } = req.params as { id: string };
    return prisma.campaign.update({ where: { id }, data: { status: "Pausada" } });
  });
  app.post("/:id/resume", async (req) => {
    const { id } = req.params as { id: string };
    return prisma.campaign.update({ where: { id }, data: { status: "Enviando" } });
  });
  app.post("/:id/launch", async (req) => {
    const { id } = req.params as { id: string };
    // TODO: enrolar SendJobs en BullMQ.
    return prisma.campaign.update({ where: { id }, data: { status: "Enviando" } });
  });
  app.post("/:id/archive", async (req) => {
    const { id } = req.params as { id: string };
    return prisma.campaign.update({ where: { id }, data: { status: "Archivada" } });
  });

  app.delete("/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    await prisma.campaign.delete({ where: { id } });
    reply.code(204).send();
  });
}
