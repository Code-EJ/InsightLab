"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState, type ReactNode } from "react"

/** Fornece um QueryClient por montagem do painel com cache compartilhado entre as seções. */
export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, retry: false } },
  }))
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
