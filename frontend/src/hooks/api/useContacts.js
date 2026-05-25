import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/apiClient.js";

// El listado depende de grupo + búsqueda + paginación. Lo metemos en el key
// para que TanStack Query trate cada combinación como una query distinta.
export function useContacts({ groupId, q, take, skip } = {}) {
  return useQuery({
    queryKey: ["contacts", { groupId, q, take, skip }],
    queryFn: () => api.get("/api/contacts", { query: { groupId, q, take, skip } }),
    enabled: !!groupId,        // sin grupo seleccionado no llamamos.
  });
}

export function useCreateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.post("/api/contacts", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
      qc.invalidateQueries({ queryKey: ["groups"] }); // por el contador
    },
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/api/contacts/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
      qc.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}
