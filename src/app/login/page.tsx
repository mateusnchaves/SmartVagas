import { CarFront } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { obterSessao } from "@/server/sessao";
import { FormLogin } from "./form-login";

export const metadata: Metadata = { title: "Entrar" };

export default async function PaginaLogin({ searchParams }: PageProps<"/login">) {
  const { erro } = await searchParams;
  const semAcesso = erro === "sem-acesso";
  const sessao = await obterSessao();
  if (sessao && !semAcesso) redirect("/patio");

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-primaria">
          <CarFront className="size-10" aria-hidden />
          <h1 className="text-2xl font-bold">Smart Vagas</h1>
        </div>
        <FormLogin aviso={semAcesso ? "Este usuário não tem acesso ao painel." : undefined} />
      </div>
    </main>
  );
}
