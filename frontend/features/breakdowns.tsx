import { BadgeCheck, Repeat2, ShoppingBag, UsersRound } from "lucide-react"
import { AbcChart, CategoryChart } from "@/components/charts"
import { Metric } from "@/components/metrics"
import { ProductTable } from "@/components/product-table"
import { Empty, ErrorState, Loading } from "@/components/states"
import { Card } from "@/components/ui/card"
import { useAnalytics } from "@/hooks/use-analytics"
import { money, number, percent } from "@/lib/format"
import type { Customers, Products } from "@/types/analytics"
import type { AnalysisProps } from "@/features/sales"

/** Apresenta o ranking da API e limita o gráfico ABC aos 20 produtos com mais receita para legibilidade. */
export function ProductsView({ filters, datasetId, onReset }: AnalysisProps) {
  const result = useAnalytics<Products>("products", filters, datasetId)
  if (result.isError) return <ErrorState error={result.error} retry={() => void result.refetch()} reset={datasetId ? onReset : undefined} />
  if (!result.data) return <Loading />
  const { products, categories } = result.data
  const active = products.filter(product => product.revenue > 0)
  return <div className="view-stack">
    <div className="chart-grid">
      <Card className="panel"><div className="panel-heading"><div><h2>Curva ABC de faturamento</h2><p>{active.length > 20 ? "20 maiores produtos por receita" : "Receita e participação acumulada por produto"}</p></div></div>
        {active.length ? <AbcChart products={active.slice(0, 20)} /> : <Empty>Não há receita para calcular a curva ABC.</Empty>}
      </Card>
      <CategoryChart categories={categories} />
    </div>
    <Card className="panel">
      <div className="panel-heading"><div><h2>Desempenho dos produtos</h2><p>Ordenado por receita. A variação usa o período anterior.</p></div></div>
      <ProductTable products={products} advanced />
    </Card>
  </div>
}

/** Mostra métricas dos pedidos identificados e informa quando o recorte não tem identificadores de cliente. */
export function CustomersView({ filters, datasetId, onReset }: AnalysisProps) {
  const result = useAnalytics<Customers>("customers", filters, datasetId)
  if (result.isError) return <ErrorState error={result.error} retry={() => void result.refetch()} reset={datasetId ? onReset : undefined} />
  if (!result.data) return <Loading />
  const data = result.data
  if (!data.unique) return <Card className="panel"><Empty>O período selecionado não tem pedidos com identificador anônimo de cliente.</Empty></Card>
  return <div className="view-stack">
    <div className="metric-grid">
      <Metric label="Clientes únicos" value={number(data.unique)} icon={UsersRound} detail={percent(data.coverage) + " dos pedidos identificados"} />
      <Metric label="Clientes recorrentes" value={number(data.recurring)} icon={Repeat2} detail="Dois ou mais pedidos" />
      <Metric label="Frequência média" value={number(data.frequency ?? 0)} icon={ShoppingBag} detail="Pedidos por cliente" />
      <Metric label="Ticket médio por cliente" value={money(data.revenue_per_customer ?? 0)} icon={BadgeCheck} detail={"Por pedido identificado: " + money(data.average_ticket ?? 0)} />
    </div>
    <Card className="panel">
      <div className="panel-heading"><div><h2>Segmentos de clientes</h2><p>Por número de pedidos no período</p></div></div>
      <ul className="segments">{data.segments.map((segment, index) => <li key={segment.name}>
        <div><strong>{segment.name}</strong><span>{["1 pedido", "2 a 4 pedidos", "5 ou mais pedidos"][index]}</span></div>
        <progress value={segment.customers} max={data.unique} aria-label={segment.name} />
        <strong>{number(segment.customers)}</strong>
      </li>)}</ul>
    </Card>
  </div>
}
