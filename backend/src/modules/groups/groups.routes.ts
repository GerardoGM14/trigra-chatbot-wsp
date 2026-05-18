// REST de grupos de contactos. La importación CSV vive aquí también porque
// crea un grupo nuevo + sus contactos en una transacción.
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { NotFound } from "../../lib/errors.js";

const createGroupSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9_]+$/, "minúsculas/dígitos/guion bajo"),
  name: z.string().min(1),
  tag: z.string().min(1).default("Clientes"),
});

const updateGroupSchema = z.object({
  name: z.string().min(1).optional(),
  tag: z.string().min(1).optional(),
});

export async function groupRoutes(app: FastifyInstance) {
  app.get("/", async () => {
    const groups = await prisma.contactGroup.findMany({
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { contacts: true } } },
    });
    return groups.map((g) => ({
      id: g.id,
      slug: g.slug,
      name: g.name,
      tag: g.tag,
      count: g._count.contacts,
      updated: g.updatedAt.toISOString(),
    }));
  });

  app.get("/:id", async (req) => {
    const { id } = req.params as { id: string };
    const group = await prisma.contactGroup.findUnique({
      where: { id },
      include: { _count: { select: { contacts: true } } },
    });
    if (!group) throw NotFound("Grupo no encontrado");
    return {
      id: group.id,
      slug: group.slug,
      name: group.name,
      tag: group.tag,
      count: group._count.contacts,
      updated: group.updatedAt.toISOString(),
    };
  });

  app.post("/", async (req) => {
    const data = createGroupSchema.parse(req.body);
    return prisma.contactGroup.create({ data });
  });

  app.patch("/:id", async (req) => {
    const { id } = req.params as { id: string };
    const data = updateGroupSchema.parse(req.body);
    return prisma.contactGroup.update({ where: { id }, data });
  });

  app.delete("/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    await prisma.contactGroup.delete({ where: { id } });
    reply.code(204).send();
  });
}
