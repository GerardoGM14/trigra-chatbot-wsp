// Lógica de negocio de autenticación. Las rutas son delgadas y delegan aquí.
import bcrypt from "bcrypt";
import { prisma } from "../../lib/prisma.js";
import { Unauthorized } from "../../lib/errors.js";

export async function verifyCredentials(username: string, password: string) {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) throw Unauthorized("Usuario o contraseña incorrectos");
  if (user.status === "Suspendido") throw Unauthorized("Cuenta suspendida");

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw Unauthorized("Usuario o contraseña incorrectos");

  // Actualizamos lastSeen — sin esperar (fire-and-forget) para no añadir
  // latencia al login en el camino crítico.
  prisma.user.update({
    where: { id: user.id },
    data: { lastSeen: new Date() },
  }).catch(() => { /* swallow: lastSeen no es crítico */ });

  return user;
}

// Por ahora la "recuperación de contraseña" solo registra la solicitud — el
// envío real del email lo harás cuando integres un proveedor (SendGrid, SES,
// SMTP propio). Devolvemos siempre 200 para no filtrar qué emails existen.
export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    // TODO: encolar email con token de un solo uso (BullMQ job).
    console.log(`[auth] password reset requested for ${email}`);
  }
  return { ok: true };
}
