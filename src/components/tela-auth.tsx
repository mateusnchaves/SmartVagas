import { CalendarCheck, ChartNoAxesCombined, Gauge } from "lucide-react";
import { Logo } from "@/components/logo";

const DESTAQUES = [
  { Icone: Gauge, texto: "Entrada e saída em segundos, só com a placa" },
  { Icone: ChartNoAxesCombined, texto: "Saiba o lucro do mês em um clique" },
  { Icone: CalendarCheck, texto: "Reserve sua vaga antes de sair de casa" },
] as const;

/** Moldura de login e cadastro: painel de marca ao lado do formulário (empilhado no celular). */
export function TelaAuth({ titulo, subtitulo, children }: { titulo: string; subtitulo?: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen flex-1 lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-primaria via-[#1b3a9e] to-[#0f1f5c] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="linhas-vaga pointer-events-none absolute inset-0" aria-hidden />
        <Logo className="relative text-xl [&_rect:first-child]:fill-white/15" />
        <div className="relative space-y-8">
          <h2 className="max-w-md text-4xl leading-tight font-extrabold tracking-tight">
            Seu estacionamento sob controle, do pátio ao lucro.
          </h2>
          <ul className="space-y-4">
            {DESTAQUES.map(({ Icone, texto }) => (
              <li key={texto} className="flex items-center gap-3 text-lg text-blue-50">
                <span className="grid size-10 place-items-center rounded-xl bg-white/12 ring-1 ring-white/20">
                  <Icone className="size-5" aria-hidden />
                </span>
                {texto}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-blue-200">Feito para o estacionamento do centro de Sorocaba.</p>
      </aside>

      <main className="flex flex-col items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-2 text-center lg:text-left">
            <Logo className="text-2xl text-primaria lg:hidden" />
            <h1 className="pt-2 text-2xl font-extrabold tracking-tight lg:pt-0 lg:text-3xl">{titulo}</h1>
            {subtitulo && <p className="text-slate-600">{subtitulo}</p>}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
