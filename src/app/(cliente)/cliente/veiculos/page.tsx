import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { FormVeiculo, ItemVeiculo } from "@/features/veiculos/components/veiculos";
import { prisma } from "@/server/db";
import { exigirMotorista } from "@/server/sessao";

export const metadata: Metadata = { title: "Meus veículos" };

export default async function PaginaVeiculos() {
  const contexto = await exigirMotorista();
  const veiculos = await prisma.veiculo.findMany({
    where: { motoristaId: contexto.motoristaId },
    orderBy: { placa: "asc" },
    select: { id: true, placa: true, modelo: true },
  });

  return (
    <>
      <h1 className="text-xl font-bold">Meus veículos</h1>
      <FormVeiculo />
      <Card>
        {veiculos.length === 0 ? (
          <p className="py-4 text-center text-slate-500">Nenhum veículo cadastrado.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {veiculos.map((veiculo) => (
              <ItemVeiculo key={veiculo.id} {...veiculo} />
            ))}
          </ul>
        )}
      </Card>
      <p className="text-xs text-slate-500">
        A placa é usada só para identificar seu carro na entrada e na saída do estacionamento.
      </p>
    </>
  );
}
