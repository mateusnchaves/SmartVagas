import { somarDias } from "@/lib/tempo";

export type StatusAssinatura = "em_dia" | "atrasada" | "suspensa";

/**
 * RN-06. Calculado na leitura a partir do vencimento, sem cron.
 * Datas como "AAAA-MM-DD" no fuso do estacionamento; comparação lexicográfica é segura nesse formato.
 */
export function statusAssinatura(
  venceEm: string,
  hoje: string,
  carenciaDias: number,
): StatusAssinatura {
  if (hoje <= venceEm) return "em_dia";
  return hoje <= somarDias(venceEm, carenciaDias) ? "atrasada" : "suspensa";
}

/** Plano vale enquanto em dia ou dentro da carência; suspenso paga como avulso. */
export function planoValeNaEntrada(status: StatusAssinatura): boolean {
  return status !== "suspensa";
}
