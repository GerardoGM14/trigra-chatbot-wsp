// Hooks de gestión de usuarios contra /api/users.
//
// Patrón: una `useQuery` para leer, varias `useMutation` para escribir.
// Tras una mutation exitosa invalidamos la query del listado para forzar
// refetch. TanStack Query se encarga del cache y de la deduplicación.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/apiClient.js";

const KEY = ["users"];

export function useUsers() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api.get("/api/users"),
  });
}

export function useUser(id) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: () => api.get(`/api/users/${id}`),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.post("/api/users", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }) => api.patch(`/api/users/${id}`, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/api/users/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
