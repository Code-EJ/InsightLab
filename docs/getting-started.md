# Instalação local

## Pré-requisitos

Use Git, Node.js 24 com npm 11 e Python 3.14. Docker é opcional para rodar a API em contêiner. Clone o [repositório](https://github.com/oEnzoRibas/InsightLab) com uma conta autorizada e abra dois terminais na raiz.

## Backend

PowerShell:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --no-access-log
```

Linux/macOS:

```sh
cd backend
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements-dev.txt
.venv/bin/python -m uvicorn app.main:app --reload --no-access-log
```

A base demo é carregada no início do processo. A API usa porta `8000` por padrão. Verifique [`/api/health`](http://localhost:8000/api/health) e [Swagger UI](http://localhost:8000/docs). Para gerar o arquivo ignorado pelo Git, execute `python -m data.generate_demo` dentro de `backend` com a venv ativa. A API gera a base diretamente e o arquivo exportado serve para inspeção ou teste.

## Frontend

```sh
cd frontend
npm ci
npm run dev
```

Use a URL impressa pelo Next.js. Em geral é [localhost:3000](http://localhost:3000).

## Configuração

| Variável | Onde definir | Padrão ou finalidade |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `frontend/.env.local` | `http://localhost:8000`. Origem da API, sem o sufixo `/api`. É pública no bundle. |
| `CORS_ORIGINS` | `backend/.env` ou ambiente do processo | `http://localhost:3000,http://127.0.0.1:3000`. Separe origens por vírgula, sem caminho. |
| `PORT` | Ambiente do contêiner da API | `8000` no Dockerfile. Fora do contêiner, passe `--port` ao Uvicorn para mudar a porta. |

Use os exemplos em [frontend](../frontend/.env.example) e [backend](../backend/.env.example). Se a porta 3000 estiver ocupada, rode `npm run dev -- --port 3001` e inclua `http://localhost:3001` em `CORS_ORIGINS` antes de iniciar a API. Para testar por `127.0.0.1:3001`, inclua essa origem também.

## Conferência rápida

Abra Visão geral e confirme a indicação de dados simulados. Selecione 30 dias pelo cabeçalho e uma categoria pelo filtro. Os indicadores devem responder ao recorte. Volte a 90 dias antes de experimentar uma previsão de 30 dias. Consulte [troubleshooting](troubleshooting.md) se a página não carregar os dados.
