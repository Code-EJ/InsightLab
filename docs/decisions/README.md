# Decisões arquiteturais registradas

Estes registros descrevem decisões já refletidas no código da versão 0.1.0.

## ADR 001 · Cálculos na API Python

**Contexto.** A aplicação apresenta indicadores, séries, cenários e projeções que precisam usar as mesmas regras.

**Decisão.** Calcular no backend com pandas, NumPy e scikit-learn e publicar contratos Pydantic. A UI mantém tipos correspondentes e se concentra na interação.

**Consequências.** As regras podem ser verificadas com fixtures Python e testes HTTP. O frontend precisa de acesso à origem da API e acompanha alterações de contrato.

## ADR 002 · Importações temporárias por processo

**Contexto.** A demonstração precisa aceitar um CSV pequeno e manter a instalação local simples.

**Decisão.** Guardar bases importadas em memória com limite de capacidade, chave aleatória e expiração.

**Consequências.** A API inicia sem banco. Recarregamentos, reinícios ou múltiplas réplicas limitam a continuidade da sessão. A chave precisa ser protegida e só concede acesso à base correspondente.

## ADR 003 · Ridge e baseline semanal

**Contexto.** O painel estima receita diária em dois horizontes com recortes selecionados pelo visitante.

**Decisão.** Usar tendência e calendário semanal com Ridge, avaliar em um trecho cronológico reservado e comparar com repetição da última semana do treino.

**Consequências.** A avaliação é reproduzível para o mesmo recorte. Uma janela isolada e a ausência de eventos externos limitam a interpretação da projeção.
