"use client";

import {
  Banknote,
  CarFront,
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

export function Cabecalho({ nome, papel }: { nome: string; papel: string }) {
  const caminho = usePathname();
  const router = useRouter();

  async function sair() {
    await authClient.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2">
        <Link href="/patio" className="mr-2 flex items-center gap-1.5 font-bold text-primaria">
          <CarFront className="size-6" aria-hidden />
          <span className="hidden lg:inline">Smart Vagas</span>
        </Link>

        {/* Rola na horizontal no celular; só o item da página atual mostra o texto. */}
        <nav aria-label="Principal" className="flex flex-1 gap-1 overflow-x-auto">
          {ITENS.filter((item) => !item.soDono || papel === "dono").map(({ href, rotulo, Icone }) => {
            const ativo = caminho.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={ativo ? "page" : undefined}
                aria-label={rotulo}
                className={cn(
                  "flex h-11 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-slate-600 hover:bg-slate-100",
                  ativo && "bg-primaria/10 text-primaria",
                )}
              >
                <Icone className="size-5" aria-hidden />
                <span className={cn(!ativo && "hidden xl:inline")}>{rotulo}</span>
              </Link>
            );
          })}
        </nav>

        <span className="hidden text-right text-xs leading-tight text-slate-500 lg:block">
          {nome}
          <br />
          {papel}
        </span>
        <Button variant="ghost" size="icon" onClick={sair} aria-label="Sair">
          <LogOut aria-hidden />
        </Button>
      </div>
    </header>
  );
}
