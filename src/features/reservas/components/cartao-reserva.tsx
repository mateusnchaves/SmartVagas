"use client";

import { Copy, X } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatarCentavos } from "@/lib/dinheiro";
import { formatarDataHora, formatarHora } from "@/lib/tempo";
import { cancelarMinhaReservaAction } from "../actions";
import { ROTULO_STATUS_RESERVA, type ReservaParaTela } from "../status-reserva";

type Props = {
  reserva: ReservaParaTela;
  fuso: string;
  chavePix: string | null;
  /** Calculado no servidor: cancelar agora devolve tudo? */
  cancelamentoGratis: boolean;
};

export function CartaoReserva({ reserva, fuso, chavePix, cancelamentoGratis }: Props) {
  const [pendente, iniciar] = useTransition();
  const { rotulo, variant } = ROTULO_STATUS_RESERVA[reserva.status];
  const cancelavel = reserva.status === "pendente" || reserva.status === "confirmada";
  const aguardando = reserva.status === "pendente";

  function cancelar() {
    const aviso =
      reserva.status === "confirmada" && !cancelamentoGratis
        ? "Fora do prazo de cancelamento grátis: parte do valor pago pode ficar retida. Cancelar mesmo assim?"
        : "Cancelar esta reserva?";
    if (!window.confirm(aviso)) return;

    iniciar(async () => {
      const resultado = await cancelarMinhaReservaAction(reserva.id);
      if (!resultado.ok) {
        toast.error(resultado.erro.mensagem);
        return;
      }
      const { paga, reembolsoCentavos } = resultado.dados;
      toast.success(
        paga && reembolsoCentavos > 0
          ? `Reserva cancelada. O estacionamento vai devolver ${formatarCentavos(reembolsoCentavos)}.`
          : "Reserva cancelada.",
      );
    });
  }

  async function copiarCodigo() {
    try {
      await navigator.clipboard.writeText(reserva.codigo);
      toast.success("Código copiado.");
    } catch {
      toast.error("Não foi possível copiar. Anote o código.");
    }
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm text-slate-500">
            {formatarDataHora(new Date(reserva.inicioEm), fuso)} →{" "}
            {formatarHora(new Date(reserva.fimEm), fuso)}
          </p>
          <p className="text-xl font-bold tracking-widest">{reserva.placa}</p>
        </div>
        <Badge variant={variant}>{rotulo}</Badge>
      </div>

      {reserva.status !== "expirada" && reserva.status !== "cancelada" && (
        <button
          type="button"
          onClick={copiarCodigo}
          aria-label={`Copiar código ${reserva.codigo}`}
          className="flex w-full items-center justify-between rounded-lg bg-slate-100 px-4 py-3 text-left hover:bg-slate-200"
        >
          <span>
            <span className="block text-xs font-medium text-slate-500">Código da reserva</span>
            <span className="text-3xl font-extrabold tracking-[0.25em]">{reserva.codigo}</span>
          </span>
          <Copy className="size-5 text-slate-500" aria-hidden />
        </button>
      )}

      <p className="text-sm text-slate-600">
        Vaga {reserva.vaga} · <strong>{formatarCentavos(reserva.valorCentavos)}</strong>
      </p>

      {aguardando && (
        <div className="space-y-1 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
          <p className="font-semibold">Pague para garantir a vaga até {formatarHora(new Date(reserva.expiraEm), fuso)}.</p>
          {chavePix ? (
            <p>
              Pix para <span className="font-mono font-semibold break-all">{chavePix}</span>, valor{" "}
              {formatarCentavos(reserva.valorCentavos)}. A confirmação é feita pelo estacionamento.
            </p>
          ) : (
            <p>Fale com o estacionamento para combinar o pagamento.</p>
          )}
        </div>
      )}

      {reserva.status === "cancelada" && reserva.reembolsoCentavos > 0 && (
        <p className="text-sm text-slate-600">
          Reembolso de {formatarCentavos(reserva.reembolsoCentavos)}:{" "}
          {reserva.reembolsada ? "já devolvido." : "aguardando devolução pelo estacionamento."}
        </p>
      )}

      {cancelavel && (
        <Button variant="secondary" className="w-full" disabled={pendente} onClick={cancelar}>
          <X aria-hidden />
          Cancelar reserva
        </Button>
      )}
    </Card>
  );
}
