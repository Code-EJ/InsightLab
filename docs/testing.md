# Testes e validações

## Executar

No frontend, com Node.js 24:

```sh
npm ci
npm run lint
npm run typecheck
npm run build
npm audit --omit=dev --audit-level=high
```

No backend, com Python 3.14 e venv ativa:

```sh
python -m pip install -r requirements-dev.txt
python -m ruff check .
python -m pytest -q
```

A [CI](../.github/workflows/ci.yml) roda em dois jobs Linux para pull requests, pushes em `main` e acionamento manual. Ela verifica lint, tipos, build, testes e os advisories npm de produção conforme o limiar configurado. O resultado fica no check do commit quando o workflow estiver no remoto. A verificação de dependências Python pode ser executada em ambiente isolado com `pip-audit -r requirements.txt`.

## Cobertura existente

| Testes | Comportamentos |
| --- | --- |
| [test_analytics.py](../backend/tests/test_analytics.py) | Receita, pedidos, ticket, comparação, ranking, séries, clientes identificados, cenários, CSV inválido, geração determinística, histórico insuficiente e separação temporal para ambos os horizontes. |
| [test_api.py](../backend/tests/test_api.py) | Health, rotas de análise e filtros, simulação, upload, tipo de mídia, tamanho, isolamento e descarte de datasets, e CORS. Usa TestClient com lifespan. |

Os testes usam dados sintéticos ou fixtures pequenas. O frontend tem lint, checagem de tipos, build e roteiro de navegador. A suíte versionada permanece concentrada no backend.

## Validação no navegador

1. Abra a visão geral e confira receita e gráficos na demo.
2. Selecione 30 dias e uma categoria. Confira novos valores e produtos disponíveis. Alterne o agrupamento em Vendas.
3. Confira Produtos e Clientes, depois volte a 90 dias e alterne os horizontes de 7 e 30 dias.
4. Rode a simulação sem ajustes e depois altere uma premissa. A receita de base vem do mesmo recorte.
5. Importe o modelo CSV. Verifique a identificação da fonte, o ranking e o estado de histórico insuficiente. Volte à demonstração.
6. Verifique a navegação e os créditos em viewport desktop e mobile. O link de autoria abre uma nova aba.

Use [as capturas reais](screenshots/README.md) para referência visual.
