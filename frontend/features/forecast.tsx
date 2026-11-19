import { useState } from "react"
import { Info } from "lucide-react"
import { ForecastChart } from "@/components/charts"
import { ErrorState, Loading } from "@/components/states"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAnalytics } from "@/hooks/use-analytics"
import { money, periodText } from "@/lib/format"
import type { Forecast } from "@/types/analytics"
import type { AnalysisProps } from "@/features/sales"

/** Seleciona o horizonte avaliado pela API e apresenta o histórico mesmo quando a projeção estiver indisponível. */
export function ForecastView({ filters, datasetId, onReset }: AnalysisProps) {
  const [horizon, setHorizon] = useState<7 | 30>(30)
  const result = useAnalytics<Forecast>("forecast", filters, datasetId, { horizon: String(horizon) })
  const data = result.data
  return <div className="view-stack">
    <Card className="panel">
      <div className="panel-heading"><div><h2>Receita projetada</h2><p>Projeção diária por regressão Ridge</p></div>
        <div className="toggle">{([7, 30] as const).map(days => <Button size="sm" key={days} variant={horizon === days ? "default" : "ghost"} aria-pressed={horizon === days} onClick={() => setHorizon(days)}>{days} dias</Button>)}</div>
      </div>
      {result.isError ? <ErrorState error={result.error} retry={() => void result.refetch()} reset={datasetId ? onReset : undefined} /> : !data ? <Loading label="Calculando previsão…" /> : <>
        <div className="chart-legend"><span><i /> Histórico</span>{data.projection.length > 0 && <span><i className="prediction" /> Projeção</span>}</div>
        <ForecastChart data={data} />
        <p className="notice"><Info size={17} /> {data.message}</p>
      </>}
    </Card>
    {data?.test_period && data.model_errors && data.baseline_errors && <Card className="panel">
      <div className="panel-heading"><div><h2>Validação temporal</h2><p>Teste com os últimos {data.horizon} dias · {periodText(data.test_period)}</p></div></div>
      <div className="table-scroll"><table><thead><tr><th scope="col">Método</th><th scope="col">Erro absoluto médio (MAE)</th><th scope="col">Raiz do erro quadrático médio (RMSE)</th></tr></thead>
        <tbody><tr><th scope="row">Regressão Ridge</th><td>{money(data.model_errors.mae)}</td><td>{money(data.model_errors.rmse)}</td></tr>
          <tr><th scope="row">Repetição da última semana</th><td>{money(data.baseline_errors.mae)}</td><td>{money(data.baseline_errors.rmse)}</td></tr></tbody>
      </table></div>
      <p className="panel-note">Valores menores indicam menos erro nesta janela. O erro observado pode variar em outros períodos.</p>
    </Card>}
  </div>
}
