import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { Papel } from "@/generated/prisma/enums";
import { auth } from "./auth";
import { prisma } from "./db";

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
  if (papel === "motorista") redirect("/cliente");
  if (!ehPapel(papel) || !PAPEIS_EQUIPE.includes(papel) || !estacionamentoId) {
    redirect("/login?erro=sem-acesso");
  }
  if (!papeis.includes(papel)) redirect("/patio");

  return { usuarioId: id, nome: name, papel, estacionamentoId };
}

export function ehDono(contexto: Contexto): boolean {
  return contexto.papel === "dono";
}

export type ContextoMotorista = Contexto & { motoristaId: string };

/** Portal do cliente (Fase 2): só quem tem papel motorista e cadastro vinculado entra. */
export async function exigirMotorista(): Promise<ContextoMotorista> {
  const sessao = await obterSessao();
  if (!sessao) redirect("/login");

  const { id, name, papel, estacionamentoId } = sessao.user;
  if (papel !== "motorista" || !estacionamentoId) redirect("/patio");

  const motorista = await prisma.motorista.findUnique({ where: { userId: id }, select: { id: true } });
  if (!motorista) redirect("/login?erro=sem-acesso");

  return { usuarioId: id, nome: name, papel, estacionamentoId, motoristaId: motorista.id };
}
