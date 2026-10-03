import { Card } from "@/components/ui/card";

type Props = { rotulo: string; valor: string | number; detalhe?: string };

export function Indicador({ rotulo, valor, detalhe }: Props) {
  return (
    <Card>
      <p className="text-sm font-medium text-slate-500">{rotulo}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums">{valor}</p>
      {detalhe && <p className="mt-1 text-sm text-slate-500">{detalhe}</p>}
    </Card>
  );
}
