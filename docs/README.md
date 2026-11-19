# Documentação técnica

| Documento | Conteúdo |
| --- | --- |
| [Auditoria técnica](audit.md) | Inventário verificado, configuração do repositório, riscos e lacunas. |
| [Arquitetura](architecture.md) | Camadas, dependências, decisões e pontos de extensão. |
| [Instalação](getting-started.md) | Ambiente local, variáveis e primeiro teste. |
| [Guia de desenvolvimento](development-guide.md) | Convenções e fluxo de mudança. |
| [Guia do código](codebase-guide.md) | Módulos, entradas, saídas, erros e testes relacionados. |
| [API HTTP](api-reference.md) | Contratos, parâmetros, respostas e exemplos. |
| [Fluxo de dados](data-flow.md) | Origem dos dados, normalização, agregações e sessão temporária. |
| [Metodologia](metodologia.md) | Regras de negócio, modelo, teste temporal e simulador. |
| [Segurança](security.md) | Fronteiras de confiança, controles e limitações operacionais. |
| [Testes](testing.md) | Cobertura existente, qualidade e CI. |
| [Implantação](deployment.md) | Vercel, contêiner Python e variáveis. |
| [Solução de problemas](troubleshooting.md) | Diagnóstico por sintoma. |
| [Decisões](decisions/README.md) | Registros das decisões arquiteturais implementadas. |
| [Diagramas](diagrams/README.md) | Componentes, dados, sequência, jornada e infraestrutura. |
| [Capturas](screenshots/README.md) | Interface em execução no desktop e em viewport mobile. |

O InsightLab usa armazenamento em memória e acesso por chave temporária para importações. Esses assuntos estão em [fluxo de dados](data-flow.md) e [segurança](security.md). A estrutura atual dispensa guias de banco relacional, autenticação de contas e seus diagramas.

**Developed by oEnzoRibas** · [GitHub](https://github.com/oEnzoRibas)
