// Cliente Socket.IO único. Comparte el HTTP server del backend, así que la URL
// base es VITE_WS_URL (definida en .env.local — apunta a localhost:3001 en dev,
// al subdominio público en prod).
//
// La conexión se mantiene viva durante toda la sesión del usuario. Si el JWT
// llegara a ser requerido para autenticar el handshake del socket, se añade
// vía `auth: { token }` aquí (el backend hoy no lo exige).

import { io } from "socket.io-client";

const WS_URL = import.meta.env.VITE_WS_URL || "";

export const socket = WS_URL
  ? io(WS_URL, {
      autoConnect: false,    // arrancamos manualmente desde el provider
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1500,
    })
  : null;

export function connectSocket() {
  if (socket && !socket.connected) socket.connect();
}
export function disconnectSocket() {
  if (socket?.connected) socket.disconnect();
}
