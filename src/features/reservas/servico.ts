import { z } from "zod";
import { obterOperacao, type Operacao } from "@/features/configuracao/queries";
import { calcularValorEstadia } from "@/features/estadias/preco";
import type { Prisma } from "@/generated/prisma/client";
import { placaSchema } from "@/lib/placa";
import { ErroDeNegocio } from "@/lib/resultado";
import { lerHorarioLocal, minutosEntre } from "@/lib/tempo";
import { registrarAuditoria } from "@/server/auditoria";
import { prisma, type Transacao } from "@/server/db";
import type { Contexto, ContextoMotorista } from "@/server/sessao";
import { calcularCancelamento, gerarCodigo, validarJanela } from "./regras";

const TIPOS = ["comum", "pcd", "idoso", "moto", "eletrica"] as const;

export const periodoSchema = z.object({
  inicio: z.string().min(1, "Informe o início."),
  fim: z.string().min(1, "Informe o fim."),
  tipo: z.enum(TIPOS).default("comum"),
});

export const reservaSchema = periodoSchema.extend({ placa: placaSchema });

type Cliente = typeof prisma | Transacao;

/** Pendente vencida vira expirada na leitura: libera a vaga sem cron. */
export async function expirarPendentes(db: Cliente, estacionamentoId: string, agora: Date) {
  await db.reserva.updateMany({
    where: { estacionamentoId, status: "pendente", expiraEm: { lt: agora } },
    data: { status: "expirada" },
  });
}

/** Reserva que ainda segura a vaga: confirmada, em uso, ou pendente dentro do prazo do Pix. */
export function reservaAtiva(agora: Date): Prisma.ReservaWhereInput {
  return {
    OR: [
      { status: { in: ["confirmada", "em_uso"] } },
      { status: "pendente", expiraEm: { gt: agora } },
    ],
  };
}

function lerPeriodo(entrada: z.input<typeof periodoSchema>, op: Operacao) {
  const dados = periodoSchema.parse(entrada);
  const inicio = lerHorarioLocal(dados.inicio, op.fuso);
  const fim = lerHorarioLocal(dados.fim, op.fuso);
  if (!inicio || !fim) throw new ErroDeNegocio("periodo_invalido", "Data ou hora inválida.");
  const erro = validarJanela(inicio, fim, op.agora, op.reservas);
  if (erro) throw new ErroDeNegocio("periodo_invalido", erro);
  return { inicio, fim, tipo: dados.tipo };
}

/** RN-07: só vaga ativa e reservável, sem dono fixo, sem reserva sobreposta e sem carro dentro. */
async function vagasLivres(
  db: Cliente,
  estacionamentoId: string,
  inicio: Date,
  fim: Date,
  tipo: (typeof TIPOS)[number] | undefined,
  op: Operacao,
) {
  // Carro avulso dentro não tem hora de saída: perto de agora, a vaga dele não é prometida (RN-10).
  const avulsoPodeEstarDentro =
    inicio.getTime() < op.agora.getTime() + op.reservas.bloqueioAvulsoH * 3_600_000;

  return db.vaga.findMany({
    where: {
      estacionamentoId,
      ativa: true,
      reservavel: true,
      ...(tipo && { tipo }),
      assinaturasFixas: { none: { encerradaEm: null } },
      reservas: {
        none: { inicioEm: { lt: fim }, fimEm: { gt: inicio }, ...reservaAtiva(op.agora) },
      },
      ...(avulsoPodeEstarDentro && { estadias: { none: { saidaEm: null } } }),
    },
    orderBy: { numero: "asc" },
    select: { id: true, numero: true, tipo: true },
  });
}

export type Disponibilidade = { tipo: string; disponiveis: number; valorCentavos: number };

export async function buscarDisponibilidade(
  contexto: ContextoMotorista,
  entrada: z.input<typeof periodoSchema>,
): Promise<Disponibilidade[]> {
  const op = await obterOperacao(contexto.estacionamentoId);
  const { inicio, fim } = lerPeriodo(entrada, op);
  await expirarPendentes(prisma, contexto.estacionamentoId, op.agora);

  const vagas = await vagasLivres(prisma, contexto.estacionamentoId, inicio, fim, undefined, op);
  const valorCentavos = calcularValorEstadia(minutosEntre(inicio, fim), op.tabela);
  const contagem = new Map<string, number>();
  for (const vaga of vagas) contagem.set(vaga.tipo, (contagem.get(vaga.tipo) ?? 0) + 1);

  return [...contagem].map(([tipo, disponiveis]) => ({ tipo, disponiveis, valorCentavos }));
}

export async function criarReserva(
  contexto: ContextoMotorista,
  entrada: z.input<typeof reservaSchema>,
) {
  const { placa, ...periodo } = reservaSchema.parse(entrada);
  const { estacionamentoId, motoristaId } = contexto;
  const op = await obterOperacao(estacionamentoId);
  const { inicio, fim, tipo } = lerPeriodo(periodo, op);

  const veiculo = await prisma.veiculo.findFirst({
    where: { motoristaId, placa },
    select: { id: true },
  });
  if (!veiculo) throw new ErroDeNegocio("veiculo_invalido", "Esse veículo não está na sua conta.");

  await expirarPendentes(prisma, estacionamentoId, op.agora);
  const pendente = await prisma.reserva.findFirst({
    where: { motoristaId, status: "pendente" },
    select: { codigo: true },
  });
  if (pendente) {
    throw new ErroDeNegocio(
      "pendente_existente",
      `Você já tem a reserva ${pendente.codigo} aguardando pagamento. Pague ou cancele antes de reservar outra.`,
    );
  }

  const valorCentavos = calcularValorEstadia(minutosEntre(inicio, fim), op.tabela);
  const expiraEm = new Date(op.agora.getTime() + op.reservas.expiracaoPendenteMin * 60_000);

  return prisma.$transaction(async (tx) => {
    const candidatas = await vagasLivres(tx, estacionamentoId, inicio, fim, tipo, op);
    for (const vaga of candidatas) {
      // Lock na vaga: duas reservas simultâneas na mesma vaga se enfileiram aqui (RF-14).
      await tx.$queryRaw`SELECT id FROM vagas WHERE id = ${vaga.id}::uuid FOR UPDATE`;
      const choque = await tx.reserva.count({
        where: {
          vagaId: vaga.id,
          inicioEm: { lt: fim },
          fimEm: { gt: inicio },
          ...reservaAtiva(op.agora),
        },
      });
      if (choque > 0) continue;

      const reserva = await tx.reserva.create({
        data: {
          estacionamentoId,
          vagaId: vaga.id,
          motoristaId,
          placa,
          codigo: gerarCodigo(),
          inicioEm: inicio,
          fimEm: fim,
          valorCentavos,
          expiraEm,
        },
        select: { id: true, codigo: true },
      });
      await registrarAuditoria(tx, contexto, {
        acao: "reserva.criada",
        entidade: "reserva",
        entidadeId: reserva.id,
        dados: { vaga: vaga.numero, placa, valorCentavos },
      });
      return reserva;
    }
    throw new ErroDeNegocio(
      "sem_vaga",
      "Acabaram as vagas desse tipo nesse horário. Tente outro horário.",
    );
  });
}

export async function confirmarPagamento(contexto: Contexto, reservaId: string) {
  const agora = new Date();
  return prisma.$transaction(async (tx) => {
    const reserva = await tx.reserva.findFirst({
      where: { id: reservaId, estacionamentoId: contexto.estacionamentoId },
      select: { status: true, expiraEm: true, codigo: true, valorCentavos: true },
    });
    if (!reserva) throw new ErroDeNegocio("reserva_inexistente", "Reserva não encontrada.");
    if (reserva.status !== "pendente") {
      throw new ErroDeNegocio("status_invalido", "Essa reserva não está aguardando pagamento.");
    }
    // Pendente vencida pode ter perdido a vaga para outro motorista: não dá para confirmar.
    if (reserva.expiraEm < agora) {
      await tx.reserva.update({ where: { id: reservaId }, data: { status: "expirada" } });
      throw new ErroDeNegocio(
        "reserva_expirada",
        "Essa reserva expirou. O motorista precisa reservar de novo.",
      );
    }
    await tx.reserva.update({
      where: { id: reservaId },
      data: { status: "confirmada", pagaEm: agora, confirmadaPorId: contexto.usuarioId },
    });
    await registrarAuditoria(tx, contexto, {
      acao: "reserva.pagamento_confirmado",
      entidade: "reserva",
      entidadeId: reservaId,
      dados: { codigo: reserva.codigo, valorCentavos: reserva.valorCentavos },
    });
    return { codigo: reserva.codigo };
  });
}

/** Cancela como motorista (só a própria reserva) ou como equipe (qualquer uma do estacionamento). */
export async function cancelarReserva(contexto: Contexto | ContextoMotorista, reservaId: string) {
  const op = await obterOperacao(contexto.estacionamentoId);
  const donoDaReserva = "motoristaId" in contexto ? { motoristaId: contexto.motoristaId } : {};

  return prisma.$transaction(async (tx) => {
    const reserva = await tx.reserva.findFirst({
      where: { id: reservaId, estacionamentoId: contexto.estacionamentoId, ...donoDaReserva },
      select: { status: true, inicioEm: true, valorCentavos: true, codigo: true },
    });
    if (!reserva) throw new ErroDeNegocio("reserva_inexistente", "Reserva não encontrada.");
    if (reserva.status !== "pendente" && reserva.status !== "confirmada") {
      throw new ErroDeNegocio("status_invalido", "Essa reserva não pode mais ser cancelada.");
    }

    const paga = reserva.status === "confirmada";
    const cancelamento = calcularCancelamento(
      paga,
      reserva.valorCentavos,
      reserva.inicioEm,
      op.agora,
      op.reservas,
    );
    await tx.reserva.update({
      where: { id: reservaId },
      data: {
        status: "cancelada",
        canceladaEm: op.agora,
        reembolsoCentavos: cancelamento.reembolsoCentavos,
      },
    });
    await registrarAuditoria(tx, contexto, {
      acao: "reserva.cancelada",
      entidade: "reserva",
      entidadeId: reservaId,
      dados: { codigo: reserva.codigo, paga, ...cancelamento },
    });
    return { codigo: reserva.codigo, paga, ...cancelamento };
  });
}

export async function marcarReembolsada(contexto: Contexto, reservaId: string) {
  return prisma.$transaction(async (tx) => {
    const { count } = await tx.reserva.updateMany({
      where: {
        id: reservaId,
        estacionamentoId: contexto.estacionamentoId,
        status: "cancelada",
        reembolsoCentavos: { gt: 0 },
        reembolsadaEm: null,
      },
      data: { reembolsadaEm: new Date() },
    });
    if (count === 0) {
      throw new ErroDeNegocio("sem_reembolso", "Não há reembolso pendente nessa reserva.");
    }
    await registrarAuditoria(tx, contexto, {
      acao: "reserva.reembolsada",
      entidade: "reserva",
      entidadeId: reservaId,
    });
  });
}
