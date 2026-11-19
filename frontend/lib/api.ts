import type { Filters } from "@/types/analytics"

const origin = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "")

/** Erro HTTP ou indisponibilidade da API. O status zero representa falha de conexão. */
export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message)
  }
}

/**
 * Executa uma chamada à API Python e normaliza erros para apresentação no painel.
 * @param path - Caminho relativo a /api, com query string quando necessária.
 * @param options - Opções Fetch, incluindo método, corpo e sinal de cancelamento.
 * @param datasetId - Chave usada no cabeçalho de acesso à base importada.
 * @returns O contrato JSON esperado ou undefined para HTTP 204.
 * @throws ApiError em falha de conexão não cancelada ou resposta HTTP malsucedida.
 */
export async function api<T>(path: string, options: RequestInit = {}, datasetId?: string): Promise<T> {
  const headers = new Headers(options.headers)
  if (datasetId) headers.set("X-Dataset-Id", datasetId)
  let response: Response
  try {
    response = await fetch(origin + "/api/" + path, { ...options, headers, cache: "no-store" })
  } catch (error) {
    if (options.signal?.aborted) throw error
    throw new ApiError("Não foi possível conectar à API. Verifique se ela está em execução.", 0)
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new ApiError(typeof body?.detail === "string" ? body.detail : "Ocorreu um erro ao consultar a API.", response.status)
  }
  return response.status === 204 ? (undefined as T) : await response.json() as T
}

/** Serializa filtros preenchidos e parâmetros específicos sem alterar o objeto de seleção. */
export function filterQuery(filters: Filters, extra: Record<string, string> = {}) {
  const params = new URLSearchParams(extra)
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value)
  }
  return params.toString()
}
