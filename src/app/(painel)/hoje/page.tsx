import type { Metadata } from "next";
import Link from "next/link";
import { AtualizacaoAutomatica } from "@/components/atualizacao-automatica";
import { Indicador } from "@/components/indicador";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { obterOperacao } from "@/features/configuracao/queries";
import { ROTULO_FORMA } from "@/features/estadias/formas-pagamento";
import { resumoDoDia } from "@/features/painel/queries";
import type { FormaPagamento } from "@/generated/prisma/enums";
import { formatarCentavos } from "@/lib/dinheiro";
import { formatarDia, formatarDuracao } from "@/lib/tempo";
import { ehDono, exigirEquipe } from "@/server/sessao";

export const metadata: Metadata = { title: "Hoje" };

const FORMAS: FormaPagamento[] = ["dinheiro", "pix", "cartao"];

export default async function PaginaHoje() {
  const contexto = await exigirEquipe();
  const op = await obterOperacao(contexto.estacionamentoId);
  const resumo = await resumoDoDia(contexto.estacionamentoId, op);
  const { vagas, receitaAvulsa } = resumo;

  return (
    <div className="space-y-4">
      <AtualizacaoAutomatica />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Indicador
          rotulo="Vagas livres agora"
          valor={vagas.livres}
          detalhe={`${vagas.ocupadas} ocupadas · ${vagas.reservadas} reservadas de ${vagas.ativas}`}
        />
        <Indicador rotulo="Entradas hoje" valor={resumo.entradas} />
        <Indicador rotulo="Saídas hoje" valor={resumo.saidas} />
        {/* Operador não vê dinheiro consolidado (docs/MVP_v1.1.md §8). */}
        {ehDono(contexto) && (
          <Indicador
            rotulo="Receita avulsa hoje"
            valor={formatarCentavos(receitaAvulsa.totalCentavos)}
            detalhe={FORMAS.map(
              (forma) => `${ROTULO_FORMA[forma]} ${formatarCentavos(receitaAvulsa.porForma[forma])}`,
            ).join(" · ")}
          />
        )}
      </div>

      {ehDono(contexto) && resumo.mensalidadesCentavos > 0 && (
        <p className="text-sm text-slate-600">
          Mensalidades recebidas hoje: <strong>{formatarCentavos(resumo.mensalidadesCentavos)}</strong>
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Permanência acima de {op.alertaPermanenciaMin / 60}h</CardTitle>
          {resumo.permanenciaLonga.length === 0 ? (
            <p className="py-4 text-sm text-slate-500">Nenhum carro.</p>
          ) : (
            <ul className="mt-2 divide-y divide-slate-100">
              {resumo.permanenciaLonga.map((carro) => (
                <li key={carro.id} className="flex items-center justify-between py-2">
                  <Link href={`/patio?estadia=${carro.id}`} className="font-bold tracking-wider text-primaria">
                    {carro.placa}
                  </Link>
                  <span className="text-sm text-slate-600">
                    Vaga {carro.vaga} · {formatarDuracao(carro.minutos)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardTitle>Mensalistas com pendência</CardTitle>
          {resumo.mensalistasPendentes.length === 0 ? (
            <p className="py-4 text-sm text-slate-500">Todos em dia.</p>
          ) : (
            <ul className="mt-2 divide-y divide-slate-100">
              {resumo.mensalistasPendentes.map((mensalista) => (
                <li key={mensalista.assinaturaId} className="flex items-center justify-between gap-2 py-2">
                  <span>
                    <span className="font-semibold">{mensalista.nome}</span>
                    <span className="text-sm text-slate-500"> · {mensalista.plano.nome}</span>
                  </span>
                  <Badge variant={mensalista.status === "suspensa" ? "danger" : "warning"}>
                    {mensalista.status === "suspensa" ? "Suspensa" : "Atrasada"} · venceu{" "}
                    {formatarDia(mensalista.venceEm)}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
