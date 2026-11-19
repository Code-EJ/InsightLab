import { ChartNoAxesCombined, CircleAlert } from "lucide-react"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"

export function Loading({ label = "Carregando análise…" }: { label?: string }) {
  return <section className="loading" role="status" aria-label={label}>
    <span className="sr-only">{label}</span>
    <div className="skeleton skeleton-heading" />
    <div className="skeleton-grid">{Array.from({ length: 4 }, (_, index) => <div className="skeleton skeleton-tile" key={index} />)}</div>
    <div className="skeleton skeleton-chart" />
  </section>
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="state"><ChartNoAxesCombined size={25} /><p>{children}</p></div>
}

export function ErrorState({ error, retry, reset }: { error: Error; retry?: () => void; reset?: () => void }) {
  return <div className="state" role="alert">
    <CircleAlert size={25} />
    <p>{error.message}</p>
    <div className="inline-actions">
      {retry && <Button variant="outline" onClick={retry}>Tentar novamente</Button>}
      {reset && <Button onClick={reset}>Voltar aos dados de demonstração</Button>}
    </div>
  </div>
}
