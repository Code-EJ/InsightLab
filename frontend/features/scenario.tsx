import { useState, type FormEvent } from "react"
import { useMutation } from "@tanstack/react-query"
import { FlaskConical } from "lucide-react"
import { ErrorState } from "@/components/states"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { money, number, percent } from "@/lib/format"
import type { Scenario, ScenarioInput } from "@/types/analytics"
import type { AnalysisProps } from "@/features/sales"

/** Envia premissas e filtros à API e apresenta o cenário hipotético enquanto o recorte seguir ativo. */
export function ScenarioView({ filters, datasetId, onReset }: AnalysisProps) {
  const [volume, setVolume] = useState("")
  const request = useMutation({
    mutationFn: (parameters: ScenarioInput) => api<Scenario>("scenario", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...filters, ...parameters }),
    }, datasetId),
  })
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const entries = new FormData(event.currentTarget)
    request.mutate({
      sales_growth: Number(entries.get("growth")),
      ticket_change: Number(entries.get("ticket")),
      order_volume: volume ? Number(volume) : null,
    })
  }
  const data = request.data
  return <div className="chart-grid scenario-grid">
    <Card className="panel">
      <div className="panel-heading"><div><h2>Premissas do cenário</h2><p>Defina alterações sobre a base do período selecionado.</p></div></div>
      <form className="form-stack" onSubmit={submit} onChange={() => { if (data || request.isError) request.reset() }}>
        <label className="field">Crescimento esperado no volume (%)<input type="number" name="growth" min="-100" max="300" defaultValue="0" step="0.1" required disabled={request.isPending} /></label>
        <label className="field">Variação do ticket médio (%)<input type="number" name="ticket" min="-100" max="300" defaultValue="0" step="0.1" required disabled={request.isPending} /></label>
        <label className="field">Volume base de pedidos<input type="number" min="0" max="1000000" disabled={request.isPending} placeholder="Usar volume do período" value={volume} onChange={event => setVolume(event.target.value)} /></label>
        <Button type="submit" disabled={request.isPending}><FlaskConical />{request.isPending ? "Calculando…" : "Simular faturamento"}</Button>
      </form>
    </Card>
    <Card className="panel scenario-result" aria-live="polite">
      <div className="panel-heading"><div><h2>Cenário hipotético</h2><p>Resultado calculado a partir das premissas informadas.</p></div></div>
      {request.isError ? <ErrorState error={request.error} reset={datasetId ? onReset : undefined} /> : data ? <>
        <div className="scenario-total">{money(data.simulated_revenue)}</div>
        <dl>{[
          ["Receita observada", money(data.base.revenue)],
          ["Diferença", money(data.difference) + " (" + percent(data.change, true) + ")"],
          ["Pedidos simulados", number(data.simulated_orders)],
          ["Ticket simulado", money(data.simulated_ticket)],
        ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      </> : <p className="notice"><FlaskConical size={19} /> {request.isPending ? "Calculando o resultado…" : "Simule para ver o faturamento e a diferença em relação à receita observada."}</p>}
    </Card>
  </div>
}
