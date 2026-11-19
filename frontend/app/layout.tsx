import type { Metadata } from "next"
import "@fontsource-variable/manrope"
import "./globals.css"

export const metadata: Metadata = {
  title: "InsightLab | Inteligência de vendas",
  authors: [{ name: "oEnzoRibas", url: "https://github.com/oEnzoRibas" }],
  description: "Explore vendas, clientes e projeções em um painel de inteligência de negócios.",
}

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>
}
