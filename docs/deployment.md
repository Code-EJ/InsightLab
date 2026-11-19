# Implantação

A configuração versionada define uma topologia Vercel + API Python em contêiner. Os comandos a seguir também servem para conferir a imagem localmente. Veja [o diagrama](diagrams/README.md#implantação).

## API Python

Na raiz do repositório:

```sh
docker build -t insightlab-api ./backend
docker run --rm -p 127.0.0.1:8000:8000 insightlab-api
```

No provedor, configure `backend` como contexto, use o [Dockerfile](../backend/Dockerfile) e exponha o `PORT` fornecido pelo serviço, com 8000 como padrão. Configure uma checagem de saúde em `GET /api/health` com tolerância ao carregamento da base no início do processo. Defina `CORS_ORIGINS` com os endereços HTTPS do frontend e mantenha um processo e uma réplica enquanto o store for local.

O contêiner usa Python 3.14, usuário sem privilégios, Uvicorn com limite de concorrência 24 e logs de acesso desativados. Use TLS e limites de requisição e tempo no provedor para uma exposição pública.

## Frontend Vercel

1. Importe o repositório e defina **Root Directory** como `frontend`, com Node.js 24.
2. Defina `NEXT_PUBLIC_API_URL` como a origem HTTPS da API, sem `/api`. A variável entra no bundle no build.
3. Use [vercel.json](../frontend/vercel.json), que instala via `npm ci` e compila via `npm run build`.
4. Inclua a origem pública ou de preview autorizada em `CORS_ORIGINS` no backend.

[Monorepos na Vercel](https://vercel.com/docs/monorepos)

## Verificações após a implantação

- Verifique `/api/health`, `/api/dataset` e a Visão geral sem credencial de dataset.
- Abra o painel na origem final e confira a chamada no navegador. CORS é avaliado no browser.
- Valide upload e exclusão com arquivo fictício na mesma instância da API. Reinícios descartam as importações daquela instância.
- Registre no README um link de demonstração apenas depois de verificar a URL e o fluxo.

[Instalação local](getting-started.md) · [Segurança](security.md)
