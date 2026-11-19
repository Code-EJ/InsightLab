import { useState } from "react"
import { CalendarDays } from "lucide-react"
import { CategoryChart, RevenueChart } from "@/components/charts"
import { SelectField } from "@/components/filters"
import { SummaryMetrics } from "@/components/metrics"
import { ProductTable } from "@/components/product-table"
import { Empty, ErrorState, Loading } from "@/components/states"
import { Card } from "@/components/ui/card"
import { useAnalytics } from "@/hooks/use-analytics"
import { money, periodText } from "@/lib/format"
import type { Filters, Group, SalesSeries, Summary } from "@/types/analytics"

export type AnalysisProps = { filters: Filters; datasetId?: string; onReset: () => void }

/** Busca resumo e série separadamente para manter os indicadores disponíveis durante mudanças no agrupamento. */
export function SalesView({ filters, datasetId, onReset, overview }: AnalysisProps & { overview: boolean }) {
  const [group, setGroup] = useState<Group>("week")
  const summary = useAnalytics<Summary>("summary", filters, datasetId)
  const sales = useAnalytics<SalesSeries>("sales", filters, datasetId, { group })
  if (summary.isError) return <ErrorState error={summary.error} retry={() => void summary.refetch()} reset={datasetId ? onReset : undefined} />
  if (!summary.data) return <Loading />
  const data = summary.data
  return <div className="view-stack">
    <SummaryMetrics data={data} />
    <div className={overview ? "chart-grid" : ""}>
      <Card className="panel">
        <div className="panel-heading">
          <div><h2>Evolução da receita</h2><p>Faturamento ao longo do período selecionado</p></div>
          <SelectField label="Agrupar por" className="group-select" value={group} onChange={event => setGroup(event.target.value as Group)}>
            <option value="day">Diário</option><option value="week">Semanal</option><option value="month">Mensal</option>
          </SelectField>
        </div>
        {sales.isError ? <ErrorState error={sales.error} retry={() => void sales.refetch()} /> : !sales.data ?
          <div className="skeleton skeleton-inline" role="status" aria-label="Carregando série de receita" /> :
          data.current.orders || data.previous?.orders ? <RevenueChart points={sales.data.points} /> : <Empty>Não há vendas nos períodos para os filtros selecionados.</Empty>}
      </Card>
      {overview && <CategoryChart categories={data.categories} total={data.current.revenue} />}
    </div>
    {overview ? <Card className="panel">
      <div className="panel-heading"><div><h2>Produtos mais vendidos</h2><p>Os 5 produtos com maior volume de unidades</p></div></div>
      <ProductTable products={data.top_products} />
    </Card> : <Card className="panel comparison">
      <CalendarDays size={22} />
      <div><h2>Comparação de períodos</h2><p>{periodText(data.period)} · {money(data.current.revenue)}</p>
        <p>{data.previous_period && data.previous ? periodText(data.previous_period) + " · " + money(data.previous.revenue) : "Sem histórico completo para o período anterior."}</p>
      </div>
    </Card>}
  </div>
}
