import { describe, expect, it } from "vitest";
import { statusAssinatura } from "./status-assinatura";

describe("statusAssinatura (RN-06)", () => {
  const vence = "2026-10-10";

  it.each([
    ["antes do vencimento", "2026-10-01", 5, "em_dia"],
    ["no dia do vencimento", "2026-10-10", 5, "em_dia"],
    ["um dia depois entra na carência", "2026-10-11", 5, "atrasada"],
    ["último dia da carência", "2026-10-15", 5, "atrasada"],
    ["passou da carência", "2026-10-16", 5, "suspensa"],
    ["sem carência suspende no dia seguinte", "2026-10-11", 0, "suspensa"],
  ] as const)("%s", (_, hoje, carencia, esperado) => {
    expect(statusAssinatura(vence, hoje, carencia)).toBe(esperado);
  });
});
