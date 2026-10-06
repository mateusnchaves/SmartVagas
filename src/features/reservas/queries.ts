import type { Operacao } from "@/features/configuracao/queries";
import { prisma } from "@/server/db";
import { expirarPendentes } from "./servico";

const selecao = {
  id: true,
  codigo: true,
  placa: true,
  status: true,
  inicioEm: true,
  fimEm: true,
  valorCentavos: true,
  expiraEm: true,
  reembolsoCentavos: true,
  reembolsadaEm: true,
  vaga: { select: { numero: true, tipo: true } },
  motorista: { select: { nome: true } },
} as const;

export async function listarReservasDoMotorista(motoristaId: string, estacionamentoId: string, op: Operacao) {
  await expirarPendentes(prisma, estacionamentoId, op.agora);
  return prisma.reserva.findMany({
    where: { motoristaId },
    orderBy: { inicioEm: "desc" },
    take: 30,
    select: selecao,
  });
}

/** Tela do guichê: o que exige ação (pagamento a confirmar, reembolso a fazer) e o que vem aí. */
export async function listarReservasDoGuiche(estacionamentoId: string, op: Operacao) {
  await expirarPendentes(prisma, estacionamentoId, op.agora);

  const [aguardando, proximas, reembolsos] = await Promise.all([
    prisma.reserva.findMany({
      where: { estacionamentoId, status: "pendente" },
      orderBy: { expiraEm: "asc" },
      select: selecao,
    }),
    prisma.reserva.findMany({
      where: { estacionamentoId, status: { in: ["confirmada", "em_uso"] }, fimEm: { gt: op.agora } },
      orderBy: { inicioEm: "asc" },
      select: selecao,
    }),
    prisma.reserva.findMany({
      where: { estacionamentoId, status: "cancelada", reembolsoCentavos: { gt: 0 }, reembolsadaEm: null },
      orderBy: { canceladaEm: "asc" },
      select: selecao,
    }),
  ]);
  return { aguardando, proximas, reembolsos };
}

export type ReservaListada = Awaited<ReturnType<typeof listarReservasDoMotorista>>[number];
