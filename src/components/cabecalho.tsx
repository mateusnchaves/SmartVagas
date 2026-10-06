"use client";

import {
  Banknote,
  History,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  Settings,
  SquareParking,
  Ticket,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogoMarca } from "@/components/logo";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const ITENS: { href: string; rotulo: string; Icone: LucideIcon; soDono?: boolean }[] = [
  { href: "/patio", rotulo: "Pátio", Icone: SquareParking },
  { href: "/dentro", rotulo: "Dentro", Icone: ListOrdered },
  { href: "/reservas", rotulo: "Reservas", Icone: Ticket },
  { href: "/mensalistas", rotulo: "Mensalistas", Icone: Users },
  { href: "/caixa", rotulo: "Caixa", Icone: Banknote },
  { href: "/historico", rotulo: "Histórico", Icone: History },
  { href: "/hoje", rotulo: "Hoje", Icone: LayoutDashboard },
  { href: "/financeiro", rotulo: "Financeiro", Icone: TrendingUp, soDono: true },
  { href: "/configuracoes", rotulo: "Configurações", Icone: Settings, soDono: true },
];

function iniciais(nome: string): string {
  return nome
    .replace(/\(.*?\)/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0].toUpperCase())
    .join("");
}

export function Cabecalho({ nome, papel }: { nome: string; papel: string }) {
  const caminho = usePathname();
  const router = useRouter();

  async function sair() {
    await authClient.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2">
        <Link href="/patio" className="mr-1 flex items-center gap-2 font-extrabold tracking-tight text-slate-900" aria-label="Smart Vagas">
          <LogoMarca />
          <span className="hidden lg:inline">Smart Vagas</span>
        </Link>

        {/* Rola na horizontal no celular; só o item da página atual mostra o texto. */}
        <nav aria-label="Principal" className="flex flex-1 gap-1 overflow-x-auto py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {ITENS.filter((item) => !item.soDono || papel === "dono").map(({ href, rotulo, Icone }) => {
            const ativo = caminho.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={ativo ? "page" : undefined}
                aria-label={rotulo}
                title={rotulo}
                className={cn(
                  "flex h-10 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900",
                  ativo && "bg-primaria text-white shadow-sm shadow-primaria/30 hover:bg-primaria hover:text-white",
                )}
              >
                <Icone className="size-[18px]" aria-hidden />
                <span className={cn(!ativo && "hidden 2xl:inline")}>{rotulo}</span>
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <span className="grid size-9 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
            {iniciais(nome)}
          </span>
          <span className="text-xs leading-tight text-slate-500">
            <span className="block max-w-32 truncate font-semibold text-slate-700">{nome.replace(/\s*\(.*?\)/, "")}</span>
            <span className="capitalize">{papel}</span>
          </span>
        </div>
        <Button variant="ghost" size="icon" onClick={sair} aria-label="Sair">
          <LogOut aria-hidden />
        </Button>
      </div>
    </header>
  );
}
