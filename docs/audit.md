# Auditoria técnica

Inventário levantado na cópia de trabalho em **19 de novembro de 2026**. As versões abaixo são uma amostra instalada, distinta dos intervalos declarados nos manifests. O repositório remoto consultado era privado, com `main` como branch padrão, sem homepage configurada, sem licença identificada e sem releases. O histórico acessível antes das alterações continha o commit inicial com apenas `.gitattributes`.

## Stack e versões observadas

| Camada | Implementação e versões |
| --- | --- |
| Frontend | Node.js 24.12.0, npm 11.6.2, Next.js 16.4.6, React 19.3.1, TypeScript 5.9.3, Tailwind 4.3.5. |
| Visualização e dados web | Recharts 3.11.0, TanStack Query 5.108.0, Lucide 0.577.0, Manrope Variable 5.3.0. Primitivas shadcn/ui em `components/ui`, CVA, clsx e tailwind-merge. |
| Backend | Python 3.14.2, FastAPI 0.165.0, Starlette 1.10.0, Uvicorn 0.54.0, Pydantic 2.14.3, python-dotenv 1.2.4. |
| Análise | pandas 3.1.1, NumPy 2.5.5 e scikit-learn 1.9.1. |
| Qualidade | pytest 9.2.0, httpx2 2.16.2, Ruff 0.17.5 e ESLint 10.15.0 com @next/eslint-plugin-next 16.4.6, typescript-eslint e React Hooks. |

## Inventário funcional e operacional

- App Router monta um painel cliente de sete seções que compartilham filtros e dataset. Os componentes, hooks e serviços constam no [guia do código](codebase-guide.md).
- FastAPI fornece nove rotas funcionais sob `/api`, contando os dois métodos de `/datasets` como operações distintas e incluindo health. Contratos e exemplos constam na [referência HTTP](api-reference.md).
- O armazenamento usa DataFrames em memória e expiração em processo. Para bases importadas, o token aleatório faz controle de posse. A arquitetura atual dispensa banco e fluxo de contas.
- Nenhum serviço de autenticação, banco gerenciado ou API comercial é necessário para o uso principal. Ferramentas de instalação e build consultam registries de dependências. Swagger UI usa recursos padrão da FastAPI e pode depender de CDN no navegador.
- O [guia de implantação](deployment.md) descreve Vercel, Docker Python, variáveis e topologia. As [regras de negócio](metodologia.md) definem cálculo, comparação e estimativas.
- `node_modules/`, `.next/`, `.venv/` e o CSV gerado são artefatos locais ignorados. `npm` mantém dependências opcionais de plataforma no lockfile. O inventário de fonte não revelou artefatos grandes ou arquivos vazios que precisassem ser removidos. O Next.js gera o guia de agentes em `frontend/AGENTS.md` ao iniciar o ambiente de desenvolvimento.
- A documentação anterior concentrava instalação e metodologia. O índice agora liga API, operação, segurança, desenvolvimento, testes, auditoria e capturas.

## Lacunas e riscos

| Achado | Efeito |
| --- | --- |
| Chave temporária sem conta | Adequada ao uso demo. A proteção depende da posse da chave e da camada de transporte. |
| Store e limites por processo | Restart ou múltiplas instâncias afetam importações. A capacidade local e o limite de upload reduzem custo por requisição. |
| Contratos duplicados manualmente | Alterar um schema exige atualizar os tipos TypeScript e as expectativas dos testes. |
| Dependências Python com intervalos | Ambientes instalados em datas diferentes podem resolver versões diferentes. |
| Previsão avaliada em uma janela por horizonte | O erro medido pode não se repetir em meses ou negócios diferentes. |
| Cobertura versionada concentrada no backend | O roteiro visual complementa a checagem do frontend. |
| Titularidade sem comprovação no histórico | O texto MIT fica como [proposta](../LICENSE.proposed) até confirmação dos direitos. |

O `npm audit` inicial e o `pip-audit` sobre os requisitos de produção do backend não retornaram advisories conhecidos na execução. Essa consulta depende das versões resolvidas, do serviço e da data da auditoria. Os [controles e riscos de operação](security.md) continuam aplicáveis.
