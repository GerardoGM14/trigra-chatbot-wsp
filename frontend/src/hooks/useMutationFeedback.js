// Helper para mostrar toast tras una mutation. Patrón usado en todas las
// pantallas:
//
//   const onSuccess = useMutationFeedback("Usuario creado.");
//   const onError = useMutationError("No se pudo crear el usuario.");
//   create.mutate(body, { onSuccess, onError });
//
// Separamos en dos hooks distintos para que el caller pueda dejar uno sin tocar
// si solo quiere uno de los dos.

import { useToast } from "../lib/toast.jsx";
import { ApiError } from "../lib/apiClient.js";

export function useMutationFeedback(message, tone = "ok") {
  const { toast } = useToast();
  return () => toast[tone](message);
}

export function useMutationError(fallback = "Ocurrió un error.") {
  const { toast } = useToast();
  return (err) => {
    const msg = err instanceof ApiError ? err.message : fallback;
    toast.err(msg);
  };
}
