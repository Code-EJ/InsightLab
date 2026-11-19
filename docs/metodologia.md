# Metodologia do InsightLab

## Agregações e qualidade dos dados

- **Receita** soma quantidade × preço unitário em centavos. **Pedidos** conta IDs distintos entre os itens que passam pelos filtros. O ticket médio divide a receita filtrada pelos pedidos distintos.
- A comparação usa os mesmos filtros na janela imediatamente anterior, com a mesma duração em dias. A taxa de crescimento é a diferença dividida pelo valor anterior. A taxa fica indisponível quando o histórico anterior for incompleto ou o denominador for zero.
- As séries diárias incluem dias sem vendas com valor zero. As semanas começam na segunda-feira e os meses seguem o calendário. Para comparar janelas de igual duração, cada ponto anterior usa o mesmo deslocamento em dias em relação ao início de sua janela. As primeiras e últimas semanas ou meses podem ser parciais.
- A visão geral ordena produtos por unidades. A análise ABC agrupa por categoria e produto e ordena por receita. A classe A inclui o produto que ultrapassa 80% de receita acumulada e a B inclui o que ultrapassa 95%, a partir da participação acumulada anterior a cada item. Produtos sem receita entram na classe C. Produtos presentes apenas no período anterior podem aparecer com queda de 100%.
- A segmentação usa pedidos distintos por ID de cliente identificado: compra única (1), recorrente (2 a 4) e frequente (5 ou mais). A frequência mede pedidos por cliente identificado. O gasto médio por cliente usa a receita desses clientes dividida pelo número de clientes identificados. O ticket por pedido usa a receita identificada dividida pelos pedidos identificados. A cobertura indica a porcentagem de pedidos com identificação.
- Campos obrigatórios ausentes são rejeitados com mensagens de validação. Uma linha sem ID de cliente pode herdar o ID informado em outra linha do mesmo pedido. Se o pedido inteiro estiver sem ID, ele continua nos totais de vendas e fica fora das métricas de clientes.

## Previsão diária

O modelo Ridge usa uma tendência linear no tempo e sete indicadores para os dias da semana. A receita é agregada por dia no intervalo filtrado. O ajuste usa receita em reais e limita as previsões a valores não negativos.

Para cada horizonte de 7 ou 30 dias, a avaliação reserva os últimos 7 ou 30 dias como teste. O treinamento usa somente os dias anteriores. O baseline sazonal repete a última semana observada no treino durante toda a janela de teste. Os dois métodos são avaliados com erro absoluto médio (MAE) e raiz do erro quadrático médio (RMSE) na mesma janela. Depois da avaliação, o modelo é treinado novamente com toda a janela selecionada e projeta os dias seguintes ao seu término. [Referência do scikit-learn sobre avaliação temporal](https://scikit-learn.org/stable/auto_examples/applications/plot_time_series_lagged_features.html)

A previsão exige pelo menos 60 dias de treino antes da janela de teste, com receita positiva em pelo menos 14 desses dias. Para 7 dias são necessários 67 dias de histórico e, para 30 dias, são necessários 90. O gráfico exibe até os últimos 120 dias observados. Dias sem linhas são tratados como dias sem venda. Uma exportação incompleta pode ser interpretada como uma queda de vendas. A regressão assume continuidade da tendência e do padrão semanal. Feriados, promoções, estoque e mudanças de preço podem afetar o resultado. A métrica mede o erro numa janela específica e a projeção é pontual, sem intervalos de confiança.

## Cenários hipotéticos

A simulação usa o faturamento e o ticket do recorte escolhido como referência. O volume informado substitui o volume base de pedidos. O crescimento ajusta esse volume, arredondado ao pedido inteiro mais próximo. A variação de ticket ajusta o valor médio por pedido. O faturamento simulado multiplica os pedidos simulados pelo ticket ajustado, com arredondamento monetário ao final. A diferença e a taxa comparam a simulação com a receita observada. O simulador aplica premissas fornecidas pelo visitante e é independente do modelo preditivo.
