// Carga + valida todas las variables de entorno con Zod. El servidor falla
// rápido al arrancar si falta o tiene tipo equivocado alguna variable.
import { config } from "dotenv";
import { z } from "zod";

config();

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  HOST: z.string().default("0.0.0.0"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  CORS_ORIGIN: z.string().min(1),

  DATABASE_URL: z.string().min(1, "DATABASE_URL es obligatorio"),
  REDIS_URL: z.string().min(1, "REDIS_URL es obligatorio"),
  REDIS_PREFIX: z.string().min(1).default("wsp"),

  JWT_SECRET: z.string().min(32, "JWT_SECRET debe tener al menos 32 caracteres"),
  JWT_EXPIRES_IN: z.string().default("8h"),

  UPLOAD_DIR: z.string().default("./uploads"),
  BAILEYS_AUTH_DIR: z.string().default("./baileys-auth"),

  SEND_RATE_PER_MINUTE: z.coerce.number().int().positive().default(60),
  SEND_PAUSE_MIN_SECONDS: z.coerce.number().int().nonnegative().default(2),
  SEND_PAUSE_MAX_SECONDS: z.coerce.number().int().nonnegative().default(6),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("✗ Invalid environment variables:");
  for (const issue of parsed.error.issues) {
    console.error(`  · ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
