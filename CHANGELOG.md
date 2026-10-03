# Changelog

Formato [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/), versões [SemVer](https://semver.org/lang/pt-BR/).

## [Unreleased]

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
