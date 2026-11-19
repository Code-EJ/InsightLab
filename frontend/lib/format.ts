import type { Dataset, Period } from "@/types/analytics"

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
const numbers = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 })
const compactCurrency = new Intl.NumberFormat("pt-BR", { notation: "compact", style: "currency", currency: "BRL", maximumFractionDigits: 1 })
const short = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" })
const complete = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" })

export const money = (value: number) => currency.format(value)
export const compactMoney = (value: number) => compactCurrency.format(value)
export const number = (value: number) => numbers.format(value)
export const percent = (value: number | null, signed = false) => value === null ? "—" : (signed && value > 0 ? "+" : "") + number(value) + "%"
export const shortDate = (value: string) => short.format(new Date(value)).replace(".", "")
export const fullDate = (value: string) => complete.format(new Date(value)).replace(".", "")
export function periodText({ start, end }: Period) {
  const startLabel = start.slice(0, 4) === end.slice(0, 4) ? shortDate(start) : fullDate(start)
  return start === end ? fullDate(end) : startLabel + " – " + fullDate(end)
}

/** Conta dias inclusivos a partir do fim da base em UTC e limita o início à primeira venda. */
export function presetPeriod(dataset: Dataset, days: number): Period {
  const date = new Date(dataset.end)
  date.setUTCDate(date.getUTCDate() - days + 1)
  return { start: days ? [dataset.start, date.toISOString().slice(0, 10)].sort()[1] : dataset.start, end: dataset.end }
}
