import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { TelaAuth } from "@/components/tela-auth";
import { obterSessao } from "@/server/sessao";
import { FormLogin } from "./form-login";

export const metadata: Metadata = { title: "Entrar" };

export default async function PaginaLogin({ searchParams }: PageProps<"/login">) {
  const { erro } = await searchParams;
  const semAcesso = erro === "sem-acesso";
  const sessao = await obterSessao();
  if (sessao && !semAcesso) redirect("/");

  return (
    <TelaAuth titulo="Bem-vindo de volta" subtitulo="Entre para acessar o estacionamento.">
      <FormLogin aviso={semAcesso ? "Este usuário não tem acesso ao painel." : undefined} />
      <p className="text-center text-sm text-slate-600 lg:text-left">
        Quer reservar uma vaga?{" "}
        <Link href="/cadastro" className="font-semibold text-primaria underline-offset-2 hover:underline">
          Criar conta
        </Link>
      </p>
    </TelaAuth>
  );
}
