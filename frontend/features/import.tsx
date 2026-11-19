import { useState, type FormEvent } from "react"
import { Database, FileSpreadsheet, FileUp, UploadCloud } from "lucide-react"
import { useMutation } from "@tanstack/react-query"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { number, periodText } from "@/lib/format"
import type { ImportedDataset } from "@/types/analytics"

const sample = "date,order_id,product,category,quantity,unit_price,customer_id\n2026-09-01,P001,Fone Bluetooth,Eletrônicos,1,199.90,C001\n2026-09-02,P002,Luminária,Casa,2,79.90,C002\n"

/** Envia os bytes do arquivo para validação. Só troca a base via onImport após receber a chave e os metadados da API. */
export function ImportView({ active, onImport, onReset }: { active?: ImportedDataset; onImport: (data: ImportedDataset) => void; onReset: () => void }) {
  const [file, setFile] = useState<File>()
  const upload = useMutation({
    mutationFn: async (selected: File) => {
      if (!selected.name.toLowerCase().endsWith(".csv")) throw new Error("Selecione um arquivo com extensão .csv.")
      if (selected.size > 5 * 1024 * 1024) throw new Error("O arquivo excede o limite de 5 MB.")
      return api<ImportedDataset>("datasets", { method: "POST", body: selected, headers: { "Content-Type": "text/csv" } })
    },
    onSuccess: onImport,
  })
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (file) upload.mutate(file)
  }
  return <div className="view-stack">
    {active && <Card className="panel import-active"><Database size={22} /><div><h2>CSV em uso</h2><p>{number(active.info.rows)} linhas · {periodText(active.info)}</p></div>
      <Button variant="outline" onClick={onReset} disabled={upload.isPending}>Voltar à demonstração</Button></Card>}
    <div className="chart-grid import-grid">
      <Card className="panel">
        <div className="panel-heading"><div><h2>Enviar arquivo CSV</h2><p>Até 5 MB e 50 mil linhas de vendas.</p></div></div>
        <form className="form-stack" onSubmit={submit}>
          <label className="file-drop"><UploadCloud size={30} /><strong>{file?.name || "Selecione um arquivo"}</strong><span>CSV em UTF-8</span>
            <input aria-label="Selecionar arquivo CSV" type="file" accept=".csv,text/csv" disabled={upload.isPending} onChange={event => { setFile(event.target.files?.[0]); upload.reset() }} />
          </label>
          {upload.isError && <p className="form-error" role="alert">{upload.error.message}</p>}
          {upload.isSuccess && active?.dataset_id === upload.data.dataset_id && <p role="status" className="notice">Arquivo validado. As análises agora usam o CSV importado.</p>}
          <Button disabled={!file || upload.isPending} type="submit"><FileUp /> {upload.isPending ? "Validando…" : "Importar CSV"}</Button>
        </form>
      </Card>
      <Card className="panel csv-info">
        <div className="panel-heading"><div><h2>Formato dos dados</h2><p>Uma linha por item do pedido.</p></div></div>
        <ul><li>Data da venda (AAAA-MM-DD)</li><li>ID do pedido, produto e categoria</li><li>Quantidade inteira e preço unitário em reais</li><li>ID anônimo do cliente (opcional)</li></ul>
        <p>A importação fica disponível por até 30 minutos nesta sessão. Use identificadores anônimos.</p>
        <a className="sample-link" download="insightlab-modelo.csv" href={"data:text/csv;charset=utf-8," + encodeURIComponent(sample)}><FileSpreadsheet size={17} /> Baixar modelo CSV</a>
      </Card>
    </div>
  </div>
}
