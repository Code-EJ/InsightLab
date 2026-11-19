import { useQuery } from "@tanstack/react-query"
import { api, filterQuery } from "@/lib/api"
import type { Filters } from "@/types/analytics"

/**
 * Consulta a API e isola o cache pela base e pela URL efetiva, com cancelamento do fetch.
 * @param endpoint - Rota relativa à API de análise.
 * @param filters - Recorte inclusivo e dimensões selecionadas.
 * @param datasetId - Chave de posse da base importada, quando ativa.
 * @param extra - Parâmetros específicos da operação, como agrupamento.
 */
export function useAnalytics<T>(endpoint: string, filters: Filters, datasetId?: string, extra?: Record<string, string>) {
  const path = endpoint + "?" + filterQuery(filters, extra)
  return useQuery({
    queryKey: ["analytics", datasetId ?? "demo", path],
    queryFn: ({ signal }) => api<T>(path, { signal }, datasetId),
  })
}
