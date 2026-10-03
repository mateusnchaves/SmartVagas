# Smart Vagas

Gestão simples de estacionamento para o dono: pátio, mensalistas, equipe e lucro do mês.
Reserva online de vagas é o diferencial da Fase 2.

**Spec:** [docs/MVP_v1.1.md](docs/MVP_v1.1.md) — leia antes de mexer em regra de negócio.

## Rodando localmente

Pré-requisitos: Node 22+ e **um** destes para o Postgres: Docker, ou nada (usa `prisma dev`).

```bash
cp .env.example .env
npm install
```

Suba o banco (escolha um):

```bash
# Com Docker
docker compose up -d

# Sem Docker: Postgres embutido do Prisma. Depois troque DATABASE_URL e SHADOW_DATABASE_URL
# no .env pelas linhas comentadas do .env.example
npx prisma dev --name smart-vagas --detach
```

Crie as tabelas, os dados demo e suba o app:

```bash
npm run db:migrate && npm run db:seed && npm run dev
```

Abra http://localhost:3000. Usuários de teste: `dono@smartvagas.test` e `operador@smartvagas.test`,
com as senhas definidas em `SEED_SENHA_*` no `.env`.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | App em modo desenvolvimento |
| `npm test` | Testes das regras de negócio (Vitest) |
| `npm run typecheck` / `npm run lint` | Tipos e lint |
| `npm run db:migrate` | Cria/aplica migrations em dev |
| `npm run db:deploy` | Aplica migrations em produção |
| `npm run db:seed` | **Apaga tudo** e recria o estacionamento demo |
| `npm run versao:checar` | Confere `VERSION` = `package.json` |

## Estrutura

```
src/
  app/                  rotas (App Router). (painel)/ exige dono ou operador
  features/<dominio>/   regras puras + testes, queries, actions e componentes do domínio
  server/               prisma, auth, sessão/RBAC, auditoria, wrapper de actions
  lib/                  utilitários puros (tempo, dinheiro, placa, env)
  components/ui/        Button, Input, Card, Badge (padrão shadcn/ui)
prisma/                 schema, migrations, seed
docs/                   spec do MVP
```

## Convenções

- Domínio em português (`estadia`, `vaga`, `mensalista`); infraestrutura em inglês.
- **Dinheiro em centavos (inteiro).** Instantes em UTC, exibidos em `APP_TIMEZONE`.
- Regra de negócio editável pelo dono fica no banco (`configuracoes`), nunca em env.
- Toda action passa por `exigirEquipe()` (RBAC no servidor) e devolve `{ ok, dados } | { ok, erro }`.
- Índices únicos parciais e CHECKs que o Prisma não gera ficam em SQL cru no fim da migration
  (`migrate dev --create-only`, edita, aplica). O Prisma 7 não tenta removê-los depois.
- Conventional Commits (`feat:`, `fix:`) e uma linha no `CHANGELOG.md` por mudança visível.

## Status da Fase 1

- [x] Base, auth, RBAC, auditoria, health, CI
- [x] Pátio: entrada/saída por placa, mapa de vagas
- [x] Quem está dentro, painel Hoje
- [ ] Lançamento retroativo (RF-04c) e histórico por placa/período (RF-04b)
- [ ] Mensalistas: cadastro, planos, baixa de mensalidade (RF-06)
- [ ] Caixa por turno (RF-07d)
- [ ] Equipe, custos, folha do mês, lucro + CSV (RF-07b/c)
- [ ] Configurações do dono e cadastro de vagas/operadores (RF-01/02/03/08)
- [ ] E2E de entrada/saída (Playwright)
