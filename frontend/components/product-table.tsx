import { Change } from "@/components/metrics"
import { Empty } from "@/components/states"
import { money, number, percent } from "@/lib/format"
import type { Product } from "@/types/analytics"

export function ProductTable({ products, advanced = false }: { products: Product[]; advanced?: boolean }) {
  if (!products.length) return <Empty>Nenhum produto vendido neste período.</Empty>
  return <div className="table-scroll"><table>
    <thead><tr><th scope="col">Produto</th><th scope="col">Categoria</th><th scope="col">Unidades</th><th scope="col">Receita</th>{advanced && <>
      <th scope="col">Participação</th><th scope="col">Variação</th><th scope="col">Classe ABC</th>
    </>}</tr></thead>
    <tbody>{products.map(product => <tr key={JSON.stringify([product.category, product.name])}>
      <th scope="row">{product.name}</th><td>{product.category}</td><td>{number(product.units)}</td><td>{money(product.revenue)}</td>
      {advanced && <><td>{percent(product.share)}</td><td><Change value={product.growth} /></td><td><span className="abc">{product.abc}</span></td></>}
    </tr>)}</tbody>
  </table></div>
}
