"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Activity, BarChart3, ChartNoAxesCombined, ChevronRight, Database, FlaskConical,
  LayoutDashboard, Menu, Package, Upload, UsersRound, X,
} from "lucide-react"
import { Credits } from "@/components/credits"
import { DateFilter, Dimensions } from "@/components/filters"
import { ErrorState, Loading } from "@/components/states"
import { Button } from "@/components/ui/button"
import { CustomersView, ProductsView } from "@/features/breakdowns"
import { ForecastView } from "@/features/forecast"
import { ImportView } from "@/features/import"
import { SalesView } from "@/features/sales"
import { ScenarioView } from "@/features/scenario"
import { api } from "@/lib/api"
import { number, presetPeriod } from "@/lib/format"
import type { Dataset, Filters, ImportedDataset } from "@/types/analytics"

const sections = {
  overview: { label: "Visão geral", icon: LayoutDashboard, description: "Acompanhe o desempenho de vendas e os principais indicadores do seu negócio." },
  sales: { label: "Vendas", icon: BarChart3, description: "Compare o faturamento ao longo do tempo e explore a evolução das vendas." },
  products: { label: "Produtos", icon: Package, description: "Veja quais produtos concentram a receita e como seu desempenho mudou." },
  customers: { label: "Clientes", icon: UsersRound, description: "Entenda a recorrência, a frequência e o valor de compra dos seus clientes." },
  forecast: { label: "Previsão de vendas", icon: Activity, description: "Explore a projeção de receita para os próximos 7 ou 30 dias após o período selecionado." },
  scenario: { label: "Simulador", icon: FlaskConical, description: "Explore cenários hipotéticos de faturamento a partir do volume de pedidos e do ticket médio." },
  import: { label: "Importar dados", icon: Upload, description: "Analise seu próprio conjunto de vendas enviando um arquivo CSV." },
}
type Section = keyof typeof sections
const groups: { name: string; items: Section[] }[] = [
  { name: "Análises", items: ["overview", "sales", "products", "customers"] },
  { name: "Planejamento", items: ["forecast", "scenario"] },
  { name: "Dados", items: ["import"] },
]

/** Orquestra navegação, base e recorte em memória. A troca de dataset descarta as consultas antigas e restabelece o período padrão. */
export function Dashboard() {
  const client = useQueryClient()
  const [section, setSection] = useState<Section>("overview")
  const [menu, setMenu] = useState(false)
  const [imported, setImported] = useState<ImportedDataset>()
  const [selection, setSelection] = useState<Filters>()
  const base = useQuery({ queryKey: ["dataset", "demo"], queryFn: ({ signal }) => api<Dataset>("dataset", { signal }) })
  const dataset = imported?.info ?? base.data
  const filters = dataset ? selection ?? presetPeriod(dataset, 90) : undefined

  function navigate(next: Section) {
    setSection(next)
    setMenu(false)
    window.scrollTo({ top: 0 })
  }

  function discard(key?: string) {
    if (key) {
      client.removeQueries({ queryKey: ["analytics", key] })
      void api<void>("datasets", { method: "DELETE" }, key).catch(() => undefined)
    }
  }

  function changeDataset(value?: ImportedDataset) {
    discard(imported?.dataset_id)
    setImported(value)
    setSelection(undefined)
  }

  const current = sections[section]
  const props = filters && { filters, datasetId: imported?.dataset_id, onReset: () => changeDataset() }
  return <div className="workspace">
    <a href="#main" className="skip-link">Ir ao conteúdo</a>
    {menu && <button type="button" className="scrim" onClick={() => setMenu(false)} aria-label="Fechar navegação" />}
    <aside className={"sidebar" + (menu ? " sidebar-open" : "")}>
      <div className="brand">
        <div className="brand-icon"><ChartNoAxesCombined size={24} strokeWidth={2.25} /></div>
        <div><strong>InsightLab</strong><span>Inteligência de vendas</span></div>
        <Button variant="ghost" size="icon" className="mobile-close" onClick={() => setMenu(false)} aria-label="Fechar navegação"><X /></Button>
      </div>
      <nav aria-label="Navegação principal">
        {groups.map(group => <div className="nav-group" key={group.name}>
          <div className="nav-label">{group.name}</div>
          {group.items.map(key => {
            const { label, icon: Icon } = sections[key]
            return <button type="button" key={key} className="nav-item" aria-current={key === section ? "page" : undefined} onClick={() => navigate(key)}>
              <Icon size={19} strokeWidth={1.8} /><span>{label}</span>{key === section && <ChevronRight className="nav-caret" size={16} />}
            </button>
          })}
        </div>)}
      </nav>
      {dataset && <div className="source-card"><div className="source-icon"><Database size={18} /></div><div>
        <strong>{dataset.demo ? "Base de demonstração" : "CSV importado"}</strong>
        <span>{number(dataset.rows)} linhas de vendas</span>
      </div></div>}
    </aside>
    <div className="main-shell">
      <header className="topbar">
        <div className="breadcrumbs">
          <Button variant="ghost" size="icon" className="mobile-toggle" onClick={() => setMenu(!menu)} aria-expanded={menu} aria-label="Abrir navegação"><Menu /></Button>
          <span>{groups.find(group => group.items.includes(section))?.name}</span><ChevronRight size={14} /><strong>{current.label}</strong>
        </div>
        <div className="top-actions">
          {dataset && <span className="source-badge"><i />{dataset.demo ? "Dados simulados" : "CSV importado"}</span>}
          {dataset && filters && section !== "import" && <DateFilter dataset={dataset} filters={filters} change={setSelection} />}
        </div>
      </header>
      <main id="main" className="main-content">
        <div className="page-heading">
          <div><h1>{current.label}</h1><p>{current.description}</p></div>
          {section === "overview" && <Button variant="outline" onClick={() => navigate("import")}><Upload /> Importar CSV</Button>}
        </div>
        {dataset && filters && section !== "import" && <Dimensions dataset={dataset} filters={filters} change={setSelection} />}
        {section === "import" ? <ImportView active={imported} onImport={changeDataset} onReset={() => changeDataset()} /> :
          !props ? base.isError ? <ErrorState error={base.error} retry={() => void base.refetch()} /> : <Loading /> :
          section === "overview" || section === "sales" ? <SalesView {...props} overview={section === "overview"} /> :
          section === "products" ? <ProductsView {...props} /> :
          section === "customers" ? <CustomersView {...props} /> :
          section === "forecast" ? <ForecastView {...props} /> :
          <ScenarioView key={JSON.stringify([props.datasetId, filters])} {...props} />}
      </main>
      <Credits />
    </div>
  </div>
}
