import { minutosForaDoPlano, type JanelaPlano } from "@/features/mensalistas/cobertura-plano";
import { minutosEntre } from "@/lib/tempo";
import { calcularValorEstadia, type TabelaPreco } from "./preco";

export type PlanoAplicado = { nome: string; janela: JanelaPlano };

export type Cobranca = {
  minutosTotais: number;
  minutosCobrados: number;
  valorCentavos: number;
  plano: string | null;
};

/** Valor da saída. Mensalista paga, como avulso, só o que ficou fora da janela do plano (RN-05). */
export function calcularCobranca(
  entrada: Date,
  saida: Date,
  tabela: TabelaPreco,
  fuso: string,
  plano: PlanoAplicado | null,
): Cobranca {
  const minutosTotais = minutosEntre(entrada, saida);
  const minutosCobrados = plano
    ? minutosForaDoPlano(entrada, saida, plano.janela, fuso)
    : minutosTotais;

  return {
    minutosTotais,
    minutosCobrados,
    valorCentavos: calcularValorEstadia(minutosCobrados, tabela),
    plano: plano?.nome ?? null,
  };
}
