import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/apiClient.js";

const KEY = ["flows"];

export function useFlows() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api.get("/api/flows"),
  });
}

export function useFlow(id) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: () => api.get(`/api/flows/${id}`),
    enabled: !!id,
  });
}

export function useCreateFlow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.post("/api/flows", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateFlow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }) => api.patch(`/api/flows/${id}`, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteFlow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/api/flows/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

// Nodos
export function useCreateNode(flowId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.post(`/api/flows/${flowId}/nodes`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...KEY, flowId] }),
  });
}

export function useUpdateNode(flowId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }) => api.patch(`/api/flows/${flowId}/nodes/${id}`, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...KEY, flowId] }),
  });
}

export function useDeleteNode(flowId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/api/flows/${flowId}/nodes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...KEY, flowId] }),
  });
}

export function useSetStartNode(flowId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (nodeId) => api.post(`/api/flows/${flowId}/start`, { nodeId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...KEY, flowId] }),
  });
}
