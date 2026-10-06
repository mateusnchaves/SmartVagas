import { redirect } from "next/navigation";
import { obterSessao } from "@/server/sessao";

// Cada papel cai na sua tela: equipe no pátio, motorista no portal.
export default async function Inicio() {
  const sessao = await obterSessao();
  if (!sessao) redirect("/login");
  redirect(sessao.user.papel === "motorista" ? "/cliente" : "/patio");
}
