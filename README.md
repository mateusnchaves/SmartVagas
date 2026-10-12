<div align="center">

# 🅿️ Smart Vagas

**Gestão de estacionamento para quem toca o negócio no dia a dia:**
quem está no pátio, quanto entrou hoje, quem está com a mensalidade atrasada
e se o mês deu lucro depois de salários e contas.

[![CI](https://github.com/mateusnchaves/SmartVagas/actions/workflows/ci.yml/badge.svg)](https://github.com/mateusnchaves/SmartVagas/actions/workflows/ci.yml)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Testes](https://img.shields.io/badge/testes-119-15803d)

</div>

---

## O problema

O dono de um estacionamento pequeno de centro costuma controlar tudo em papel, caderno ou WhatsApp.
Ele não sabe quem está dentro, perde vaga para mensalista inadimplente, o operador demora no horário
de pico e o lucro real, descontando salários e contas, nunca fica claro.

## A solução

Um sistema web, pensado para o celular e para o PC do guichê, que cobre a operação inteira. Tem também
um diferencial opcional: o dono escolhe quais vagas libera para **reserva online**, e o motorista
garante a vaga antes de sair de casa.

## Funcionalidades

### 🧑‍💼 Dono
- **Hoje:** vagas livres, entradas e saídas do dia, receita por forma de pagamento, carros acima do tempo e mensalistas com pendência.
- **Financeiro:** receita − custos = lucro do mês, com equipe (salário + encargos), custos lançados, folha mensal com um clique e exportação em CSV para o Excel.
- **Mensalistas:** planos com dias e horários (integral, noturno, fim de semana…), vaga fixa ou rotativa, e status em dia, atrasado ou suspenso calculado sozinho.
- **Caixa por turno:** o operador fecha contando a gaveta sem ver o valor esperado, e o dono vê a sobra ou a falta.
- **Configurações:** preços, tolerância, diária, regras de reserva, chave Pix, vagas e operadores, tudo sem mexer no código.

### 🧑‍🔧 Operador
- **Pátio:** um único campo de placa (desenhado como placa Mercosul) decide entre **entrada** (com vaga sugerida) e **saída** (com valor calculado). Placa + Enter + Enter: menos de 15 segundos.
- **Mapa de vagas** em tempo quase real: livre, ocupada, reservada e bloqueada, sempre com cor, ícone e texto.
- **Quem está dentro:** lista com o tempo de cada carro e quanto pagaria se saísse agora.
- **Histórico** por placa e período, e **lançamento retroativo** da ficha de papel quando a internet cai.

### 🚗 Motorista (portal do cliente)
- Cadastro, veículos e busca de vagas por horário.
- **Reserva** com código curto e pagamento antecipado (Pix).
- Cancelamento com reembolso conforme o prazo definido pelo dono.

## Decisões técnicas

| Decisão | Por quê |
|---|---|
| Dinheiro sempre em **centavos (inteiro)** | Nada de erro de arredondamento com `float`. |
| Regras de negócio no **banco**, não no código | O dono muda preço e tolerância sem precisar de deploy. |
| **Diária por bloco de 24h** | Um carro que fica 3 dias paga 3 diárias, não uma. |
| **Índices únicos parciais** no Postgres | Dois operadores não conseguem colocar dois carros na mesma vaga. |
| **Lock na vaga** ao reservar | 8 reservas simultâneas para 5 vagas resultam em 5 reservas, sem duplicar. |
| **RBAC no servidor** em toda action | Operador não vê salário nem lucro, mesmo chamando a API direto. |
| **Auditoria** de tudo que envolve dinheiro | Quem deu entrada, saída e baixa, e quem mudou preço (com o valor antes e depois). |
| Mapa com **cor + ícone + texto** | Legível para daltônicos e no sol do pátio. Vermelho só significa problema. |

## Stack

- **Next.js 16** (App Router, Server Actions) + **TypeScript** strict
- **Prisma 7** + **PostgreSQL**
- **Better Auth** (e-mail e senha, com rate-limit no banco)
- **Tailwind CSS v4**, componentes no padrão shadcn/ui, ícones Lucide
- **Zod** para validar toda entrada, **Vitest** para as regras de negócio
- **GitHub Actions**: lint, tipos, testes e build a cada push

## Rodando localmente

Pré-requisito: **Node 22+**. Docker é opcional.

```bash
git clone https://github.com/mateusnchaves/SmartVagas.git
cd SmartVagas
npm install
cp .env.example .env
```

No `.env`, troque o `BETTER_AUTH_SECRET` por um texto aleatório de 32+ caracteres e escolha o banco:

- **Sem Docker (mais simples):** descomente as linhas de `DATABASE_URL` e `SHADOW_DATABASE_URL` da seção "Sem Docker". O próprio Prisma sobe um Postgres local.
- **Com Docker:** rode `docker compose up -d` e mantenha a `DATABASE_URL` padrão.

Crie as tabelas e os dados de demonstração (um estacionamento de 50 vagas em Sorocaba):

```bash
npm run db:migrate
npm run db:seed
```

E rode:

```bash
npm run dev
```

O `npm run dev` sobe o banco local e o site juntos. Abra **http://localhost:3000**.

### Logins de demonstração

| Perfil | E-mail | Senha |
|---|---|---|
| Dono | `dono@smartvagas.test` | `SEED_SENHA_DONO` do `.env` |
| Operador | `operador@smartvagas.test` | `SEED_SENHA_OPERADOR` do `.env` |
| Motorista | crie em `/cadastro` | |

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Banco local + site em modo desenvolvimento |
| `npm test` | Testes das regras de negócio |
| `npm run typecheck` · `npm run lint` | Tipos e lint |
| `npm run db:migrate` | Aplica migrations em desenvolvimento |
| `npm run db:seed` | **Apaga tudo** e recria os dados de demonstração |
| `npm run build` | Build de produção |

## Estrutura

```
src/
  app/                 rotas: (painel) para dono e operador, (cliente) para o motorista
  features/<dominio>/  regras puras + testes, queries, actions e telas de cada domínio
                       (estadias, vagas, mensalistas, reservas, caixa, financeiro…)
  server/              banco, autenticação, sessão/permissões e auditoria
  lib/                 utilitários puros: tempo, dinheiro, placa, env
  components/          componentes de interface
prisma/                schema, migrations e seed
docs/                  especificação do MVP
```

O código de domínio é em português (`estadia`, `vaga`, `mensalista`), porque é o vocabulário do negócio.

## Status e próximos passos

- [x] **Fase 1:** pátio, mapa, mensalistas, caixa, financeiro, histórico, configurações
- [x] **Fase 2:** portal do motorista e reservas com proteção contra overbooking
- [ ] Pix automático via gateway (hoje o guichê confirma o pagamento da reserva)
- [ ] Testes end-to-end com Playwright
- [ ] Deploy em produção

A especificação completa, com todas as regras de negócio e o histórico de decisões, está em
[`docs/MVP_v1.1.md`](docs/MVP_v1.1.md).

---

<div align="center">
Feito por <a href="https://github.com/mateusnchaves">Mateus Chaves</a>
</div>
