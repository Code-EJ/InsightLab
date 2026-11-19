import { CalendarDays, ChevronDown, SlidersHorizontal } from "lucide-react"
import { useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { periodText, presetPeriod } from "@/lib/format"
import type { Dataset, Filters } from "@/types/analytics"

export const presets = [[30, "30 dias"], [90, "90 dias"], [180, "180 dias"], [0, "Todo o período"]] as const

export function SelectField({ label, children, ...props }: React.ComponentProps<"select"> & { label: string }) {
  return <label className="field"><span>{label}</span><span className="select-wrap">
    <select {...props}>{children}</select><ChevronDown size={15} aria-hidden="true" />
  </span></label>
}

/** Mantém datas provisórias até o visitante aplicar um intervalo ou atalho. */
export function DateFilter({ dataset, filters, change }: { dataset: Dataset; filters: Filters; change: (filters: Filters) => void }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState({ start: filters.start, end: filters.end })

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    change({ ...filters, ...draft })
    setOpen(false)
  }

  return <div className="date-control" onKeyDown={event => { if (event.key === "Escape") setOpen(false) }}>
    <Button variant="outline" aria-expanded={open} aria-controls="date-options" onClick={() => {
      setDraft({ start: filters.start, end: filters.end })
      setOpen(!open)
    }}><CalendarDays /> <span>{periodText(filters)}</span> <ChevronDown /></Button>
    {open && <form className="popover" id="date-options" onSubmit={submit}>
      <strong>Selecionar período</strong>
      <div className="preset-grid">{presets.map(([days, label]) => <Button size="sm" variant="outline" key={days} onClick={() => {
        change({ ...filters, ...presetPeriod(dataset, days) })
        setOpen(false)
      }}>{label}</Button>)}</div>
      <label className="field">Data inicial<input autoFocus type="date" min={dataset.start} max={draft.end || dataset.end} value={draft.start} required onChange={event => setDraft({ ...draft, start: event.target.value })} /></label>
      <label className="field">Data final<input type="date" min={draft.start || dataset.start} max={dataset.end} value={draft.end} required onChange={event => setDraft({ ...draft, end: event.target.value })} /></label>
      <Button type="submit">Aplicar período</Button>
    </form>}
  </div>
}

/** Apresenta categorias e produtos da base e descarta a seleção de produto ao trocar categoria. */
export function Dimensions({ dataset, filters, change }: { dataset: Dataset; filters: Filters; change: (filters: Filters) => void }) {
  const products = filters.category ? dataset.categories[filters.category] ?? [] : [...new Set(Object.values(dataset.categories).flat())].sort((a, b) => a.localeCompare(b, "pt-BR"))
  return <div className="dimensions">
    <div className="filter-heading"><SlidersHorizontal size={17} /> Filtros</div>
    <SelectField label="Categoria" value={filters.category ?? ""} onChange={event => change({ ...filters, category: event.target.value || undefined, product: undefined })}>
      <option value="">Todas as categorias</option>{Object.keys(dataset.categories).map(category => <option key={category}>{category}</option>)}
    </SelectField>
    <SelectField label="Produto" value={filters.product ?? ""} onChange={event => change({ ...filters, product: event.target.value || undefined })}>
      <option value="">Todos os produtos</option>{products.map(product => <option key={product}>{product}</option>)}
    </SelectField>
    {(filters.category || filters.product) && <Button variant="ghost" size="sm" onClick={() => change({ start: filters.start, end: filters.end })}>Limpar filtros</Button>}
  </div>
}
