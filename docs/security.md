# Modelo de segurança

## Fronteiras de confiança

A base demo pode ser consultada por qualquer cliente com acesso à API. O cabeçalho `X-Dataset-Id` funciona como credencial de posse para a base importada. Ela autoriza leitura e descarte daquela base. O navegador mantém a chave em memória e a API armazena a associação no processo que recebeu o upload. A implementação dispensa cadastro, login e papéis de usuário.

## Controles implementados

- CSV enviado como corpo de texto. O servidor controla o tamanho enquanto consome o stream, até 5 MiB. O parser limita 50.000 linhas, 1.000 nomes de produtos, 100 categorias e 3.653 dias. Valida UTF-8, colunas, valores e consistência do pedido.
- O conteúdo passa pelo parser CSV e entra no DataFrame como dados. A interface renderiza valores textuais em React. A funcionalidade de download distribui um modelo estático.
- `DatasetStore` usa UUID aleatório em hexadecimal, até 10 imports e expiração em 30 minutos. A limpeza também ocorre a cada minuto. Requisições com chave expirada recebem `404`. Os bytes originais do CSV não são gravados pelo backend.
- CORS é limitado às origens configuradas. A API emite `Cache-Control: no-store`. As mensagens de validação evitam ecoar os valores de entrada.
- O Dockerfile usa usuário sem privilégios, limita concorrência e desativa logs de acesso do Uvicorn.

## Riscos e limites operacionais

- Uma chave compartilhada ou capturada permite acesso à base até a expiração. Use HTTPS e evite registrar cabeçalhos e corpos no proxy. CORS aplica política de navegador e clientes diretos continuam sujeitos apenas às verificações da API.
- O limite de uploads armazenados não impede que várias requisições sejam processadas. Instalações públicas precisam de limites de requisição, tamanho e tempo no provedor. Evite enviar dados pessoais ou empresariais confidenciais à demonstração.
- Reinícios descartam as bases importadas. Uma API horizontalmente escalada precisaria de estratégia explícita para armazenamento, controle de acesso e retenção.
- O frontend usa lockfile. O backend usa intervalos de versão e pode resolver versões transitivas diferentes entre instalações. Verifique os advisories e valide mudanças de dependência junto aos testes.

[Política e reporte privado](../SECURITY.md) · [Implantação](deployment.md)
