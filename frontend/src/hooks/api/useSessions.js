import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/apiClient.js";

const KEY = ["sessions"];

export function useSessions() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api.get("/api/sessions"),
    // Las sesiones cambian de estado con frecuencia (reconectando, etc.).
    // Refresca cada 10s mientras la pantalla esté abierta — más adelante se
    // sustituye por updates en vivo de Socket.IO.
    refetchInterval: 10_000,
  });
}

export function useAssignSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userIds }) => api.post(`/api/sessions/${id}/assign`, { userIds }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useSessionExclusive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, exclusive, ownerId }) =>
      api.post(`/api/sessions/${id}/exclusive`, { exclusive, ownerId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useRestartSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.post(`/api/sessions/${id}/restart`),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/api/sessions/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
