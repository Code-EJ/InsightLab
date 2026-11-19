import { ArrowDownRight, ArrowUpRight, Banknote, ChartNoAxesCombined, ReceiptText, ShoppingBag, type LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { money, number, percent } from "@/lib/format"
import type { Summary } from "@/types/analytics"

export function Change({ value }: { value: number | null }) {
  const Direction = value !== null && value < 0 ? ArrowDownRight : ArrowUpRight
  return <span className={"change " + (value === null || value === 0 ? "change-neutral" : value < 0 ? "change-down" : "change-up")} title={value === null ? "Sem base de comparação" : undefined}>
    {value !== null && value !== 0 && <Direction size={13} />} {percent(value, true)}
  </span>
}

export function Metric({ label, value, icon: Icon, change, detail }: { label: string; value: string; icon: LucideIcon; change?: number | null; detail?: string }) {
  return <Card className="metric">
    <div className="metric-top"><span className="metric-icon"><Icon size={18} strokeWidth={1.8} /></span><h2>{label}</h2></div>
    <strong className="metric-value">{value}</strong>
    <div className="metric-foot">{change !== undefined && <Change value={change} />}{detail && <span>{detail}</span>}</div>
  </Card>
}

export function SummaryMetrics({ data }: { data: Summary }) {
  const caption = data.previous ? "vs. período anterior" : "Sem período anterior completo"
  return <div className="metric-grid">
    <Metric label="Receita total" value={money(data.current.revenue)} icon={Banknote} change={data.revenue_growth} detail={caption} />
    <Metric label="Pedidos" value={number(data.current.orders)} icon={ShoppingBag} change={data.orders_growth} detail={caption} />
    <Metric label="Ticket médio" value={money(data.current.average_ticket)} icon={ReceiptText} change={data.ticket_growth} detail={caption} />
    <Metric label="Crescimento da receita" value={percent(data.revenue_growth, true)} icon={ChartNoAxesCombined} detail={data.previous ? money(data.previous.revenue) + " no período anterior" : caption} />
  </div>
}
