// Módulo Baileys — estructura preparada, conexión real diferida.
//
// Plan cuando se active:
//   1. Cada BaileysSession tiene su propio socket WhatsApp aislado.
//   2. Las credenciales (creds.json) se persisten en BAILEYS_AUTH_DIR/<slug>/
//      para que sobrevivan reinicios del proceso Node.
//   3. Los eventos de conexión/QR/desconexión se publican vía Socket.IO al
//      frontend (canal `session:<slug>`).
//   4. `send(sessionSlug, phone, body)` lo llama el worker BullMQ.
//
// Por ahora exportamos firmas con bodies que lanzan "Not implemented" para que
// las rutas que dependen de Baileys compilen y fallen ruidosamente en runtime
// hasta que aterrice la integración.

export type BaileysQRPayload = {
  sessionSlug: string;
  qr: string;        // QR como data URL (data:image/png;base64,...)
  expiresAt: Date;
};

export type BaileysStatus = "Conectado" | "Reconectando" | "Desconectado";

/**
 * Inicia la conexión Baileys para una sesión. Si ya existe credenciales en
 * disco, intenta reconectar; si no, emite un QR vía Socket.IO.
 */
export async function startSession(_sessionSlug: string): Promise<void> {
  throw new Error("Baileys integration not implemented yet");
}

/**
 * Cierra el socket WhatsApp de la sesión sin borrar credenciales.
 */
export async function stopSession(_sessionSlug: string): Promise<void> {
  throw new Error("Baileys integration not implemented yet");
}

/**
 * Borra completamente las credenciales de la sesión. Tras esto será necesario
 * volver a escanear QR para reconectar.
 */
export async function unlinkSession(_sessionSlug: string): Promise<void> {
  throw new Error("Baileys integration not implemented yet");
}

/**
 * Envía un mensaje a través de la sesión indicada. La forma del payload se
 * decide cuando se conecte Baileys real — por ahora solo aceptamos texto plano.
 */
export async function sendMessage(
  _sessionSlug: string,
  _phone: string,
  _body: string,
): Promise<{ ok: true; messageId: string }> {
  throw new Error("Baileys integration not implemented yet");
}
