# Contribuindo com o InsightLab

## Ambiente

Siga o [guia de instalação](docs/getting-started.md). Trabalhe com a base sintética ou um CSV de teste anônimo. Confira a [arquitetura](docs/architecture.md) antes de distribuir responsabilidades entre as camadas.

## Issues e branches

- Use o formulário de bug para informar resultado observado, resultado esperado, passos de reprodução e versões.
- Use o formulário de melhoria para delimitar o problema e os critérios de aceite.
- Remova dados de clientes, chaves de datasets e informações privadas dos anexos. Para falhas de segurança, siga [SECURITY.md](SECURITY.md).
- Crie a branch a partir de `main` atualizada. Use nomes como `fix/periodo-anterior`, `feat/filtro-categoria` ou `docs/referencia-api`.
- Use commits pequenos com prefixos `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `ci:` ou `chore:`. Descreva o que muda e inclua motivações relevantes no corpo.

## Pull requests

1. Relacione a issue, quando existir, e explique a mudança para quem revisa.
2. Informe os comandos executados e o resultado. Inclua capturas reais se houver alteração visual.
3. Atualize a documentação da API, metodologia, configuração ou operação que a mudança afetar.
4. Confira os checks da CI e solicite revisão da área afetada. Registre limitações ou casos pendentes.

A revisão considera consistência dos indicadores, contratos e comportamento de carregamento e erro. Em mudanças na previsão, mantenha as observações de teste fora do treinamento usado para medir o erro. Em mudanças de upload, preserve a validação, os limites e o isolamento por chave.

## Estilo e testes

Use os nomes do domínio e as convenções existentes no código. O frontend segue TypeScript estrito e usa ESLint com as regras do Next.js, React e TypeScript. O backend usa quatro espaços, docstrings em pontos de entrada e Ruff para lint e organização de imports. A documentação é escrita em português brasileiro.

Execute os comandos do [guia de testes](docs/testing.md). Para cálculos ou validações novas, prefira casos pequenos com resultados verificáveis. Cubra alterações de contrato com TestClient. Quando houver comportamento visual, verifique desktop e mobile com a API ativa.
