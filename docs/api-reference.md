# Referência da API HTTP

Base local: `http://localhost:8000`. Consulte `/docs` para Swagger UI e `/openapi.json` para os contratos de [Pydantic](../backend/app/schemas/analytics.py). Datas em ISO `AAAA-MM-DD`, valores monetários em reais e participações em percentuais de 0 a 100 e variações em percentuais com sinal.

## Rotas

| Método e caminho | Entrada | Saída |
| --- | --- | --- |
| GET `/api/health` | — | `200` com `{"status":"ok"}`. |
| GET `/api/dataset` | Chave opcional | `DatasetInfo`: datas, `demo`, contagem de linhas, categorias e produtos, presença de IDs de cliente. |
| GET `/api/summary` | Filtros | `Summary`: janela atual/anterior, receita, pedidos, ticket, unidades, crescimento, categorias e até cinco produtos por unidades. |
| GET `/api/sales` | Filtros e `group=day\|week\|month` | `SalesSeries`: pontos com datas e receitas atual e anterior. Padrão semanal. |
| GET `/api/products` | Filtros | `Products`: categorias e produtos com receita, unidades, participação, crescimento e ABC. |
| GET `/api/customers` | Filtros | `Customers`: contagens, cobertura, frequência, ticket, receita por cliente e segmentos. |
| GET `/api/forecast` | Filtros e `horizon=7\|30` | `Forecast`: histórico, projeção, horizonte, janela de teste, MAE/RMSE e mensagem. Padrão de 30 dias. |
| POST `/api/scenario` | JSON `ScenarioInput` e chave opcional | `Scenario`: base observada, volume, ticket, faturamento simulados e diferença. |
| POST `/api/datasets` | Corpo bruto `text/csv` ou `application/csv` | `201` com `dataset_id` e `info`. |
| DELETE `/api/datasets` | Cabeçalho `X-Dataset-Id` obrigatório | `204` para descarte idempotente, inclusive se a chave já expirou. |

`X-Dataset-Id` é opcional nas leituras e no simulador. Omiti-lo seleciona a base de demonstração. Uma chave fornecida e desconhecida resulta em `404` nesses endpoints.

## Filtros e comparação

`start`, `end`, `category` e `product` são filtros opcionais. Sem datas, o início é o mais recente entre a primeira venda e 89 dias antes da data máxima, e o fim é a data máxima. Cada data fornecida substitui o respectivo padrão. As datas são inclusivas e devem estar dentro da base, com início até o fim. Categoria e produto são igualdades textuais, com até 100 caracteres. Um recorte dimensional sem itens pode retornar totais zero.

A comparação usa a janela anterior de mesma duração e os mesmos filtros. Valores anteriores e percentuais ficam nulos quando indisponíveis. Projeção vazia com `200` indica histórico insuficiente e inclui uma mensagem.

## CSV

```csv
date,order_id,product,category,quantity,unit_price,customer_id
2026-09-01,P001,Fone Bluetooth,Eletrônicos,1,199.90,C001
2026-09-01,P001,Carregador,Eletrônicos,2,59.00,C001
2026-09-05,P002,Luminária,Casa,1,79.90,
```

Use UTF-8 com BOM opcional. A API aceita vírgula ou ponto e vírgula como separador, com vírgula decimal no segundo caso. Também aceita os aliases `data_venda,id_pedido,produto,categoria,quantidade,preco_unitario,id_cliente`. Cada linha representa um item. Repetições do pedido devem ter o mesmo dia e IDs de cliente compatíveis. A coluna de cliente é opcional. Quantidade de 1 a 10.000, preço não negativo de até sete dígitos inteiros e duas casas decimais, datas de 1900 a 2200. Veja [os limites totais](security.md#controles-implementados).

## Exemplos

Use `curl.exe` no PowerShell ou `curl` em Bash.

```sh
curl 'http://localhost:8000/api/sales?start=2026-10-01&end=2026-10-31&group=day'
curl 'http://localhost:8000/api/forecast?horizon=7'
curl -H 'Content-Type: text/csv' --data-binary '@vendas.csv' http://localhost:8000/api/datasets
```

Depois da importação, use a chave devolvida apenas nas requisições da sessão:

```sh
curl -H "X-Dataset-Id: $DATASET_ID" http://localhost:8000/api/summary
curl -X DELETE -H "X-Dataset-Id: $DATASET_ID" http://localhost:8000/api/datasets
```

Corpo JSON para `POST /api/scenario` com `Content-Type: application/json`:

```json
{"start":"2026-10-01","end":"2026-10-31","sales_growth":10,"ticket_change":-5,"order_volume":1000}
```

Variações de `-100` a `300` percentuais, com padrão zero. `order_volume` aceita de 0 a 1.000.000 ou nulo para usar o volume observado.

## Erros esperados

| Código | Situação |
| --- | --- |
| 404 | Base importada ausente, expirada ou descartada. |
| 413 | Upload excede 5 MiB. |
| 415 | Tipo de mídia do upload não é CSV. |
| 422 | Validação de filtros, conteúdo, cabeçalhos ou parâmetros. |
| 503 | Capacidade temporária atingida ou limite de concorrência do servidor. |

Os erros tratados pela API incluem `detail` com texto. Falhas geradas pelo provedor podem ter outro formato. [Solução de problemas](troubleshooting.md)
