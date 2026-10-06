"use client";

import { CalendarPlus, Car, CarFront, LogOut, Ticket } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-2">
        <CarFront className="mr-1 size-6 text-primaria" aria-hidden />
        <nav aria-label="Principal" className="flex flex-1 gap-1">
          {ITENS.map(({ href, rotulo, Icone, exato }) => {
            const ativo = exato ? caminho === href : caminho.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={ativo ? "page" : undefined}
                className={cn(
                  "flex h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-slate-600 hover:bg-slate-100",
                  ativo && "bg-primaria/10 text-primaria",
                )}
              >
                <Icone className="size-5" aria-hidden />
                <span className={cn(!ativo && "hidden sm:inline")}>{rotulo}</span>
              </Link>
            );
          })}
        </nav>
        <span className="hidden max-w-32 truncate text-xs text-slate-500 sm:block">{nome}</span>
        <Button variant="ghost" size="icon" onClick={sair} aria-label="Sair">
          <LogOut aria-hidden />
        </Button>
      </div>
    </header>
  );
}
