// Errores HTTP tipados. Las rutas pueden lanzarlos y un hook global los
// convierte en respuestas JSON consistentes.
export class HttpError extends Error {
  constructor(public statusCode: number, message: string, public code?: string) {
    super(message);
    this.name = "HttpError";
  }
}

export const Unauthorized = (msg = "No autorizado") => new HttpError(401, msg, "UNAUTHORIZED");
export const Forbidden = (msg = "Acceso prohibido") => new HttpError(403, msg, "FORBIDDEN");
export const NotFound = (msg = "Recurso no encontrado") => new HttpError(404, msg, "NOT_FOUND");
export const Conflict = (msg = "Conflicto") => new HttpError(409, msg, "CONFLICT");
export const BadRequest = (msg = "Petición inválida") => new HttpError(400, msg, "BAD_REQUEST");
