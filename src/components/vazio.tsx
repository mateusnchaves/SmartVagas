import type { LucideIcon } from "lucide-react";

/** Estado vazio com ícone: uma lista sem itens ainda precisa dizer o que fazer. */
export function Vazio({ Icone, titulo, dica }: { Icone: LucideIcon; titulo: string; dica?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
        <Icone className="size-6" aria-hidden />
      </span>
      <p className="font-semibold text-slate-700">{titulo}</p>
      {dica && <p className="max-w-xs text-sm text-slate-500">{dica}</p>}
    </div>
  );
}
