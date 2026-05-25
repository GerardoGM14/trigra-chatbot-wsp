import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/apiClient.js";

const KEY = ["campaigns"];

export function useCampaigns({ status, ownerId } = {}) {
  return useQuery({
    queryKey: [...KEY, { status, ownerId }],
    queryFn: () => api.get("/api/campaigns", { query: { status, ownerId } }),
  });
}

export function useCampaign(id) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: () => api.get(`/api/campaigns/${id}`),
    enabled: !!id,
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.post("/api/campaigns", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/api/campaigns/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

// Transiciones de estado (pause, resume, launch, archive) son endpoints
// POST sin body. Una sola mutation genérica con la acción como parámetro.
export function useCampaignAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }) => api.post(`/api/campaigns/${id}/${action}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
