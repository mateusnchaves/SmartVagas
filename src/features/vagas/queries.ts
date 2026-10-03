import type { Operacao } from "@/features/configuracao/queries";
import { planoValeNaEntrada, statusAssinatura } from "@/features/mensalistas/status-assinatura";
import type { TipoVaga } from "@/generated/prisma/enums";
import { dataParaDia } from "@/lib/tempo";
import { prisma } from "@/server/db";
import { statusDaVaga, type StatusVaga } from "./status-vaga";

export type VagaNoMapa = {
  id: string;
  numero: string;
  setor: string | null;
  tipo: TipoVaga;
  coberta: boolean;
  reservavel: boolean;
  status: StatusVaga;
  motivoBloqueio: string | null;
  estadia: { id: string; placa: string; entradaEm: string } | null;
  mensalistaFixo: string | null;
};

export async function listarVagasDoMapa(
  estacionamentoId: string,
  op: Operacao,
): Promise<VagaNoMapa[]> {
  const vagas = await prisma.vaga.findMany({
    where: { estacionamentoId },
    orderBy: { numero: "asc" },
    select: {
      id: true,
      numero: true,
      tipo: true,
      coberta: true,
      reservavel: true,
      ativa: true,
      motivoBloqueio: true,
      setor: { select: { nome: true } },
      estadias: {
        where: { saidaEm: null },
        select: { id: true, placa: true, entradaEm: true },
        take: 1,
      },
      assinaturasFixas: {
        where: { encerradaEm: null },
        select: { venceEm: true, motorista: { select: { nome: true } } },
      },
    },
  });

  return vagas.map((vaga) => {
    const estadia = vaga.estadias[0] ?? null;
    const fixoValendo = vaga.assinaturasFixas.find((assinatura) =>
      planoValeNaEntrada(
        statusAssinatura(dataParaDia(assinatura.venceEm), op.hoje, op.carenciaDias),
      ),
    );

    return {
      id: vaga.id,
      numero: vaga.numero,
      setor: vaga.setor?.nome ?? null,
      tipo: vaga.tipo,
      coberta: vaga.coberta,
      reservavel: vaga.reservavel,
      motivoBloqueio: vaga.motivoBloqueio,
      status: statusDaVaga({
        ativa: vaga.ativa,
        temEstadiaAberta: estadia !== null,
        temMensalistaFixoValendo: fixoValendo !== undefined,
      }),
      estadia: estadia && { ...estadia, entradaEm: estadia.entradaEm.toISOString() },
      mensalistaFixo: fixoValendo?.motorista.nome ?? null,
    };
  });
}
