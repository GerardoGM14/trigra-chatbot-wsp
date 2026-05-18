// Hook global de errores: convierte HttpError + ZodError + unknowns en
// respuestas JSON consistentes con la forma { code, message, details? }.
import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { HttpError } from "../lib/errors.js";

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((err, req, reply) => {
    if (err instanceof HttpError) {
      reply.code(err.statusCode).send({ code: err.code, message: err.message });
      return;
    }
    if (err instanceof ZodError) {
      reply.code(400).send({
        code: "VALIDATION_ERROR",
        message: "Petición inválida",
        details: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      });
      return;
    }
    // Fastify ya formatea sus propios validation errors si usas schemas JSON
    // en `route.schema`; los pasamos tal cual.
    const fErr = err as { validation?: unknown; message?: string };
    if (fErr.validation) {
      reply.code(400).send({
        code: "VALIDATION_ERROR",
        message: fErr.message ?? "Petición inválida",
        details: fErr.validation,
      });
      return;
    }

    req.log.error({ err }, "unhandled error");
    reply.code(500).send({ code: "INTERNAL", message: "Error interno del servidor" });
  });
}
