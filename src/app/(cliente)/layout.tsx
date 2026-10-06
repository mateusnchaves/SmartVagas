import { CabecalhoCliente } from "@/components/cabecalho-cliente";
import { COMMIT, VERSAO } from "@/lib/versao";
import { exigirMotorista } from "@/server/sessao";

export default async function LayoutCliente({ children }: { children: React.ReactNode }) {
  const contexto = await exigirMotorista();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <CabecalhoCliente nome={contexto.nome} />
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-4 px-4 py-4">{children}</main>
      <footer className="py-3 text-center text-xs text-slate-400">
        Smart Vagas v{VERSAO} · {COMMIT}
      </footer>
    </div>
  );
}
