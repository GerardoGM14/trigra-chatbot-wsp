// Singleton del Prisma Client. Una sola instancia compartida por todo el
// proceso (los workers de BullMQ y los handlers HTTP comparten conexiones).
import { PrismaClient } from "@prisma/client";
import { env } from "../config/env.js";

export const prisma = new PrismaClient({
  log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});
