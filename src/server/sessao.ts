import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { Papel } from "@/generated/prisma/enums";
import { auth } from "./auth";

export type Contexto = {
  usuarioId: string;
  nome: string;
  papel: Papel;
  estacionamentoId: string;
};

const PAPEIS_EQUIPE: Papel[] = ["dono", "operador"];

export const obterSessao = cache(async () => auth.api.getSession({ headers: await headers() }));

function ehPapel(valor: unknown): valor is Papel {
  return valor === "dono" || valor === "operador" || valor === "motorista";
}

/**
 * RBAC no servidor (docs/MVP_v1.1.md §8). Toda página e action do painel passa por aqui;
 * o front esconder um botão não é controle de acesso.
 */
export async function exigirEquipe(papeis: Papel[] = PAPEIS_EQUIPE): Promise<Contexto> {
  const sessao = await obterSessao();
  if (!sessao) redirect("/login");

  const { id, name, papel, estacionamentoId } = sessao.user;
  if (!ehPapel(papel) || !PAPEIS_EQUIPE.includes(papel) || !estacionamentoId) {
    redirect("/login?erro=sem-acesso");
  }
  if (!papeis.includes(papel)) redirect("/patio");

  return { usuarioId: id, nome: name, papel, estacionamentoId };
}

export function ehDono(contexto: Contexto): boolean {
  return contexto.papel === "dono";
}
