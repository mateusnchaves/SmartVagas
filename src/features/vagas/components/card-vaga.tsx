import { Accessibility, Bike, Car, Check, Clock, Lock, Zap, type LucideIcon } from "lucide-react";
import type { TipoVaga } from "@/generated/prisma/enums";
import { formatarDuracao, minutosEntre } from "@/lib/tempo";
import { cn } from "@/lib/utils";
import type { VagaNoMapa } from "../queries";
import type { StatusVaga } from "../status-vaga";

// Cor nunca sozinha: todo status tem ícone e texto (daltonismo, sol no pátio).
export const ESTILO_STATUS: Record<StatusVaga, { classe: string; Icone: LucideIcon; rotulo: string }> =
  {
    livre: { classe: "bg-livre text-white", Icone: Check, rotulo: "Livre" },
    ocupada: { classe: "bg-ocupada text-white", Icone: Car, rotulo: "Ocupada" },
    reservada: { classe: "bg-reservada text-reservada-texto", Icone: Clock, rotulo: "Reservada" },
    bloqueada: {
      classe: "hachura bg-bloqueada text-bloqueada-texto",
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
  const { classe, Icone, rotulo } = ESTILO_STATUS[vaga.status];
  const tipo = ICONE_TIPO[vaga.tipo];
  const detalhe =
    vaga.estadia?.placa ??
    (vaga.status === "reservada" ? (vaga.mensalistaFixo ?? vaga.reserva?.placa) : rotulo);

  return (
    <button
      type="button"
      onClick={() => aoClicar(vaga)}
      aria-pressed={selecionada}
      aria-label={`Vaga ${vaga.numero}: ${rotulo}${detalhe && detalhe !== rotulo ? `, ${detalhe}` : ""}`}
      className={cn(
        "relative flex min-h-20 flex-col justify-between rounded-lg p-2 text-left shadow-sm transition-transform active:scale-95",
        classe,
        selecionada && "ring-4 ring-primaria ring-offset-2",
      )}
    >
      <span className="flex items-center justify-between gap-1">
        <span className="text-sm font-bold whitespace-nowrap">{vaga.numero}</span>
        <span className="flex shrink-0 items-center gap-0.5">
          {tipo && <tipo.Icone className="size-4" aria-label={tipo.rotulo} />}
          {vaga.tipo === "idoso" && <span className="text-[10px] font-bold">60+</span>}
          <Icone className="size-4" aria-hidden />
        </span>
      </span>
      <span className="truncate text-xs font-semibold">{detalhe}</span>
      {vaga.estadia && (
        <span className="text-[11px] opacity-90">
          {formatarDuracao(minutosEntre(new Date(vaga.estadia.entradaEm), agora))}
        </span>
      )}
      {vaga.reservavel && (
        <span
          title="Reservável pelo motorista"
          className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-white text-[10px] font-bold text-primaria shadow ring-1 ring-slate-300"
        >
          R
        </span>
      )}
    </button>
  );
}
