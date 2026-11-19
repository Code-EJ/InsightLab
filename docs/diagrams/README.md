# Diagramas

## Arquitetura geral

Veja o [diagrama do README](../../README.md#arquitetura). Ele mostra a consulta direta do navegador à API e o armazenamento no processo Python.

## Componentes

O painel controla a seção, os filtros e a base. As features reutilizam as consultas e primitivas visuais. O único caminho HTTP parte do cliente do navegador.

```mermaid
flowchart LR
    L["app/layout.tsx"] --> H["app/page.tsx"]
    H --> P["Providers"]
    P --> D["Dashboard"]
    D --> S["SalesView · ProductsView · CustomersView · ForecastView"]
    D --> M["ScenarioView · ImportView"]
    D --> F["DateFilter · Dimensions · Credits"]
    S --> Q["useAnalytics"]
    Q --> C["lib/api.ts"]
    M --> C
    D --> C
    S --> R["charts · metrics · product-table"]
    C --> A["FastAPI · /api"]
```

## Dados

A importação e a demonstração convergem no mesmo DataFrame. A receita em centavos é derivada antes da análise.

```mermaid
flowchart LR
    G["generate_demo"] --> W["with_revenue"]
    CSV["CSV em bytes"] --> I["parse_csv"]
    I --> W
    W --> DS["Dataset · pandas DataFrame"]
    DS --> STORE["DatasetStore"]
    STORE --> SEL["analytics.select"]
    SEL --> AGG["Indicadores · série · ranking · clientes"]
    SEL --> ML["forecast · Ridge"]
    SEL --> SIM["analytics.simulate"]
    AGG --> SC["Schemas Pydantic"]
    ML --> SC
    SIM --> SC
    SC --> UI["JSON · painel"]
```

## Sequência da importação

A interface troca a fonte após validação. A chave é uma credencial temporária de posse, associada ao processo que aceitou o upload.

```mermaid
sequenceDiagram
    actor U as Visitante
    participant F as ImportView e Dashboard
    participant A as FastAPI
    participant P as parse_csv
    participant D as DatasetStore
    U->>F: Seleciona CSV e confirma
    F->>A: POST /api/datasets com text/csv
    A->>P: Valida bytes e conteúdo
    alt Upload válido e capacidade disponível
        P-->>A: DataFrame normalizado
        A->>D: Salva base com prazo
        D-->>A: Chave temporária
        A-->>F: 201 com dataset_id e info
        F->>A: GET /api/summary com X-Dataset-Id
        A->>D: Consulta a chave
        D-->>A: Base importada ou ausência
        A-->>F: 200 com indicadores ou 404
    else Conteúdo inválido
        P-->>A: ValueError
        A-->>F: 422 com mensagem de validação
    end
```

## Jornada do visitante

A fonte selecionada permanece ao trocar de seção. Um upload bem-sucedido redefine o intervalo para a nova base.

```mermaid
flowchart TD
    O["Abrir Visão geral com dados simulados"] --> F["Alterar período, categoria ou produto"]
    F --> V["Explorar vendas, produtos ou clientes"]
    F --> P["Selecionar 7 ou 30 dias na previsão"]
    P --> H{"Histórico suficiente?"}
    H -->|Sim| T["Ver projeção e erros"]
    H -->|Não| I["Ler aviso de histórico insuficiente"]
    F --> S["Calcular cenário hipotético"]
    O --> C["Importar CSV opcional"]
    C --> R{"CSV aceito?"}
    R -->|Sim| A["Explorar dados importados"]
    R -->|Não| E["Revisar mensagem e corrigir CSV"]
    E --> C
```

## Implantação

O diagrama representa a topologia configurada para implantação. O frontend é entregue pela Vercel e a API roda em um serviço Python com um processo e uma réplica. A infraestrutura precisa ser provisionada antes de disponibilizar uma demonstração online.

```mermaid
flowchart LR
    R["Repositório Git"] --> V["Vercel · build de frontend"]
    R --> C["Provedor Python · build de backend/Dockerfile"]
    V --> B["Navegador · bundle Next.js"]
    B -->|HTTPS com origem autorizada| A["Uvicorn · FastAPI"]
    C --> A
    A --> D["DatasetStore · RAM"]
    H["Health check do provedor"] -->|GET /api/health| A
```

O sistema usa o DataFrame descrito no [fluxo de dados](../data-flow.md) e a chave temporária descrita em [segurança](../security.md). Diagramas relacionais e de autenticação de contas ficam fora do escopo da arquitetura atual.
