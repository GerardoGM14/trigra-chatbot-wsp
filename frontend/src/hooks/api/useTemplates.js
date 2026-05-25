import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/apiClient.js";

const KEY = ["templates"];

export function useTemplates() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api.get("/api/templates"),
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.post("/api/templates", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }) => api.patch(`/api/templates/${id}`, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/api/templates/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
