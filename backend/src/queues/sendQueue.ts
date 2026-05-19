// Cola BullMQ para los envíos individuales (un mensaje por job).
// El rate-limit del worker respeta la política `maxRatePerMinute` por sesión.
import { Queue, QueueEvents } from "bullmq";
import { bullConnection } from "../lib/redis.js";
import { env } from "../config/env.js";

export type SendJobPayload = {
  sendJobId: string;     // PK del modelo SendJob en Postgres
  campaignId: string;
  sessionId: string;     // qué sesión Baileys ejecuta el envío
  phone: string;
  body: string;          // texto resuelto (ya con variables sustituidas)
};

// `prefix` separa nuestras claves del resto de apps que compartan Redis.
export const sendQueue = new Queue<SendJobPayload>("send", {
  connection: bullConnection,
  prefix: env.REDIS_PREFIX,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 4000 },
    removeOnComplete: 1000,    // mantiene últimos 1000 completados para auditoría
    removeOnFail: 5000,
  },
});

export const sendQueueEvents = new QueueEvents("send", {
  connection: bullConnection,
  prefix: env.REDIS_PREFIX,
});
