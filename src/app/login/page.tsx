import type { Metadata } from "next";
import Link from "next/link";
import { TelaAuth } from "@/components/tela-auth";
import { obterSessao } from "@/server/sessao";
import { FormLogin } from "./form-login";

export const metadata: Metadata = { title: "Entrar" };

export default async function PaginaLogin({ searchParams }: PageProps<"/login">) {
  const { erro } = await searchParams;
  const sessao = await obterSessao();

  // Sem redirecionar quem já está logado: senão, logado como cliente, não há como
  // abrir o login para entrar como dono ou operador. Entrar de novo troca a sessão.
  return (
    <TelaAuth titulo="Bem-vindo de volta" subtitulo="Entre para acessar o estacionamento.">
      {sessao && (
        <p className="rounded-xl bg-blue-50 p-3 text-sm text-blue-900 ring-1 ring-blue-200">
          Você já está conectado como <strong>{sessao.user.email}</strong>.{" "}
          <Link href="/" className="font-semibold underline underline-offset-2">
            Continuar
          </Link>{" "}
          ou entre abaixo com outra conta.
        </p>
      )}
      <FormLogin aviso={erro === "sem-acesso" ? "Este usuário não tem acesso ao painel." : undefined} />
      <p className="text-center text-sm text-slate-600 lg:text-left">
        Quer reservar uma vaga?{" "}
        <Link href="/cadastro" className="font-semibold text-primaria underline-offset-2 hover:underline">
          Criar conta
        </Link>
      </p>
    </TelaAuth>
  );
}
