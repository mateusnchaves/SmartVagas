import { Banknote, CreditCard, LogOut, QrCode, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { FormaPagamento } from "@/generated/prisma/enums";
import { formatarCentavos } from "@/lib/dinheiro";
import { formatarDuracao, formatarHora } from "@/lib/tempo";
import { darSaidaAction } from "../actions";
import type { ConsultaDentro } from "../consulta";
import { ROTULO_FORMA } from "../formas-pagamento";

type Props = {
  consulta: ConsultaDentro;
  fuso: string;
  aoConcluir: () => void;
};

const FORMAS: { forma: FormaPagamento; Icone: LucideIcon }[] = [
  { forma: "dinheiro", Icone: Banknote },
  { forma: "pix", Icone: QrCode },
  { forma: "cartao", Icone: CreditCard },
];

export function PainelSaida({ consulta, fuso, aoConcluir }: Props) {
  const { estadia, cobranca } = consulta;
  const [pendente, iniciar] = useTransition();
  const confirmarRef = useRef<HTMLButtonElement>(null);
  const gratis = cobranca.valorCentavos === 0;

  // Sem cobrança, Enter confirma. Com cobrança o operador escolhe a forma: sem padrão,
  // para o caixa não fechar errado por um Enter distraído.
  useEffect(() => confirmarRef.current?.focus(), []);

  function confirmar(formaPagamento?: FormaPagamento) {
    iniciar(async () => {
      const resultado = await darSaidaAction({ estadiaId: estadia.id, formaPagamento });
      if (!resultado.ok) {
        toast.error(resultado.erro.mensagem);
        return;
      }
      const { placa, valorCentavos, formaPagamento: forma } = resultado.dados;
      const valor = forma ? `${formatarCentavos(valorCentavos)} (${ROTULO_FORMA[forma]})` : "sem cobrança";
      toast.success(`Saída ${placa} · ${valor}`);
      aoConcluir();
    });
  }

  return (
    <Card className="space-y-4">
      <div>
        <p className="text-sm font-medium text-slate-500">Dar saída</p>
        <p className="text-3xl font-bold tracking-widest">{estadia.placa}</p>
        {estadia.modelo && <p className="text-sm text-slate-600">{estadia.modelo}</p>}
      </div>

      <dl className="grid grid-cols-3 gap-2 text-sm">
        <div>
          <dt className="text-slate-500">Vaga</dt>
          <dd className="font-semibold">{estadia.vaga}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Entrada</dt>
          <dd className="font-semibold">{formatarHora(new Date(estadia.entradaEm), fuso)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Tempo</dt>
          <dd className="font-semibold">{formatarDuracao(cobranca.minutosTotais)}</dd>
        </div>
      </dl>

      {cobranca.plano && (
        <p className="rounded-lg bg-slate-50 p-2 text-sm">
          Mensalista · {cobranca.plano}
          {cobranca.minutosCobrados > 0 &&
            ` · ${formatarDuracao(cobranca.minutosCobrados)} fora do plano`}
        </p>
      )}

      {cobranca.reserva && (
        <p className="rounded-lg bg-slate-50 p-2 text-sm">
          Reserva paga {cobranca.reserva}
          {cobranca.minutosCobrados > 0
            ? ` · ${formatarDuracao(cobranca.minutosCobrados)} além do horário reservado`
            : " · dentro do horário reservado"}
        </p>
      )}

      <p className="text-center text-5xl font-extrabold tabular-nums">
        {formatarCentavos(cobranca.valorCentavos)}
      </p>

      {gratis ? (
        <Button
          ref={confirmarRef}
          size="lg"
          className="w-full"
          disabled={pendente}
          onClick={() => confirmar()}
        >
          <LogOut aria-hidden />
          Confirmar saída
        </Button>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {FORMAS.map(({ forma, Icone }) => (
            <Button
              key={forma}
              size="lg"
              className="flex-col gap-0.5 px-2 text-base"
              disabled={pendente}
              onClick={() => confirmar(forma)}
            >
              <Icone aria-hidden />
              {ROTULO_FORMA[forma]}
            </Button>
          ))}
        </div>
      )}
    </Card>
  );
}
