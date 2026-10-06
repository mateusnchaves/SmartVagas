"use client";

import { CalendarPlus, Car, LogOut, Ticket } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogoMarca } from "@/components/logo";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const ITENS = [
  { href: "/cliente", rotulo: "Reservas", Icone: Ticket, exato: true },
  { href: "/cliente/reservar", rotulo: "Reservar", Icone: CalendarPlus, exato: false },
  { href: "/cliente/veiculos", rotulo: "Veículos", Icone: Car, exato: false },
] as const;

export function CabecalhoCliente({ nome }: { nome: string }) {
  const caminho = usePathname();
  const router = useRouter();

  async function sair() {
    await authClient.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-2">
        <LogoMarca className="mr-1" />
        <nav aria-label="Principal" className="flex flex-1 gap-1">
          {ITENS.map(({ href, rotulo, Icone, exato }) => {
            const ativo = exato ? caminho === href : caminho.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={ativo ? "page" : undefined}
                className={cn(
                  "flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900",
                  ativo && "bg-primaria text-white shadow-sm shadow-primaria/30 hover:bg-primaria hover:text-white",
                )}
              >
                <Icone className="size-[18px]" aria-hidden />
                <span className={cn(!ativo && "hidden sm:inline")}>{rotulo}</span>
              </Link>
            );
          })}
        </nav>
        <span className="hidden max-w-32 truncate text-xs font-semibold text-slate-600 sm:block">{nome}</span>
        <Button variant="ghost" size="icon" onClick={sair} aria-label="Sair">
          <LogOut aria-hidden />
        </Button>
      </div>
    </header>
  );
}
