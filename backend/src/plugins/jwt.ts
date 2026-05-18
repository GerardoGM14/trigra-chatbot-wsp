// Plugin JWT: añade `request.jwtVerify()` y `reply.jwtSign()`.
// El decorador `authenticate` se reutiliza en las rutas que requieren login.
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fjwt from "@fastify/jwt";
import { env } from "../config/env.js";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    user: {
      sub: string;        // user.id
      username: string;
      role: "Operador" | "Supervisor" | "Administrador";
    };
  }
}

export async function registerJwt(app: FastifyInstance) {
  await app.register(fjwt, {
    secret: env.JWT_SECRET,
    sign: { expiresIn: env.JWT_EXPIRES_IN },
  });

  app.decorate("authenticate", async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await req.jwtVerify();
    } catch {
      reply.code(401).send({ code: "UNAUTHORIZED", message: "Token inválido o expirado" });
    }
  });
}
