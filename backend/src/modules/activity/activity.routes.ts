// GET /api/activity — feed de auditoría con filtros (level, scope, q).
// La inserción de entradas la hace cada módulo internamente cuando ocurre algo
// relevante (no expongo POST público porque cualquier cliente podría falsificar
// logs si no validamos el origen).
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";

const querySchema = z.object({
  level: z.enum(["ok", "info", "warn", "err"]).optional(),
  scope: z.enum(["user", "system"]).optional(),
  q: z.string().optional(),
  take: z.coerce.number().int().positive().max(500).default(100),
});

export async function activityRoutes(app: FastifyInstance) {
  app.get("/", async (req) => {
    const { level, scope, q, take } = querySchema.parse(req.query);

    const where = {
      ...(level ? { level } : {}),
      ...(scope === "user" ? { userId: { not: null } } : {}),
      ...(scope === "system" ? { userId: null } : {}),
      ...(q
        ? {
            OR: [
              { action: { contains: q, mode: "insensitive" as const } },
              { target: { contains: q, mode: "insensitive" as const } },
              { detail: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    return prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      include: { user: { select: { username: true } } },
    });
  });
}
