import type { Metadata } from "next";
import { AtualizacaoAutomatica } from "@/components/atualizacao-automatica";
import { obterOperacao } from "@/features/configuracao/queries";
import { Patio } from "@/features/estadias/components/patio";
import { listarVagasDoMapa } from "@/features/vagas/queries";
import { exigirEquipe } from "@/server/sessao";

export const metadata: Metadata = { title: "Pátio" };

export default async function PaginaPatio({ searchParams }: PageProps<"/patio">) {
  const contexto = await exigirEquipe();
  const op = await obterOperacao(contexto.estacionamentoId);
  const vagas = await listarVagasDoMapa(contexto.estacionamentoId, op);
  const { estadia } = await searchParams;

  return (
    <>
      <AtualizacaoAutomatica />
      <Patio
        vagas={vagas}
        agora={op.agora.toISOString()}
        fuso={op.fuso}
        estadiaInicialId={typeof estadia === "string" ? estadia : undefined}
      />
    </>
  );
}
