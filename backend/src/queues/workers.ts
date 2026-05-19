// Worker que procesa los SendJobs de la cola.
// Stub por ahora: marca el job como Enviado tras un pequeño delay, sin tocar
// Baileys. Cuando se conecte la integración real, sustituye el bloque
// `processJob` por una llamada a `baileys.send(sessionId, phone, body)`.
import { Worker } from "bullmq";
import type { FastifyBaseLogger } from "fastify";
import { bullConnection } from "../lib/redis.js";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { emitCampaignProgress } from "../realtime/io.js";
import type { SendJobPayload } from "./sendQueue.js";

let worker: Worker<SendJobPayload> | null = null;

export function startWorkers(log: FastifyBaseLogger) {
  // Rate limit a nivel del worker — cada sesión Baileys también tendrá su
  // propio rate limit interno; este es la barrera global.
  worker = new Worker<SendJobPayload>(
    "send",
    async (job) => {
      const { sendJobId, campaignId, phone, body } = job.data;
      log.info({ phone, body: body.slice(0, 40) }, "→ stub send");

      // TODO: aquí va la llamada real a Baileys.
      await new Promise((r) => setTimeout(r, 200));

      // Actualizamos el SendJob persistido + contadores de la campaña.
      await prisma.$transaction([
        prisma.sendJob.update({
          where: { id: sendJobId },
          data: { status: "Enviado", sentAt: new Date() },
        }),
        prisma.campaign.update({
          where: { id: campaignId },
          data: { sent: { increment: 1 } },
        }),
      ]);

      // Notifica al frontend en vivo.
      const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
      if (campaign) {
        const progress = campaign.total > 0 ? Math.round((campaign.sent / campaign.total) * 100) : 0;
        emitCampaignProgress(campaign.slug, { sent: campaign.sent, total: campaign.total, progress });
      }
    },
    {
      connection: bullConnection,
      prefix: env.REDIS_PREFIX,
      limiter: {
        max: env.SEND_RATE_PER_MINUTE,
        duration: 60_000,
      },
      concurrency: 5,
    },
  );

  worker.on("failed", (job, err) => {
    log.error({ jobId: job?.id, err: err.message }, "✗ send job failed");
    if (job) {
      prisma.sendJob.update({
        where: { id: job.data.sendJobId },
        data: {
          status: "Fallido",
          attempts: { increment: 1 },
          errorMessage: err.message.slice(0, 500),
        },
      }).catch(() => { /* swallow */ });
    }
  });

  worker.on("ready", () => log.info("✓ send worker ready"));
}

export async function stopWorkers() {
  await worker?.close();
}
