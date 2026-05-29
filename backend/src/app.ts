// Construye la instancia Fastify con todos los plugins y rutas montados.
// Lo separamos de server.ts para que los tests puedan instanciar la app sin
// arrancar el listener TCP.
import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import { env } from "./config/env.js";
import { registerJwt } from "./plugins/jwt.js";
import { registerErrorHandler } from "./plugins/errorHandler.js";
import { healthRoutes } from "./modules/health/health.routes.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { userRoutes } from "./modules/users/users.routes.js";
import { groupRoutes } from "./modules/groups/groups.routes.js";
import { contactRoutes } from "./modules/contacts/contacts.routes.js";
import { templateRoutes } from "./modules/templates/templates.routes.js";
import { campaignRoutes } from "./modules/campaigns/campaigns.routes.js";
import { activityRoutes } from "./modules/activity/activity.routes.js";
import { sessionRoutes } from "./modules/sessions/sessions.routes.js";
import { conversationRoutes } from "./modules/conversations/conversations.routes.js";
import { flowRoutes } from "./modules/flows/flows.routes.js";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === "production" ? "info" : "debug",
      transport: env.NODE_ENV === "development"
        ? { target: "pino-pretty", options: { translateTime: "HH:MM:ss", ignore: "pid,hostname" } }
        : undefined,
    },
    disableRequestLogging: false,
  });

  // ----- plugins de infraestructura -----
  await app.register(cors, {
    origin: env.CORS_ORIGIN.split(",").map((s) => s.trim()),
    credentials: true,
  });
  await app.register(rateLimit, {
    max: 300,
    timeWindow: "1 minute",
    // Saltamos el rate limit para /health (Nginx/PM2 lo pingean seguido).
    skipOnError: true,
  });
  await app.register(multipart, {
    limits: {
      fileSize: 100 * 1024 * 1024, // 100 MB (CSV grandes, videos)
      files: 1,
    },
  });
  await registerJwt(app);
  registerErrorHandler(app);

  // ----- rutas públicas -----
  await app.register(healthRoutes, { prefix: "/health" });
  await app.register(authRoutes, { prefix: "/auth" });

  // ----- rutas protegidas (todas montadas bajo /api) -----
  app.register(async (api) => {
    api.addHook("onRequest", app.authenticate);

    await api.register(userRoutes, { prefix: "/users" });
    await api.register(groupRoutes, { prefix: "/groups" });
    await api.register(contactRoutes, { prefix: "/contacts" });
    await api.register(templateRoutes, { prefix: "/templates" });
    await api.register(campaignRoutes, { prefix: "/campaigns" });
    await api.register(activityRoutes, { prefix: "/activity" });
    await api.register(sessionRoutes, { prefix: "/sessions" });
    await api.register(conversationRoutes, { prefix: "/conversations" });
    await api.register(flowRoutes, { prefix: "/flows" });
  }, { prefix: "/api" });

  return app;
}
