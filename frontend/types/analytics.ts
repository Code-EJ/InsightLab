/** Datas inclusivas ISO. Os contratos deste módulo acompanham os schemas Pydantic da API. */
export type Period = { start: string; end: string }
export type Filters = Period & { category?: string; product?: string }
export type Dataset = Period & {
  demo: boolean
  rows: number
  categories: Record<string, string[]>
  has_customers: boolean
}
export type ImportedDataset = { dataset_id: string; info: Dataset }
export type Metrics = { revenue: number; orders: number; average_ticket: number; units: number }
export type Category = { name: string; revenue: number; share: number }
export type Product = Category & {
  category: string
  units: number
  growth: number | null
  cumulative_share: number
  abc: "A" | "B" | "C"
}
export type Summary = {
  period: Period
  previous_period: Period | null
  current: Metrics
  previous: Metrics | null
  revenue_growth: number | null
  orders_growth: number | null
  ticket_growth: number | null
  categories: Category[]
  top_products: Product[]
}
export type Point = { date: string; revenue: number }
export type SalesPoint = Point & { previous_date: string | null; previous_revenue: number | null }
export type SalesSeries = { points: SalesPoint[] }
export type Group = "day" | "week" | "month"
export type Products = { products: Product[]; categories: Category[] }
export type Customers = {
  unique: number
  recurring: number
  coverage: number
  frequency: number | null
  average_ticket: number | null
  revenue_per_customer: number | null
  segments: { name: string; customers: number }[]
}
export type Forecast = {
  history: Point[]
  projection: Point[]
  horizon: 7 | 30
  test_period: Period | null
  model_errors: { mae: number; rmse: number } | null
  baseline_errors: { mae: number; rmse: number } | null
  message: string
}
export type ScenarioInput = { sales_growth: number; ticket_change: number; order_volume: number | null }
export type Scenario = {
  base: Metrics
  simulated_orders: number
  simulated_ticket: number
  simulated_revenue: number
  difference: number
  change: number | null
}
