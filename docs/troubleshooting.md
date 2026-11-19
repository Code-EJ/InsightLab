# Solução de problemas

| Sintoma | Diagnóstico e ação |
| --- | --- |
| Painel informa falha de conexão | Verifique `/api/health`, o endereço efetivo configurado em `NEXT_PUBLIC_API_URL` e a origem da página em `CORS_ORIGINS`. Reinicie a API após mudar o ambiente. Refaça o build se a origem pública da API mudou. |
| Porta 3000 ocupada | Use `npm run dev -- --port 3001` e autorize o protocolo, host e porta em `CORS_ORIGINS`. |
| O health responde via curl, mas falha no navegador | Abra as ferramentas do navegador e verifique CORS, protocolo e URL. Uma origem HTTPS deve consultar uma API HTTPS em produção. |
| CSV rejeitado | Confira UTF-8, cabeçalhos, campos obrigatórios, formato das datas, separador decimal e consistência de pedido. Veja [CSV](api-reference.md#csv). |
| Upload recebe 503 | Os slots temporários ou a concorrência podem estar no limite. Reutilize a base ativa, descarte uma importação que você controla ou aguarde a expiração. |
| A base importada desapareceu ou retornou 404 | A chave expira após 30 minutos e depende da instância. Recarregar a aba volta à demo. Retome pela importação e confira se a API usa uma única réplica. |
| Crescimento ou comparação aparece indisponível | Escolha um intervalo que tenha histórico anterior completo. Base anterior com valor zero também impede calcular crescimento percentual. |
| Previsão aparece sem projeção | Use pelo menos 67 dias para horizonte de 7 ou 90 dias para horizonte de 30. Garanta pelo menos 14 dias com receita positiva antes do teste no recorte selecionado. |
| Clientes sem métricas | Use um CSV com `customer_id` anônimo. Métricas se limitam aos pedidos identificados do recorte. |
| Divergência entre ambientes de desenvolvimento | Confira versões do runtime, use `npm ci` e consulte as versões instaladas com `npm ls --depth=0` e `python -m pip list`. |

Para abrir uma issue, envie commit, passos, comportamento esperado e observado e uma fixture fictícia mínima. [Contribuição](../CONTRIBUTING.md)
