import { z } from "zod";
import { obterOperacao } from "@/features/configuracao/queries";
import { buscarMensalistaPorPlaca, paraPlanoAplicado } from "@/features/mensalistas/queries";
import { planoValeNaEntrada, statusAssinatura } from "@/features/mensalistas/status-assinatura";
import { placaSchema } from "@/lib/placa";
import { ErroDeNegocio } from "@/lib/resultado";
import { dataParaDia } from "@/lib/tempo";
import { registrarAuditoria } from "@/server/auditoria";
import { prisma } from "@/server/db";
import type { Contexto } from "@/server/sessao";
import { calcularCobranca } from "./cobranca";

export const entradaSchema = z.object({
  placa: placaSchema,
  vagaId: z.uuid("Escolha uma vaga."),
  modelo: z.string().trim().max(40, "Modelo muito longo.").optional(),
});

export const saidaSchema = z.object({
  estadiaId: z.uuid(),
  formaPagamento: z.enum(["dinheiro", "pix", "cartao"]).optional(),
});

const MENSAGEM_STATUS = {
  em_dia: null,
  atrasada: "Mensalidade atrasada: avise o cliente.",
  suspensa: "Mensalidade suspensa: entra como avulso.",
} as const;

export async function darEntrada(contexto: Contexto, entrada: z.input<typeof entradaSchema>) {
  const { placa, vagaId, modelo } = entradaSchema.parse(entrada);
  const { estacionamentoId } = contexto;
  const op = await obterOperacao(estacionamentoId);
  const mensalista = await buscarMensalistaPorPlaca(estacionamentoId, placa, op);
  const assinaturaId =
    mensalista && planoValeNaEntrada(mensalista.status) ? mensalista.assinaturaId : null;

  return prisma.$transaction(async (tx) => {
    const vaga = await tx.vaga.findFirst({
      where: { id: vagaId, estacionamentoId },
      select: {
        numero: true,
        ativa: true,
        motivoBloqueio: true,
        estadias: { where: { saidaEm: null }, select: { placa: true }, take: 1 },
        assinaturasFixas: {
          where: { encerradaEm: null },
          select: { id: true, venceEm: true, motorista: { select: { nome: true } } },
        },
      },
    });
    if (!vaga) throw new ErroDeNegocio("vaga_inexistente", "Vaga não encontrada.");
    if (!vaga.ativa) {
      const motivo = vaga.motivoBloqueio ? `: ${vaga.motivoBloqueio}` : "";
      throw new ErroDeNegocio("vaga_bloqueada", `Vaga ${vaga.numero} bloqueada${motivo}.`);
    }
    const ocupante = vaga.estadias[0];
    if (ocupante) {
      throw new ErroDeNegocio("vaga_ocupada", `Vaga ${vaga.numero} já está com ${ocupante.placa}.`);
    }
    // RN-04: vaga fixa é exclusiva do mensalista enquanto o plano dele vale.
    const donoDaVaga = vaga.assinaturasFixas.find(
      (assinatura) =>
        assinatura.id !== assinaturaId &&
        planoValeNaEntrada(
          statusAssinatura(dataParaDia(assinatura.venceEm), op.hoje, op.carenciaDias),
        ),
    );
    if (donoDaVaga) {
      throw new ErroDeNegocio(
        "vaga_de_mensalista",
        `Vaga ${vaga.numero} é fixa de ${donoDaVaga.motorista.nome}.`,
      );
    }
    const jaDentro = await tx.estadia.findFirst({
      where: { estacionamentoId, placa, saidaEm: null },
      select: { vaga: { select: { numero: true } } },
    });
    if (jaDentro) {
      throw new ErroDeNegocio("placa_dentro", `${placa} já está dentro, na vaga ${jaDentro.vaga.numero}.`);
    }

    const estadia = await tx.estadia.create({
      data: {
        estacionamentoId,
        vagaId,
        placa,
        modelo: modelo || null,
        entradaEm: op.agora,
        assinaturaId,
        entradaPorId: contexto.usuarioId,
      },
      select: { id: true },
    });
    await registrarAuditoria(tx, contexto, {
      acao: "estadia.entrada",
      entidade: "estadia",
      entidadeId: estadia.id,
      dados: { placa, vaga: vaga.numero, mensalista: mensalista?.nome ?? null },
    });

    return {
      placa,
      vaga: vaga.numero,
      alerta: mensalista ? MENSAGEM_STATUS[mensalista.status] : null,
    };
  });
}

export async function darSaida(contexto: Contexto, entrada: z.input<typeof saidaSchema>) {
  const { estadiaId, formaPagamento } = saidaSchema.parse(entrada);
  const { estacionamentoId } = contexto;
  const op = await obterOperacao(estacionamentoId);

  return prisma.$transaction(async (tx) => {
    const estadia = await tx.estadia.findFirst({
      where: { id: estadiaId, estacionamentoId, saidaEm: null },
      select: {
        placa: true,
        entradaEm: true,
        vaga: { select: { numero: true } },
        assinatura: {
          select: {
            plano: { select: { nome: true, diasSemana: true, inicioMin: true, fimMin: true } },
          },
        },
      },
    });
    if (!estadia) throw new ErroDeNegocio("estadia_inexistente", "Esse carro já saiu.");

    // O valor é sempre recalculado aqui; o que o front mostrou é só prévia.
    const plano = estadia.assinatura ? paraPlanoAplicado(estadia.assinatura.plano) : null;
    const cobranca = calcularCobranca(estadia.entradaEm, op.agora, op.tabela, op.fuso, plano);
    const cobrar = cobranca.valorCentavos > 0;
    if (cobrar && !formaPagamento) {
      throw new ErroDeNegocio("forma_pagamento", "Escolha a forma de pagamento.");
    }

    const turno = await tx.turno.findFirst({
      where: { operadorId: contexto.usuarioId, fechadoEm: null },
      select: { id: true },
    });
    // Condição saidaEm = null evita saída dupla quando dois operadores clicam juntos.
    const { count } = await tx.estadia.updateMany({
      where: { id: estadiaId, saidaEm: null },
      data: {
        saidaEm: op.agora,
        valorCentavos: cobranca.valorCentavos,
        formaPagamento: cobrar ? formaPagamento : null,
        turnoId: turno?.id ?? null,
        saidaPorId: contexto.usuarioId,
      },
    });
    if (count === 0) throw new ErroDeNegocio("estadia_inexistente", "Esse carro acabou de sair.");

    await registrarAuditoria(tx, contexto, {
      acao: "estadia.saida",
      entidade: "estadia",
      entidadeId: estadiaId,
      dados: { placa: estadia.placa, valorCentavos: cobranca.valorCentavos, formaPagamento },
    });

    return {
      placa: estadia.placa,
      vaga: estadia.vaga.numero,
      valorCentavos: cobranca.valorCentavos,
      formaPagamento: cobrar ? (formaPagamento ?? null) : null,
    };
  });
}
