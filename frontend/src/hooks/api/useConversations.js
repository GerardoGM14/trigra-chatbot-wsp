import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/apiClient.js";

const KEY = ["conversations"];

export function useConversations({ status, assignedToMe, q } = {}) {
  return useQuery({
    queryKey: [...KEY, { status, assignedToMe, q }],
    queryFn: () => api.get("/api/conversations", { query: { status, assignedToMe, q } }),
    // Refresca cada 15s como red de seguridad; Socket.IO invalida en vivo.
    refetchInterval: 15_000,
  });
}

export function useConversation(id) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: () => api.get(`/api/conversations/${id}`),
    enabled: !!id,
    refetchInterval: 5_000,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.post(`/api/conversations/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useSendManual() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }) => api.post(`/api/conversations/${id}/send`, { body }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: [...KEY, vars.id] });
    },
  });
}

// Transición de estado: handoff / release / close.
export function useConversationAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }) => api.post(`/api/conversations/${id}/${action}`),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: [...KEY, vars.id] });
    },
  });
}
