// Conexión Redis compartida. BullMQ pide que su conexión NO se use para nada
// más (createConnection internamente la "secuestra"), así que exportamos dos:
//   · redis        → uso general (cache, pub/sub si hace falta más adelante)
//   · bullConnection → solo para BullMQ
import { Redis } from "ioredis";
import { env } from "../config/env.js";

// BullMQ requiere maxRetriesPerRequest:null para que sus comandos no fallen
// con timeouts cortos cuando un job está esperando.
const baseOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

export const redis = new Redis(env.REDIS_URL, {
  ...baseOptions,
  keyPrefix: `${env.REDIS_PREFIX}:`,
});

export const bullConnection = new Redis(env.REDIS_URL, baseOptions);
