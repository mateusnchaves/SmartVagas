import type { Metadata } from "next";
import { FormConfiguracao } from "@/features/configuracao/components/form-configuracao";
import { FormEstacionamento, GerenciarVagas, Operadores } from "@/features/configuracao/components/vagas-e-equipe";
import { prisma } from "@/server/db";
import { exigirEquipe } from "@/server/sessao";

export const metadata: Metadata = { title: "Configurações" };

export default async function PaginaConfiguracoes() {
  const { estacionamentoId } = await exigirEquipe(["dono"]);
  const [estacionamento, config, vagas, operadores] = await Promise.all([
    prisma.estacionamento.findUniqueOrThrow({ where: { id: estacionamentoId }, select: { nome: true, endereco: true, horario: true } }),
    prisma.configuracao.findUniqueOrThrow({ where: { estacionamentoId } }),
    prisma.vaga.findMany({
      where: { estacionamentoId },
      orderBy: { numero: "asc" },
      select: { id: true, numero: true, tipo: true, ativa: true, reservavel: true, motivoBloqueio: true, setor: { select: { nome: true } } },
    }),
    prisma.user.findMany({
      where: { estacionamentoId, papel: "operador" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
  ]);

  return (
    <div className="space-y-4">
      <FormEstacionamento {...estacionamento} />
      <FormConfiguracao v={config} />
      <GerenciarVagas vagas={vagas.map((v) => ({ ...v, setor: v.setor?.nome ?? null }))} />
      <Operadores operadores={operadores} />
    </div>
  );
}
