// Conecta Socket.IO al arrancar la app y invalida las queries de TanStack
// cuando el backend emite eventos relevantes. Es la integración mínima viable:
//
//   · `session:*`   → invalida la lista de sesiones
//   · `campaign:*`  → invalida la lista de campañas + la campaña concreta
//
// Cuando Baileys aterrice, añadiremos canales específicos (QR, progreso de
// envío, etc.) sin cambiar la forma del hook.

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { socket, connectSocket, disconnectSocket } from "../lib/socket.js";

export function useRealtimeUpdates() {
  const qc = useQueryClient();

  useEffect(() => {
    if (!socket) return undefined;
    connectSocket();

    // El backend emite con el formato `session:<slug>` y `campaign:<slug>`. Aquí
    // escuchamos por wildcard nuevo de socket.io 4 (onAny) y filtramos por
    // prefijo. Es más simple que registrar un listener por slug.
    const onAny = (event) => {
      if (event.startsWith("session:")) {
        qc.invalidateQueries({ queryKey: ["sessions"] });
      } else if (event.startsWith("campaign:")) {
        qc.invalidateQueries({ queryKey: ["campaigns"] });
      }
    };
    socket.onAny(onAny);

    // Canal de bandeja: cualquier mensaje nuevo o cambio de estado refresca
    // la lista + el detalle de la conversación afectada.
    const onConversations = (payload) => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      if (payload?.conversationId) {
        qc.invalidateQueries({ queryKey: ["conversations", payload.conversationId] });
      }
    };
    socket.on("conversations", onConversations);

    return () => {
      socket.offAny(onAny);
      socket.off("conversations", onConversations);
      disconnectSocket();
    };
  }, [qc]);
}
