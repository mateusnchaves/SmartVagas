import { Cabecalho } from "@/components/cabecalho";
import { COMMIT, VERSAO } from "@/lib/versao";
import { exigirEquipe } from "@/server/sessao";

export default async function LayoutPainel({ children }: { children: React.ReactNode }) {
  const contexto = await exigirEquipe();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <Cabecalho nome={contexto.nome} papel={contexto.papel} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-4">{children}</main>
      <footer className="py-3 text-center text-xs text-slate-400">
        Smart Vagas v{VERSAO} · {COMMIT}
      </footer>
    </div>
  );
}
