import { Car } from "lucide-react";
import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { Vazio } from "@/components/vazio";
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
          <Vazio Icone={Car} titulo="Nenhum veículo cadastrado" dica="Adicione a placa do seu carro para poder reservar." />
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
