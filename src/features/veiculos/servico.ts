import { z } from "zod";
import { placaSchema } from "@/lib/placa";
import { ErroDeNegocio } from "@/lib/resultado";
import { prisma } from "@/server/db";
import type { ContextoMotorista } from "@/server/sessao";

export const veiculoSchema = z.object({
  placa: placaSchema,
  modelo: z.string().trim().max(40, "Modelo muito longo.").optional(),
});

export async function adicionarVeiculo(
  contexto: ContextoMotorista,
  entrada: z.input<typeof veiculoSchema>,
) {
  const { placa, modelo } = veiculoSchema.parse(entrada);
  const existente = await prisma.veiculo.findFirst({
    where: { motoristaId: contexto.motoristaId, placa },
    select: { id: true },
  });
  if (existente) throw new ErroDeNegocio("veiculo_duplicado", "Essa placa já está na sua conta.");

  await prisma.veiculo.create({
    data: { motoristaId: contexto.motoristaId, placa, modelo: modelo || null },
  });
  return { placa };
}

export async function removerVeiculo(contexto: ContextoMotorista, veiculoId: string) {
  const veiculo = await prisma.veiculo.findFirst({
    where: { id: veiculoId, motoristaId: contexto.motoristaId },
    select: { placa: true },
  });
  if (!veiculo) throw new ErroDeNegocio("veiculo_inexistente", "Veículo não encontrado.");

  const reservaAtiva = await prisma.reserva.count({
    where: {
      motoristaId: contexto.motoristaId,
      placa: veiculo.placa,
      status: { in: ["pendente", "confirmada", "em_uso"] },
    },
  });
  if (reservaAtiva > 0) {
    throw new ErroDeNegocio("veiculo_em_reserva", "Esse veículo tem uma reserva em andamento.");
  }
  await prisma.veiculo.delete({ where: { id: veiculoId } });
}
