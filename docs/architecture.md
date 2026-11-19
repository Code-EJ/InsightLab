# Arquitetura

## Camadas e dependências

A página `frontend/app/page.tsx` monta `Providers` e `Dashboard` dentro do layout PT-BR. O App Router fornece a entrada `/`. O painel usa estado React para seção ativa, recorte e base importada. As abas de análise são seções dessa página. `useAnalytics` usa TanStack Query com a chave formada pela fonte e pelos parâmetros serializados, para isolar resultados de recortes e bases diferentes.

Os componentes visuais consomem respostas tipadas. Tailwind e as primitivas `Button` e `Card` cuidam da apresentação, Lucide fornece ícones e Recharts renderiza as séries. `lib/format.ts` oferece datas UTC e formatação de exibição em PT-BR. O cálculo de receita, participações e erros permanece na API. O navegador chama a origem definida no build com `NEXT_PUBLIC_API_URL`.

A aplicação FastAPI cria o `DatasetStore` no ciclo de vida do processo e monta um roteador sob `/api`. As dependências das rotas resolvem o dataset e os filtros. Esquemas Pydantic validam entradas e definem saídas. Os serviços usam pandas para agregações, NumPy para matrizes de calendário e scikit-learn para regressão Ridge e métricas. A base sintética é gerada uma vez por processo. Importações passam no parser CSV antes de entrar no store.

[Diagrama de componentes](diagrams/README.md#componentes) · [Fluxo de dados](data-flow.md)

## Decisões

| Decisão | Razão e consequência |
| --- | --- |
| UI TypeScript e API Python separadas | Permite manter os cálculos na stack de análise. CORS e a origem configurada no build fazem parte do contrato de implantação. |
| pandas e centavos inteiros | Agrupa por data, pedidos, produtos e clientes e preserva somas monetárias nas linhas e totalizações. O JSON usa valores em reais e a tela faz apenas formatação. |
| Store em memória por processo | A demonstração inicia sem banco. Importações dependem da instância, perdem-se em reinícios e têm capacidade limitada. |
| Ridge com variáveis de calendário | Baseline e erros ficam auditáveis. O modelo captura tendência linear e padrão semanal em recortes com histórico suficiente. |
| Contratos Pydantic e tipos TypeScript | O OpenAPI descreve a API. As definições TypeScript são mantidas manualmente e precisam acompanhar mudanças de contrato. |

[Decisões registradas](decisions/README.md) · [Metodologia](metodologia.md)

## Tratamento de erros

Parâmetros inválidos produzem `422` com nomes dos campos. Recortes fora da base ou conteúdo malformado retornam mensagens de validação. Uma chave inválida ou expirada resulta em `404`. A importação também diferencia mídia inválida, arquivo grande e capacidade temporária atingida. O frontend normaliza falhas HTTP e de conexão em `ApiError`, exibe skeletons, mensagens de vazio ou ação de recuperação. Histórico insuficiente para previsão é um resultado válido, com mensagem e projeção vazia.

## Pontos de extensão

- Introduza novos indicadores nos serviços e schemas, com fixture de cálculo e teste de contrato. Atualize os tipos e a apresentação em seguida.
- Preserve a distinção entre janela de teste da previsão e projeção final. Registre qualquer alteração de modelo, treinamento ou baseline na metodologia.
- Uma versão com múltiplos processos exige armazenamento acessível às instâncias e controle de acesso adequado ao tipo de dado. Os limites atuais pertencem ao processo.
- A aplicação usa dois serviços em operação, a interface e a API. O fluxo de uso com dados de demonstração dispensa banco, APIs comerciais e credenciais de terceiros. Fontes e recursos de interface são empacotados com o frontend.
