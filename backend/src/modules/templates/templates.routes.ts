// REST de plantillas. CRUD básico + endpoint para incrementar el contador
// `usedCount` cuando una campaña arranca desde una plantilla.
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { NotFound } from "../../lib/errors.js";

const upsertSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["Texto", "Lista", "Botones", "Media"]),
  body: z.string().min(1),
  items: z.unknown().optional(), // estructura libre — la valida el frontend al renderizar
});

const createSchema = upsertSchema.extend({
  slug: z.string().min(1).regex(/^[a-z0-9_]+$/),
});

export async function templateRoutes(app: FastifyInstance) {
  app.get("/", async () => {
    return prisma.template.findMany({ orderBy: { updatedAt: "desc" } });
  });

  app.get("/:id", async (req) => {
    const { id } = req.params as { id: string };
    const tpl = await prisma.template.findUnique({ where: { id } });
    if (!tpl) throw NotFound("Plantilla no encontrada");
    return tpl;
  });

  app.post("/", async (req) => {
    const data = createSchema.parse(req.body);
    return prisma.template.create({
      data: {
        slug: data.slug,
        name: data.name,
        type: data.type,
        body: data.body,
        items: (data.items ?? undefined) as never,
      },
    });
  });

  app.patch("/:id", async (req) => {
    const { id } = req.params as { id: string };
    const data = upsertSchema.partial().parse(req.body);
    return prisma.template.update({
      where: { id },
      data: {
        ...data,
        items: data.items === undefined ? undefined : (data.items as never),
      },
    });
  });

  app.delete("/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    await prisma.template.delete({ where: { id } });
    reply.code(204).send();
  });
}
