import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { obterOperacao } from "@/features/configuracao/queries";
import { FormReserva } from "@/features/reservas/components/form-reserva";
import { paraHorarioLocal } from "@/lib/tempo";
import { prisma } from "@/server/db";
import { exigirMotorista } from "@/server/sessao";

export const metadata: Metadata = { title: "Reservar vaga" };

const HORA_MS = 3_600_000;

export default async function PaginaReservar() {
  const contexto = await exigirMotorista();
  const op = await obterOperacao(contexto.estacionamentoId);
  const veiculos = await prisma.veiculo.findMany({
    where: { motoristaId: contexto.motoristaId },
    orderBy: { placa: "asc" },
    select: { placa: true, modelo: true },
  });

  if (veiculos.length === 0) {
    return (
      <Card className="space-y-3 py-6 text-center">
        <p>Cadastre um veículo antes de reservar.</p>
        <Link href="/cliente/veiculos" className={buttonVariants()}>
          Adicionar veículo
        </Link>
      </Card>
    );
  }

  // Sugestão: começa na antecedência mínima, arredondada para a próxima meia hora, e dura 2 h.
  const meiaHoraMs = HORA_MS / 2;
  const base = op.agora.getTime() + op.reservas.antecedenciaMinMin * 60_000;
  const inicio = new Date(Math.ceil(base / meiaHoraMs) * meiaHoraMs);
  const fim = new Date(inicio.getTime() + 2 * HORA_MS);

  return (
    <FormReserva
      veiculos={veiculos}
      inicioPadrao={paraHorarioLocal(inicio, op.fuso)}
      fimPadrao={paraHorarioLocal(fim, op.fuso)}
      duracaoMaxH={op.reservas.duracaoMaxH}
      antecedenciaMaxDias={op.reservas.antecedenciaMaxDias}
    />
  );
}
