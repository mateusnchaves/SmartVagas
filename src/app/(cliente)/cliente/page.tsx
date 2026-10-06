import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { obterOperacao } from "@/features/configuracao/queries";
import { statusAssinatura } from "@/features/mensalistas/status-assinatura";
import { CartaoReserva } from "@/features/reservas/components/cartao-reserva";
import { listarReservasDoMotorista } from "@/features/reservas/queries";
import { calcularCancelamento } from "@/features/reservas/regras";
import { paraTela } from "@/features/reservas/status-reserva";
import { dataParaDia, formatarDia } from "@/lib/tempo";
import { prisma } from "@/server/db";
import { exigirMotorista } from "@/server/sessao";

export const metadata: Metadata = { title: "Minhas reservas" };

const EM_ANDAMENTO = ["pendente", "confirmada", "em_uso"];

export default async function PaginaCliente() {
  const contexto = await exigirMotorista();
  const op = await obterOperacao(contexto.estacionamentoId);
  const [reservas, assinatura] = await Promise.all([
    listarReservasDoMotorista(contexto.motoristaId, contexto.estacionamentoId, op),
    prisma.assinatura.findFirst({
      where: { motoristaId: contexto.motoristaId, encerradaEm: null },
      orderBy: { venceEm: "desc" },
      select: { venceEm: true, plano: { select: { nome: true } } },
    }),
  ]);

  const ativas = reservas.filter((reserva) => EM_ANDAMENTO.includes(reserva.status));
  const historico = reservas.filter((reserva) => !EM_ANDAMENTO.includes(reserva.status));
  const venceEm = assinatura ? dataParaDia(assinatura.venceEm) : null;
  const statusPlano = venceEm ? statusAssinatura(venceEm, op.hoje, op.carenciaDias) : null;

  function cartao(reserva: (typeof reservas)[number]) {
    const gratis = calcularCancelamento(
      reserva.status === "confirmada",
      reserva.valorCentavos,
      reserva.inicioEm,
      op.agora,
      op.reservas,
    ).noPrazo;
    return (
      <CartaoReserva
        key={reserva.id}
        reserva={paraTela(reserva)}
        fuso={op.fuso}
        chavePix={op.reservas.chavePix}
        cancelamentoGratis={gratis}
      />
    );
  }

  return (
    <>
      {assinatura && venceEm && statusPlano && (
        <Card className="flex items-center justify-between gap-2">
          <div>
            <CardTitle>Plano mensal: {assinatura.plano.nome}</CardTitle>
            <p className="text-sm text-slate-600">
              {statusPlano === "em_dia" ? "Vence" : "Venceu"} em {formatarDia(venceEm)}
            </p>
          </div>
          <Badge variant={statusPlano === "em_dia" ? "success" : statusPlano === "atrasada" ? "warning" : "danger"}>
            {statusPlano === "em_dia" ? "Em dia" : statusPlano === "atrasada" ? "Atrasado" : "Suspenso"}
          </Badge>
        </Card>
      )}

      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold">Minhas reservas</h1>
        <Link href="/cliente/reservar" className={buttonVariants()}>
          Reservar vaga
        </Link>
      </div>

      {ativas.length === 0 ? (
        <Card className="py-8 text-center text-slate-500">
          Você não tem reservas em andamento.
        </Card>
      ) : (
        ativas.map(cartao)
      )}

      {historico.length > 0 && (
        <section className="space-y-3">
          <h2 className="pt-2 text-sm font-semibold text-slate-600">Histórico</h2>
          {historico.map(cartao)}
        </section>
      )}
    </>
  );
}
