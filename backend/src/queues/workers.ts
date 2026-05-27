// Worker que procesa los SendJobs de la cola.
// Llama a `baileys.sendMessage(slug, phone, body)` por cada job.
// Si la sesión no está conectada cuando intenta enviar, el job falla y BullMQ
// reintenta con backoff exponencial (ver sendQueue.ts).

import { Worker } from "bullmq";
import type { FastifyBaseLogger } from "fastify";
import { bullConnection } from "../lib/redis.js";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { emitCampaignProgress } from "../realtime/io.js";
import * as baileys from "../baileys/index.js";
import type { SendJobPayload } from "./sendQueue.js";

let worker: Worker<SendJobPayload> | null = null;

export function startWorkers(log: FastifyBaseLogger) {
  worker = new Worker<SendJobPayload>(
    "send",
    async (job) => {
      const { sendJobId, campaignId, sessionId, phone, body } = job.data;

      // Resolver el slug de la sesión (el worker recibe el id interno UUID).
      const session = await prisma.baileysSession.findUnique({ where: { id: sessionId } });
      if (!session) throw new Error(`Session ${sessionId} not found`);

      log.info({ slug: session.slug, phone }, "→ send");
      const result = await baileys.sendMessage(session.slug, phone, body);

      // Persistimos el SendJob como enviado + incrementamos el contador de la campaña.
      await prisma.$transaction([
        prisma.sendJob.update({
          where: { id: sendJobId },
          data: { status: "Enviado", sentAt: new Date(), errorMessage: null },
        }),
        prisma.campaign.update({
          where: { id: campaignId },
          data: { sent: { increment: 1 } },
        }),
      ]);

      // Notifica al frontend en vivo del progreso.
      const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
      if (campaign) {
        const progress = campaign.total > 0 ? Math.round((campaign.sent / campaign.total) * 100) : 0;
        emitCampaignProgress(campaign.slug, {
          sent: campaign.sent,
          total: campaign.total,
          progress,
        });
      }

      return result;
    },
    {
      connection: bullConnection,
      prefix: env.REDIS_PREFIX,
      limiter: {
        // Rate limit global — protege la cuenta de WhatsApp del baneo.
        // Cada sesión Baileys es un cliente WSP independiente, pero compartir
        // un límite global previene picos cuando varias sesiones envían a la vez.
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

      // Incrementa el contador de fallidos de la campaña.
      prisma.campaign.update({
        where: { id: job.data.campaignId },
        data: { failed: { increment: 1 } },
      }).catch(() => { /* swallow */ });
    }
  });

  worker.on("ready", () => log.info("✓ send worker ready"));
}

export async function stopWorkers() {
  await worker?.close();
}
