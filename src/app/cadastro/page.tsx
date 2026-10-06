import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { TelaAuth } from "@/components/tela-auth";
import { obterSessao } from "@/server/sessao";
import { FormCadastro } from "./form-cadastro";

export const metadata: Metadata = { title: "Criar conta" };

export default async function PaginaCadastro() {
  if (await obterSessao()) redirect("/");

  return (
    <TelaAuth titulo="Crie sua conta" subtitulo="Reserve sua vaga no estacionamento antes de sair de casa.">
      <FormCadastro />
      <p className="text-center text-sm text-slate-600 lg:text-left">
        Já tem conta?{" "}
        <Link href="/login" className="font-semibold text-primaria underline-offset-2 hover:underline">
          Entrar
        </Link>
      </p>
    </TelaAuth>
  );
}
