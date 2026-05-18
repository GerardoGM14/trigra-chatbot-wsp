// GET /health — endpoint trivial para PM2/Nginx/uptime checks.
// Si la DB está caída este endpoint sigue respondiendo 200; un /health/deep
// que verifique conexiones se puede añadir cuando importe.
import type { FastifyInstance } from "fastify";

export async function healthRoutes(app: FastifyInstance) {
  app.get("/", async () => ({
    ok: true,
    service: "wsp-control-backend",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }));
}
