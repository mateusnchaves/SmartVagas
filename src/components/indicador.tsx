import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const TONS = {
  azul: "bg-blue-50 text-primaria ring-blue-200",
  verde: "bg-green-50 text-livre ring-green-200",
  ambar: "bg-amber-50 text-amber-700 ring-amber-200",
  cinza: "bg-slate-100 text-slate-600 ring-slate-200",
} as const;

type Props = {
  rotulo: string;
  valor: string | number;
  detalhe?: string;
  Icone: LucideIcon;
  tom?: keyof typeof TONS;
};

export function Indicador({ rotulo, valor, detalhe, Icone, tom = "azul" }: Props) {
  return (
    <Card className="flex items-start gap-3">
      <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl ring-1", TONS[tom])}>
        <Icone className="size-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500">{rotulo}</p>
        <p className="text-3xl leading-tight font-extrabold tracking-tight tabular-nums">{valor}</p>
        {detalhe && <p className="mt-0.5 text-sm text-slate-500">{detalhe}</p>}
      </div>
    </Card>
  );
}
