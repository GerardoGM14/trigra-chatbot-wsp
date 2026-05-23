// QueryClient único de TanStack Query. Lo construimos con defaults razonables
// para un panel interno: cache moderada, no reintentar errores de validación,
// reintentar errores de red.

import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "./apiClient.js";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 30s antes de considerar los datos "stale". Para listados que cambian
      // con frecuencia (campañas en envío) los pantallazos ponen staleTime: 0.
      staleTime: 30_000,
      // Reintenta hasta 2 veces para errores transitorios, pero no para 4xx
      // (validación, auth) — ahí el retry no soluciona nada.
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
