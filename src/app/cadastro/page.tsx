import { CarFront } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { obterSessao } from "@/server/sessao";
import { FormCadastro } from "./form-cadastro";

export const metadata: Metadata = { title: "Criar conta" };

export default async function PaginaCadastro() {
  if (await obterSessao()) redirect("/");

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-primaria">
          <CarFront className="size-10" aria-hidden />
          <h1 className="text-2xl font-bold">Criar conta</h1>
          <p className="text-center text-sm text-slate-600">
            Reserve sua vaga no estacionamento antes de sair de casa.
          </p>
        </div>
        <FormCadastro />
        <p className="text-center text-sm text-slate-600">
          Já tem conta?{" "}
          <Link href="/login" className="font-semibold text-primaria underline">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
