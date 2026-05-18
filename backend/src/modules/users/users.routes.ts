// REST de usuarios. Solo admin/supervisor pueden gestionar usuarios; los
// operadores pueden leer (necesario para el switch de "Asignar a operador").
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import bcrypt from "bcrypt";
import { prisma } from "../../lib/prisma.js";
import { Forbidden, NotFound } from "../../lib/errors.js";

const createUserSchema = z.object({
  username: z.string().min(3),
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["Operador", "Supervisor", "Administrador"]).default("Operador"),
});

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(["Operador", "Supervisor", "Administrador"]).optional(),
  status: z.enum(["Activo", "Suspendido", "Invitado"]).optional(),
});

function requireAdmin(role: string) {
  if (role !== "Administrador" && role !== "Supervisor") {
    throw Forbidden("Solo administradores y supervisores pueden gestionar usuarios");
  }
}

export async function userRoutes(app: FastifyInstance) {
  app.get("/", async () => {
    return prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, username: true, name: true, email: true, role: true, status: true, lastSeen: true, createdAt: true },
    });
  });

  app.get("/:id", async (req) => {
    const { id } = req.params as { id: string };
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, username: true, name: true, email: true, role: true, status: true, lastSeen: true, createdAt: true },
    });
    if (!user) throw NotFound("Usuario no encontrado");
    return user;
  });

  app.post("/", async (req) => {
    requireAdmin(req.user.role);
    const { password, ...rest } = createUserSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(password, 10);
    return prisma.user.create({
      data: { ...rest, passwordHash },
      select: { id: true, username: true, name: true, email: true, role: true, status: true },
    });
  });

  app.patch("/:id", async (req) => {
    requireAdmin(req.user.role);
    const { id } = req.params as { id: string };
    const data = updateUserSchema.parse(req.body);
    return prisma.user.update({
      where: { id },
      data,
      select: { id: true, username: true, name: true, email: true, role: true, status: true },
    });
  });

  app.delete("/:id", async (req, reply) => {
    requireAdmin(req.user.role);
    const { id } = req.params as { id: string };
    await prisma.user.delete({ where: { id } });
    reply.code(204).send();
  });
}
