import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/apiClient.js";

export function useActivity({ level, scope, q, take } = {}) {
  return useQuery({
    queryKey: ["activity", { level, scope, q, take }],
    queryFn: () => api.get("/api/activity", { query: { level, scope, q, take } }),
  });
}
