import { Accessibility, Bike, Car, Check, Clock, Lock, Zap, type LucideIcon } from "lucide-react";
import type { TipoVaga } from "@/generated/prisma/enums";
import { formatarDuracao, minutosEntre } from "@/lib/tempo";
import { cn } from "@/lib/utils";
import type { VagaNoMapa } from "../queries";
import type { StatusVaga } from "../status-vaga";

// Cor nunca sozinha: todo status tem ícone e texto (daltonismo, sol no pátio).
// Livre é claro de propósito: o que o operador procura são as vagas ocupadas e as reservadas.
export const ESTILO_STATUS: Record<
  StatusVaga,
  { classe: string; iconeClasse: string; Icone: LucideIcon; rotulo: string }
> = {
  livre: {
    classe: "bg-green-50 text-green-900 ring-1 ring-inset ring-green-600/35 hover:bg-green-100",
    iconeClasse: "text-livre",
    Icone: Check,
    rotulo: "Livre",
  },
  ocupada: {
    classe: "bg-gradient-to-b from-slate-600 to-ocupada text-white shadow-sm",
    iconeClasse: "text-slate-200",
    Icone: Car,
    rotulo: "Ocupada",
  },
  reservada: {
    classe:
      "bg-amber-100 text-reservada-texto ring-2 ring-inset ring-reservada hover:bg-amber-200",
    iconeClasse: "text-amber-700",
    Icone: Clock,
    rotulo: "Reservada",
  },
  bloqueada: {
    classe: "hachura bg-bloqueada text-bloqueada-texto ring-1 ring-inset ring-slate-300",
    iconeClasse: "text-slate-500",
    Icone: Lock,
    rotulo: "Bloqueada",
  },
};

const ICONE_TIPO: Partial<Record<TipoVaga, { Icone: LucideIcon; rotulo: string }>> = {
  pcd: { Icone: Accessibility, rotulo: "PCD" },
  moto: { Icone: Bike, rotulo: "Moto" },
  eletrica: { Icone: Zap, rotulo: "Elétrica" },
};

type Props = {
  vaga: VagaNoMapa;
  agora: Date;
  selecionada: boolean;
  aoClicar: (vaga: VagaNoMapa) => void;
};

export function CardVaga({ vaga, agora, selecionada, aoClicar }: Props) {
  const { classe, iconeClasse, Icone, rotulo } = ESTILO_STATUS[vaga.status];
  const tipo = ICONE_TIPO[vaga.tipo];
  const detalhe =
    vaga.estadia?.placa ??
    (vaga.status === "reservada" ? (vaga.mensalistaFixo ?? vaga.reserva?.placa) : rotulo);
  const ehPlaca = Boolean(vaga.estadia);

  return (
    <button
      type="button"
      onClick={() => aoClicar(vaga)}
      aria-pressed={selecionada}
      aria-label={`Vaga ${vaga.numero}: ${rotulo}${detalhe && detalhe !== rotulo ? `, ${detalhe}` : ""}`}
      className={cn(
        "relative flex min-h-[5.25rem] flex-col justify-between rounded-xl p-2.5 text-left transition duration-150 hover:-translate-y-0.5 active:scale-95",
        classe,
        selecionada && "ring-4 ring-primaria ring-offset-2",
      )}
    >
      <span className="flex items-center justify-between gap-1">
        <span className="text-[15px] font-extrabold tracking-tight whitespace-nowrap">{vaga.numero}</span>
        <span className="flex shrink-0 items-center gap-0.5">
          {tipo && <tipo.Icone className="size-4" aria-label={tipo.rotulo} />}
          {vaga.tipo === "idoso" && <span className="text-[10px] font-bold">60+</span>}
          <Icone className={cn("size-4", iconeClasse)} aria-hidden />
        </span>
      </span>
      <span
        className={cn(
          "truncate text-xs font-semibold",
          ehPlaca && "font-mono tracking-wider",
          !ehPlaca && vaga.status === "livre" && "font-medium text-green-800/80",
        )}
      >
        {detalhe}
      </span>
      {vaga.estadia && (
        <span className="text-[11px] text-slate-300">
          {formatarDuracao(minutosEntre(new Date(vaga.estadia.entradaEm), agora))}
        </span>
      )}
      {vaga.reservavel && (
        <span
          title="Reservável pelo motorista"
          className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-primaria text-[10px] font-bold text-white shadow ring-2 ring-white"
        >
          R
        </span>
      )}
    </button>
  );
}
