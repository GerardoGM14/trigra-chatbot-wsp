// Entrypoint: construye la app, monta Socket.IO encima del mismo HTTP server,
// arranca BullMQ workers, resume sesiones Baileys persistidas y enciende el listener.
import { buildApp } from "./app.js";
import { env } from "./config/env.js";
import { attachRealtime } from "./realtime/io.js";
import { startWorkers } from "./queues/workers.js";
import { resumeAllSessions } from "./baileys/index.js";

async function main() {
  const app = await buildApp();

  // Socket.IO comparte el mismo servidor HTTP que Fastify para que el reverse
  // proxy (Nginx) solo tenga que enrutar un puerto.
  attachRealtime(app);

  // BullMQ workers viven en el mismo proceso por ahora — cuando crezca, se
  // pueden mover a un proceso aparte sin cambiar nada del código de negocio.
  startWorkers(app.log);

  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    app.log.info(`✓ backend ready at http://${env.HOST}:${env.PORT}`);

    // Resume sesiones Baileys persistidas en disco. Lo hacemos DESPUÉS de
    // listen() para que /health responda durante la reconexión (puede tomar
    // varios segundos por sesión). Fire-and-forget; los errores se loguean.
    resumeAllSessions().catch((err) => app.log.error({ err }, "resumeAllSessions failed"));
  } catch (err) {
    app.log.error(err, "failed to start server");
    process.exit(1);
  }

  // Cierre ordenado: en SIGTERM/SIGINT cerramos Fastify, workers y conexiones.
  const shutdown = async (signal: string) => {
    app.log.info({ signal }, "shutting down");
    await app.close();
    process.exit(0);
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main();
