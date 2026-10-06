# Changelog

Formato [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/), versões [SemVer](https://semver.org/lang/pt-BR/).

## [Unreleased]

## [0.2.0] - 2026-10-05

### Added

- Caixa por turno: abre com troco, fecha com contagem às cegas; esperado = troco + dinheiro; dono vê a diferença.
- Mensalistas: cadastro, planos com dias e janela de horário, baixa de mensalidade (mês a mês, suspensa recomeça de hoje).
- Financeiro do dono: equipe com encargos, custos, folha do mês (idempotente), receita - custo = lucro, CSV para Excel.
- Histórico por placa e período; lançamento retroativo (ficha de papel) marcado e auditado.
- Configurações do dono: preços, regras de reserva, chave Pix, vagas (bloquear, liberar para reserva, criar, excluir) e operadores. Mudanças de preço e regra vão para a auditoria com antes e depois.
- Menu com todas as telas; Financeiro e Configurações só para o dono.
- Portal do motorista (Fase 2): cadastro público, login, veículos, busca de vagas por período, reserva com código, cancelamento com reembolso conforme prazo e retenção.
- Guichê: tela Reservas (confirmar pagamento, cancelar, marcar reembolso), entrada pela placa leva à vaga reservada, cobrança só do excedente, mapa mostra vagas reservadas.
- Regras de reserva editáveis no banco (antecedência, duração, expiração, prazo de cancelamento, retenção, janela do avulso, chave Pix).
- Reserva pendente expira sozinha; uma pendente por motorista; lock na vaga contra reserva dupla.

### Changed

- Cadastro público habilitado, sempre com papel `motorista`. A cobrança por Pix automático (gateway) segue pendente: por enquanto o guichê confirma o pagamento.

## [0.1.0] - 2026-10-02

### Added

- Spec revisada `docs/MVP_v1.1.md`.
- Base: Next.js 16, Prisma 7 + Postgres, Better Auth (e-mail/senha, rate-limit no banco), Tailwind v4.
- Modelo de dados da Fase 1 com índices únicos parciais (uma estadia aberta por vaga e por placa).
- Regras de dinheiro com testes: preço avulso com diária por bloco de 24h (RN-05), janela de plano mensal, status de mensalidade (RN-06), placa antiga/Mercosul (RN-12).
- Pátio: um campo de placa decide entrada ou saída; mapa com 4 status (cor + ícone + texto) e selo de reservável.
- Quem está dentro, com valor parcial e alerta de permanência.
- Painel Hoje: vagas, entradas/saídas, receita por forma de pagamento (só dono), pendências de mensalistas.
- Auditoria de entrada/saída, `GET /api/v1/health`, seed do estacionamento demo, CI.
