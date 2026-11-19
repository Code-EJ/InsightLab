# Guia do código-fonte

Use [arquitetura](architecture.md) para entender as dependências e [metodologia](metodologia.md) para preservar as regras de negócio.

## Frontend

| Arquivo ou grupo | Entrada, saída e responsabilidades |
| --- | --- |
| [layout e página](../frontend/app) | `layout.tsx` define idioma, fonte e metadados. `page.tsx` monta o painel sob `Providers`. As seções compartilham `/`. |
| [Dashboard](../frontend/features/dashboard.tsx) | Resolve metadados e guarda seção, base e filtros em React. `changeDataset` redefine o recorte e limpa consultas da base anterior de forma imediata. A remoção remota ocorre em segundo plano e a API expira a base se ela ficar órfã. |
| [Providers](../frontend/components/providers.tsx) e [useAnalytics](../frontend/hooks/use-analytics.ts) | Criam uma instância de QueryClient por montagem. O hook transforma endpoint, filtros e parâmetros específicos em chave de cache por dataset. Propaga cancelamento via `AbortSignal`. |
| [api](../frontend/lib/api.ts) | Recebe caminho relativo, opções Fetch e ID opcional. Adiciona cabeçalho de sessão, lê JSON e trata `204` sem corpo. Produz `ApiError` para erros HTTP e de conexão, preservando cancelamentos. |
| [Tipos](../frontend/types/analytics.ts) e [formatação](../frontend/lib/format.ts) | Mantêm contratos do JSON e apresentam reais, percentuais e datas PT-BR/UTC. `presetPeriod` conta dias inclusivos e respeita a data inicial da base. |
| [Filtros](../frontend/components/filters.tsx) | `DateFilter` mantém edição provisória até aplicar e usa limites do dataset. `Dimensions` limita os produtos à categoria ativa e limpa produto ao trocar categoria. |
| [Vendas](../frontend/features/sales.tsx) | Busca resumo e série com consultas separadas. Deriva apresentação de visão geral ou vendas e permite mudar o agrupamento. |
| [Produtos e clientes](../frontend/features/breakdowns.tsx) | Apresenta ranking e curva ABC para até 20 produtos no gráfico. A tabela mantém o conjunto retornado. Clientes mostra cobertura, métricas e segmentos ou estado vazio. |
| [Previsão](../frontend/features/forecast.tsx) | Usa o horizonte para buscar projeção e erros. A janela insuficiente ainda pode mostrar o histórico. |
| [Simulador](../frontend/features/scenario.tsx) | Envia recorte e premissas via mutação, apresenta o resultado e é remontado quando o recorte muda. Inputs ficam desabilitados durante a submissão. |
| [Importação](../frontend/features/import.tsx) | Aplica verificações UX de extensão e tamanho, envia o arquivo como bytes e chama `onImport` com o contrato validado. Oferece modelo CSV e feedback de erros. |
| [Componentes](../frontend/components) | `charts` traduz séries Recharts, `metrics` formata indicadores, `product-table` exibe ranking, `states` organiza erro/vazio/carregamento, `credits` aplica o crédito compartilhado. `ui` contém primitivas e usa as classes CSS da aplicação. |

Para estender uma feature, reutilize o estado global de filtros, o cliente HTTP e os componentes visuais. As regras ficam nos serviços. A revisão de interface usa [a matriz manual](testing.md#validação-no-navegador).

## Backend

| Módulo | Contratos e manutenção |
| --- | --- |
| [main.py](../backend/app/main.py) | `lifespan` cria store, agenda limpeza e cancela a tarefa no desligamento. O middleware define CORS e no-store. O handler de validação apresenta campos, sem reproduzir valores de entrada. |
| [routes.py](../backend/app/api/routes.py) | Converte dependências HTTP em `Dataset` e `Selection`. `get_demo` usa cache de processo. `get_dataset` distingue ausência de chave e chave inválida. `upload` lê em streaming, valida em thread, grava após sucesso e devolve chave. `remove` é idempotente. Cobertura em [test_api.py](../backend/tests/test_api.py). |
| [config.py](../backend/app/core/config.py) | Carrega `.env`, deriva a lista de origens e define orçamento por upload, histórico, capacidade e TTL. Alterações precisam refletir nos textos da UI e nos guias de operação. |
| [dataset.py](../backend/app/models/dataset.py) | `Dataset` carrega DataFrame e indicação demo. Trate o DataFrame como imutável enquanto compartilhado. O store sincroniza operações com lock e usa relógio monotônico para expiração. |
| [schemas/analytics.py](../backend/app/schemas/analytics.py) | Define datas, filtros, resultados e nulos. Mudanças de schema impactam OpenAPI e tipos frontend. |
| [imports.py](../backend/app/services/imports.py) | `parse_csv` recebe bytes limitados na rota, valida schema e consistência e retorna DataFrame de itens. Erros de conteúdo são `ValueError`. `with_revenue` retorna frame com centavos derivados. Testes cobrem casos de CSV inválido e IDs ausentes. |
| [analytics.py](../backend/app/services/analytics.py) | `select` resolve datas, dimensões e comparação, ou lança `ValueError`. `calculate_metrics`, `summarize`, `breakdown` calculam KPIs e agrupamentos. `daily_revenue` e `sales_series` alinham dias e intervalos. `customers` agrupa pedidos identificados. `simulate` usa o ticket com precisão antes do arredondamento final. Veja [test_analytics.py](../backend/tests/test_analytics.py). |
| [forecast.py](../backend/app/services/forecast.py) | `calendar_features` monta tendência e indicadores semanais. `forecast` recebe recorte e horizonte de 7/30 dias e retorna contrato com histórico, teste e projeção. Origem comum permite transformar datas futuras. Os testes alteram a janela reservada para verificar ausência de vazamento na avaliação. |
| [generate_demo.py](../backend/data/generate_demo.py) | Gera dados determinísticos para as mesmas dependências. Como script, escreve `data/demo.csv`. É chamado sem escrita em disco pelo serviço. |

[Contratos e exemplos](api-reference.md) · [Testes](testing.md)
