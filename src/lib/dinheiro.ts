const formatadorBRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

// RN-11: todo valor monetário trafega e é gravado em centavos (inteiro).
export function formatarCentavos(centavos: number): string {
  return formatadorBRL.format(centavos / 100);
}
