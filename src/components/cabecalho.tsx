"use client";

import { CarFront, LayoutDashboard, ListOrdered, LogOut, SquareParking } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const ITENS = [
  { href: "/patio", rotulo: "Pátio", Icone: SquareParking },
  { href: "/dentro", rotulo: "Dentro", Icone: ListOrdered },
  { href: "/hoje", rotulo: "Hoje", Icone: LayoutDashboard },
] as const;

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
          <span className="hidden sm:inline">Smart Vagas</span>
        </Link>

        <nav aria-label="Principal" className="flex flex-1 gap-1">
          {ITENS.map(({ href, rotulo, Icone }) => {
            const ativo = caminho.startsWith(href);
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
                {rotulo}
              </Link>
            );
          })}
        </nav>

        <span className="hidden text-right text-xs leading-tight text-slate-500 md:block">
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
