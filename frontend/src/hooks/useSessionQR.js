// Escucha el canal `session:<slug>` de Socket.IO para recibir QRs y estado
// de conexión de Baileys. El hook devuelve { qr, status, expiresAt } y
// dispara onConnected() cuando el backend confirma que la sesión está lista.

import { useEffect, useState } from "react";
import { socket } from "../lib/socket.js";

export function useSessionQR(slug, { onConnected } = {}) {
  const [qr, setQR] = useState(null);
  const [status, setStatus] = useState("Reconectando");
  const [expiresAt, setExpiresAt] = useState(null);

  useEffect(() => {
    if (!slug || !socket) return undefined;

    const channel = `session:${slug}`;
    const handler = (payload) => {
      if (payload?.type === "qr" && payload.qr) {
        setQR(payload.qr);
        setExpiresAt(payload.expiresAt ? new Date(payload.expiresAt) : null);
      }
      if (payload?.status) {
        setStatus(payload.status);
        if (payload.status === "Conectado") {
          setQR(null);
          onConnected?.(payload);
        }
      }
    };
    socket.on(channel, handler);
    return () => socket.off(channel, handler);
  }, [slug, onConnected]);

  return { qr, status, expiresAt };
}
