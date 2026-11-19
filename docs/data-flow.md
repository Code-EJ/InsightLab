# Fluxo de dados

## Origem e formato interno

`data/generate_demo.py` produz itens de pedido com identificadores fictícios, preços, quantidade e datas entre maio de 2025 e outubro de 2026. A API chama `with_revenue` ao criar o dataset demo. O CSV importado entra por `POST /api/datasets`, passa pelo parser e chega ao mesmo formato de DataFrame.

| Campo interno | Unidade ou regra |
| --- | --- |
| `date` | Dia de venda sem horário. |
| `order_id` | Identificador de pedido. Um pedido pode ter várias linhas. |
| `product`, `category` | Dimensões textuais. O ranking usa o par categoria/produto. |
| `quantity`, `unit_price` | Quantidade inteira e preço em reais com até duas casas decimais. |
| `customer_id` | Identificador anônimo opcional. Nos CSVs, a linha sem ID pode herdar o ID de outra linha do pedido. |
| `revenue_cents` | Receita do item em centavos inteiros, derivada do preço e da quantidade. |

## Sessão de importação

A API valida tamanho e tipo antes de analisar o CSV. O parser valida linhas, consistência por pedido e dimensões. A resposta contém o ID aleatório e metadados com datas e categorias. `Dashboard` mantém o ID no estado e `api` o envia em `X-Dataset-Id`. Reiniciar a página devolve a interface à demonstração. Ao trocar de base ou descartá-la na interface, o cliente limpa consultas da base anterior e solicita a remoção ao servidor. Se a remoção falhar ou a aba fechar, a expiração continua no servidor.

O store limita a dez bases importadas, com prazo de 30 minutos contado desde o upload. A consulta verifica o prazo e uma tarefa periódica libera entradas expiradas. A chave não é renovada por leituras. Reiniciar a API libera as importações daquela instância.

## Da seleção à resposta

O recorte global envia data, categoria e produto. A API aplica os filtros dimensionais antes da agregação temporal. A janela anterior, quando disponível, tem duração igual à atual. A API serializa os resultados em JSON, em reais para valores monetários e em percentuais já calculados para participação e variação. O frontend formata e renderiza a resposta. A previsão usa a série diária e a simulação usa o total observado e as premissas enviadas no JSON.

[Diagramas de dados e sequência](diagrams/README.md#dados) · [Contratos HTTP](api-reference.md) · [Cálculos](metodologia.md)
