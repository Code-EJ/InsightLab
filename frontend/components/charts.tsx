"use client"

import { useId } from "react"
import {
  Area, Bar, CartesianGrid, Cell, ComposedChart, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts"
import { Card } from "@/components/ui/card"
import { Empty } from "@/components/states"
import { compactMoney, fullDate, money, number, percent, shortDate } from "@/lib/format"
import type { Category, Forecast, Product, SalesPoint } from "@/types/analytics"

const colors = ["#14594d", "#339179", "#6bb49e", "#9fd2bf", "#cfe6da", "#659bba", "#a2c4d8"]
const chartTooltip = { background: "#fff", border: "1px solid #e2ebe7", borderRadius: 10, boxShadow: "0 8px 22px #173b2e14", color: "#143229" }
const ticks = { fill: "#61736e", fontSize: 12 }

export function RevenueChart({ points }: { points: SalesPoint[] }) {
  const gradient = useId()
  const hasPrior = points.some(point => point.previous_revenue !== null)
  return <>
    <div className="chart-legend">
      <span><i /> Período atual</span>
      {hasPrior && <span><i className="dashed" /> Período anterior</span>}
    </div>
    <div className="revenue-chart">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <ComposedChart data={points} margin={{ top: 8, right: 9, bottom: 0, left: 2 }}>
          <defs><linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#51ad92" stopOpacity={0.26} /><stop offset="100%" stopColor="#51ad92" stopOpacity={0.025} /></linearGradient></defs>
          <CartesianGrid stroke="#e6eeea" vertical={false} strokeDasharray="4 4" />
          <XAxis dataKey="date" tickFormatter={shortDate} tick={ticks} tickLine={false} axisLine={false} minTickGap={24} tickMargin={11} />
          <YAxis tickFormatter={compactMoney} width={66} tick={ticks} tickLine={false} axisLine={false} />
          <Tooltip labelFormatter={date => fullDate(String(date))} formatter={value => money(Number(value))} contentStyle={chartTooltip} />
          {hasPrior && <Line name="Período anterior" dataKey="previous_revenue" type="linear" stroke="#8da6a0" strokeDasharray="6 5" strokeWidth={2} dot={points.length === 1} isAnimationActive={false} />}
          <Area name="Período atual" dataKey="revenue" type="linear" stroke="#18735e" strokeWidth={2.5} fill={"url(#" + gradient + ")"} dot={points.length === 1} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  </>
}

export function CategoryChart({ categories, total }: { categories: Category[]; total?: number }) {
  const values = categories.filter(category => category.revenue > 0)
  return <Card className="panel category-panel">
    <div className="panel-heading"><div><h2>Receita por categoria</h2><p>Participação no faturamento</p></div></div>
    {values.length ? <>
      <div className="donut-chart">
        <div className="donut-label"><strong>{total === undefined ? number(values.length) : compactMoney(total)}</strong><span>{total === undefined ? "categorias" : "receita total"}</span></div>
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <PieChart>
            <Pie data={values} dataKey="revenue" nameKey="name" innerRadius="68%" outerRadius="96%" paddingAngle={values.length > 1 && values.length < 15 ? 2 : 0} stroke="none" isAnimationActive={false}>
              {values.map((category, index) => <Cell key={category.name} fill={colors[index % colors.length]} />)}
            </Pie>
            <Tooltip formatter={value => money(Number(value))} contentStyle={chartTooltip} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="category-legend">
        {values.map((category, index) => <li key={category.name}><i style={{ background: colors[index % colors.length] }} /><span>{category.name}</span><strong>{percent(category.share)}</strong></li>)}
      </ul>
    </> : <Empty>Sem receita para distribuir no período.</Empty>}
  </Card>
}

/** Conecta o último ponto observado ao início da série projetada sem preencher lacunas nas demais datas. */
export function ForecastChart({ data }: { data: Forecast }) {
  const points = data.history.map<{ date: string; historical: number | null; estimate: number | null }>((point, index) => ({
    date: point.date, historical: point.revenue, estimate: data.projection.length && index === data.history.length - 1 ? point.revenue : null,
  })).concat(data.projection.map(point => ({ date: point.date, historical: null, estimate: point.revenue })))
  return <div className="forecast-chart">
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
      <ComposedChart data={points} margin={{ top: 12, right: 12, left: 2, bottom: 3 }}>
        <CartesianGrid vertical={false} stroke="#e6eeea" strokeDasharray="4 4" />
        <XAxis dataKey="date" tickFormatter={shortDate} tick={ticks} tickLine={false} axisLine={false} minTickGap={27} />
        <YAxis width={70} tickFormatter={compactMoney} tick={ticks} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={chartTooltip} labelFormatter={date => fullDate(String(date))} formatter={value => money(Number(value))} />
        <Line name="Histórico" dataKey="historical" stroke="#18735e" strokeWidth={2} dot={points.length === 1} isAnimationActive={false} />
        <Line name="Projeção" dataKey="estimate" stroke="#3b78a3" strokeWidth={2.5} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
      </ComposedChart>
    </ResponsiveContainer>
  </div>
}

export function AbcChart({ products }: { products: Product[] }) {
  return <div className="revenue-chart">
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
      <ComposedChart data={products} margin={{ top: 15, right: 6, left: 2, bottom: 2 }}>
        <CartesianGrid vertical={false} stroke="#e6eeea" />
        <XAxis dataKey="name" tick={ticks} tickLine={false} axisLine={false} minTickGap={15} />
        <YAxis yAxisId="money" width={67} tickFormatter={compactMoney} tick={ticks} tickLine={false} axisLine={false} />
        <YAxis yAxisId="share" orientation="right" width={48} domain={[0, 100]} tickFormatter={value => percent(value)} tick={ticks} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={chartTooltip} formatter={(value, name) => name === "Receita" ? money(Number(value)) : percent(Number(value))} />
        <Bar name="Receita" yAxisId="money" dataKey="revenue" fill="#69ae98" maxBarSize={30} radius={[3, 3, 0, 0]} isAnimationActive={false} />
        <Line name="Participação acumulada" yAxisId="share" dataKey="cumulative_share" stroke="#143f42" strokeWidth={2} dot={false} isAnimationActive={false} />
      </ComposedChart>
    </ResponsiveContainer>
  </div>
}
