// REST de flows (bot menus).
//
//   GET    /api/flows                  → lista de flows
//   GET    /api/flows/:id              → detalle + nodos
//   POST   /api/flows                  → crear flow
//   PATCH  /api/flows/:id              → editar metadatos del flow
//   DELETE /api/flows/:id              → borrar flow (cascada borra nodos)
//
//   POST   /api/flows/:id/nodes        → añadir nodo
//   PATCH  /api/flows/:id/nodes/:nid   → editar nodo
//   DELETE /api/flows/:id/nodes/:nid   → borrar nodo
//   POST   /api/flows/:id/start        → set startNodeId

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { NotFound, Forbidden } from "../../lib/errors.js";

const upsertFlowSchema = z.object({
  name: z.string().min(1),
  trigger: z.string().default("default"),
  isActive: z.boolean().default(true),
});

const upsertNodeSchema = z.object({
  type: z.enum(["message", "menu", "handoff", "end"]),
  body: z.string().min(1),
  options: z.unknown().optional(),
});

function requireAdmin(role: string) {
  if (role !== "Administrador" && role !== "Supervisor") {
    throw Forbidden("Solo administradores y supervisores pueden editar flows");
  }
}

export async function flowRoutes(app: FastifyInstance) {
  app.get("/", async () =>
    prisma.flow.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { nodes: true } } },
    }),
  );

  app.get("/:id", async (req) => {
    const { id } = req.params as { id: string };
    const flow = await prisma.flow.findUnique({
      where: { id },
      include: { nodes: true },
    });
    if (!flow) throw NotFound("Flow no encontrado");
    return flow;
  });

  app.post("/", async (req) => {
    requireAdmin(req.user.role);
    const data = upsertFlowSchema.parse(req.body);
    return prisma.flow.create({ data });
  });

  app.patch("/:id", async (req) => {
    requireAdmin(req.user.role);
    const { id } = req.params as { id: string };
    const data = upsertFlowSchema.partial().parse(req.body);
    return prisma.flow.update({ where: { id }, data });
  });

  app.delete("/:id", async (req, reply) => {
    requireAdmin(req.user.role);
    const { id } = req.params as { id: string };
    await prisma.flow.delete({ where: { id } });
    reply.code(204).send();
  });

  // ----- Nodos -----
  app.post("/:id/nodes", async (req) => {
    requireAdmin(req.user.role);
    const { id } = req.params as { id: string };
    const data = upsertNodeSchema.parse(req.body);
    return prisma.flowNode.create({
      data: {
        flowId: id,
        type: data.type,
        body: data.body,
        options: (data.options ?? undefined) as never,
      },
    });
  });

  app.patch("/:id/nodes/:nid", async (req) => {
    requireAdmin(req.user.role);
    const { nid } = req.params as { nid: string };
    const data = upsertNodeSchema.partial().parse(req.body);
    return prisma.flowNode.update({
      where: { id: nid },
      data: {
        ...data,
        options: data.options === undefined ? undefined : (data.options as never),
      },
    });
  });

  app.delete("/:id/nodes/:nid", async (req, reply) => {
    requireAdmin(req.user.role);
    const { nid } = req.params as { nid: string };
    await prisma.flowNode.delete({ where: { id: nid } });
    reply.code(204).send();
  });

  app.post("/:id/start", async (req) => {
    requireAdmin(req.user.role);
    const { id } = req.params as { id: string };
    const { nodeId } = z.object({ nodeId: z.string() }).parse(req.body);
    return prisma.flow.update({ where: { id }, data: { startNodeId: nodeId } });
  });
}
