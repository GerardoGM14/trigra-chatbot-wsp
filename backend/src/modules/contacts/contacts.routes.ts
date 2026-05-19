// REST de contactos. Listado paginado + filtros por grupo/búsqueda.
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { NotFound } from "../../lib/errors.js";

const querySchema = z.object({
  groupId: z.string().optional(),
  q: z.string().optional(),
  take: z.coerce.number().int().positive().max(200).default(50),
  skip: z.coerce.number().int().nonnegative().default(0),
});

const createContactSchema = z.object({
  groupId: z.string(),
  phone: z.string().regex(/^\+?\d{8,15}$/, "Formato E.164 esperado"),
  name: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export async function contactRoutes(app: FastifyInstance) {
  app.get("/", async (req) => {
    const { groupId, q, take, skip } = querySchema.parse(req.query);

    const where = {
      ...(groupId ? { groupId } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { phone: { contains: q.replace(/\s/g, "") } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.contact.findMany({ where, take, skip, orderBy: { createdAt: "desc" } }),
      prisma.contact.count({ where }),
    ]);

    return { rows, total };
  });

  app.get("/:id", async (req) => {
    const { id } = req.params as { id: string };
    const contact = await prisma.contact.findUnique({ where: { id } });
    if (!contact) throw NotFound("Contacto no encontrado");
    return contact;
  });

  app.post("/", async (req) => {
    const data = createContactSchema.parse(req.body);
    return prisma.contact.create({ data });
  });

  app.delete("/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    await prisma.contact.delete({ where: { id } });
    reply.code(204).send();
  });
}
