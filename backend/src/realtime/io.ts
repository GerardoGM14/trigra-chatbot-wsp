// Socket.IO comparte el HTTP server de Fastify para que el reverse proxy solo
// enrute un puerto. Los canales por dominio se publicarán cuando Baileys y la
// cola de envíos los emitan; por ahora dejamos un `pong` de prueba.
import type { FastifyInstance } from "fastify";
import { Server } from "socket.io";
import { env } from "../config/env.js";

let io: Server | null = null;

export function attachRealtime(app: FastifyInstance) {
  io = new Server(app.server, {
    cors: {
      origin: env.CORS_ORIGIN.split(",").map((s) => s.trim()),
      credentials: true,
    },
    path: "/socket.io",
  });

  io.on("connection", (socket) => {
    app.log.info({ socketId: socket.id }, "socket connected");

    // Canal de prueba para validar conexión desde el frontend.
    socket.on("ping", (cb?: (m: string) => void) => {
      cb?.("pong");
    });

    socket.on("disconnect", (reason) => {
      app.log.info({ socketId: socket.id, reason }, "socket disconnected");
    });
  });
}

// Helpers para emitir desde otros módulos (campaigns/sessions) sin acoplarlos
// a Socket.IO directamente.
export function emitSessionUpdate(sessionSlug: string, payload: unknown) {
  io?.emit(`session:${sessionSlug}`, payload);
}
export function emitCampaignProgress(campaignSlug: string, payload: unknown) {
  io?.emit(`campaign:${campaignSlug}`, payload);
}
