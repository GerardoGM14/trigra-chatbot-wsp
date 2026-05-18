// POST /auth/login         → emite JWT
// POST /auth/forgot         → solicita recuperación
// GET  /auth/me             → datos del usuario actual (requiere token)
import type { FastifyInstance } from "fastify";
import { loginSchema, forgotPasswordSchema } from "./auth.schemas.js";
import { verifyCredentials, requestPasswordReset } from "./auth.service.js";

export async function authRoutes(app: FastifyInstance) {
  app.post("/login", async (req, reply) => {
    const { username, password } = loginSchema.parse(req.body);
    const user = await verifyCredentials(username, password);

    const token = await reply.jwtSign({
      sub: user.id,
      username: user.username,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    };
  });

  app.post("/forgot", async (req) => {
    const { email } = forgotPasswordSchema.parse(req.body);
    return requestPasswordReset(email);
  });

  // Requiere autenticación → la ruta sí pasa por el authenticate hook.
  app.get("/me", { onRequest: [app.authenticate] }, async (req) => {
    return { user: req.user };
  });
}
