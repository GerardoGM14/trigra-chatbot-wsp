// Entrypoint: construye la app, monta Socket.IO encima del mismo HTTP server,
// arranca BullMQ workers y enciende el listener.
import { buildApp } from "./app.js";
import { env } from "./config/env.js";
import { attachRealtime } from "./realtime/io.js";
import { startWorkers } from "./queues/workers.js";

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
