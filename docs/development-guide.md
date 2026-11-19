# Guia de desenvolvimento

## Convenções

- Preserve nomes de domínio e contratos existentes, como `order_id`, `revenue` e `average_ticket`. Escreva texto da interface e documentação em português brasileiro.
- Use TypeScript estrito, props tipadas e o alias `@/` no frontend. Os componentes em `components/ui` são primitivas compartilhadas. Use componentes de estado para carregamento, vazio e erro.
- Use anotações Python, docstrings nos pontos de entrada e agregações no serviço. Formate valores para visualização no cliente. Mantenha imports em ordem com Ruff. A [configuração do editor](../.editorconfig) usa UTF-8 e LF.
- Documente invariante, unidade, efeitos e erros onde forem relevantes. Evite comentários que apenas repetem a expressão.

## Adicionar ou alterar uma análise

1. Escreva a regra de negócio e defina a unidade de cada campo. Use uma fixture determinística que permita calcular o resultado manualmente.
2. Implemente a agregação em `app/services`. Reuse `Selection` para seleção de filtros e comparação.
3. Declare entradas e saídas em `app/schemas` e conecte a rota em `app/api/routes.py`. Atualize a referência HTTP e confira o OpenAPI.
4. Sincronize `frontend/types/analytics.ts`, use `useAnalytics` para consultas e apresente o resultado na feature.
5. Execute [as validações locais e os testes](testing.md). Confira no navegador período vazio, base curta e dados com IDs de cliente ausentes quando afetarem a mudança.

## Alterar a importação

As duas entradas de dados precisam resultar no mesmo esquema interno de vendas. Preserve as verificações de codificação, colunas, valores e consistência por pedido. Mudanças de formato pedem revisão do modelo baixável em `frontend/features/import.tsx`, das mensagens do parser e da seção CSV na [referência da API](api-reference.md).

## Alterar a previsão

Preserve a ordem temporal e a separação entre treino e teste. Compare o candidato no mesmo horizonte e na mesma janela do baseline. Registre resultados que você realmente executou, junto com o recorte e as versões de dependências. Atualize [a metodologia](metodologia.md) quando mudar limiares, variáveis, métricas ou limitações.

[Processo de contribuição](../CONTRIBUTING.md)
