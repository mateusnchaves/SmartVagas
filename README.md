# Smart Vagas

Gestão simples de estacionamento para o dono: quem está no pátio, quanto entrou hoje,
quem está com a mensalidade atrasada e se o mês deu lucro depois de salários e contas.

- **Pátio:** um campo de placa decide entre entrada e saída, pensado para menos de 15 segundos no pico.
- **Mapa de vagas** em tempo quase real, com status por cor, ícone e texto.
- **Mensalistas** com planos por dia e horário e controle de inadimplência.
- **Financeiro:** equipe, custos e lucro do mês, com caixa por turno.
- **Fase 2:** o dono libera algumas vagas para reserva online, paga antecipadamente por Pix.

Stack: Next.js 16, Prisma 7, Postgres, Better Auth e Tailwind v4.
Especificação completa em [docs/MVP_v1.1.md](docs/MVP_v1.1.md).
