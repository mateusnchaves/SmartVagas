import { TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AtualizacaoAutomatica } from "@/components/atualizacao-automatica";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { obterOperacao } from "@/features/configuracao/queries";
import { listarDentro } from "@/features/estadias/queries";
import { formatarCentavos } from "@/lib/dinheiro";
import { formatarDataHora, formatarDuracao } from "@/lib/tempo";
import { exigirEquipe } from "@/server/sessao";

export const metadata: Metadata = { title: "Quem está dentro" };

export default async function PaginaDentro() {
  const contexto = await exigirEquipe();
  const op = await obterOperacao(contexto.estacionamentoId);
  const carros = await listarDentro(contexto.estacionamentoId, op);

  return (
    <Card>
      <AtualizacaoAutomatica />
      <CardTitle>Quem está dentro ({carros.length})</CardTitle>
      <p className="text-sm text-slate-500">Mais antigos primeiro. Valor = quanto pagaria saindo agora.</p>

      {carros.length === 0 ? (
        <p className="py-8 text-center text-slate-500">Pátio vazio.</p>
      ) : (
        <ul className="mt-2 divide-y divide-slate-100">
          {carros.map((carro) => (
            <li key={carro.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-bold tracking-wider">
                  {carro.placa}
                  {carro.modelo && (
                    <span className="ml-2 font-normal tracking-normal text-slate-500">{carro.modelo}</span>
                  )}
                </p>
                <p className="text-sm text-slate-600">
                  Vaga {carro.vaga} · entrou {formatarDataHora(carro.entradaEm, op.fuso)} ·{" "}
                  {formatarDuracao(carro.minutos)}
                </p>
              </div>
              {carro.alerta && (
                <Badge variant="danger">
                  <TriangleAlert aria-hidden />
                  Permanência longa
                </Badge>
              )}
              {carro.plano && <Badge>Mensalista · {carro.plano}</Badge>}
              <span className="w-20 text-right font-semibold tabular-nums">
                {formatarCentavos(carro.valorCentavos)}
              </span>
              <Link
                href={`/patio?estadia=${carro.id}`}
                className={buttonVariants({ variant: "secondary" })}
              >
                Dar saída
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
