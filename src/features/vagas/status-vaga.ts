export type StatusVaga = "livre" | "ocupada" | "reservada" | "bloqueada";

/**
 * Prioridade: bloqueio > carro dentro > reserva.
 * Na Fase 1, "reservada" = vaga fixa de mensalista com plano valendo (RN-04);
 * mensalista suspenso perde a vaga fixa (RN-06).
 */
export function statusDaVaga(vaga: {
  ativa: boolean;
  temEstadiaAberta: boolean;
  temMensalistaFixoValendo: boolean;
}): StatusVaga {
  if (!vaga.ativa) return "bloqueada";
  if (vaga.temEstadiaAberta) return "ocupada";
  if (vaga.temMensalistaFixoValendo) return "reservada";
  return "livre";
}
