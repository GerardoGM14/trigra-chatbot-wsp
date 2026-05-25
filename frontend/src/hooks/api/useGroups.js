import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/apiClient.js";

const KEY = ["groups"];

export function useGroups() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api.get("/api/groups"),
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.post("/api/groups", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }) => api.patch(`/api/groups/${id}`, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/api/groups/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
