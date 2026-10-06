"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { formatarCentavos } from "@/lib/dinheiro";
import { buscarDisponibilidadeAction, criarReservaAction } from "../actions";
import type { Disponibilidade } from "../servico";

type Props = {
  veiculos: { placa: string; modelo: string | null }[];
  inicioPadrao: string;
  fimPadrao: string;
  duracaoMaxH: number;
  antecedenciaMaxDias: number;
};

const ROTULO_TIPO: Record<string, string> = {
  comum: "Vaga comum",
  pcd: "Vaga PCD",
  idoso: "Vaga idoso",
  moto: "Vaga de moto",
  eletrica: "Vaga com recarga elétrica",
};

export function FormReserva({ veiculos, inicioPadrao, fimPadrao, duracaoMaxH, antecedenciaMaxDias }: Props) {
  const router = useRouter();
  const [placa, setPlaca] = useState(veiculos[0].placa);
  const [inicio, setInicio] = useState(inicioPadrao);
  const [fim, setFim] = useState(fimPadrao);
  const [opcoes, setOpcoes] = useState<Disponibilidade[] | null>(null);
  const [buscando, buscar] = useTransition();
  const [reservando, reservar] = useTransition();

  function mudarPeriodo(atualiza: () => void) {
    atualiza();
    setOpcoes(null);
  }

  function verDisponibilidade() {
    buscar(async () => {
      const resultado = await buscarDisponibilidadeAction({ inicio, fim, tipo: "comum" });
      if (!resultado.ok) {
        setOpcoes(null);
        toast.error(resultado.erro.mensagem);
        return;
      }
      setOpcoes(resultado.dados);
    });
  }

  function confirmar(tipo: string) {
    reservar(async () => {
      const resultado = await criarReservaAction({
        inicio,
        fim,
        placa,
        tipo: tipo as "comum" | "pcd" | "idoso" | "moto" | "eletrica",
      });
      if (!resultado.ok) {
        toast.error(resultado.erro.mensagem);
        return;
      }
      toast.success(`Reserva ${resultado.dados.codigo} criada. Falta pagar.`);
      router.push("/cliente");
    });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Reservar vaga</h1>
      <Card className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="placa">Veículo</Label>
          <Select id="placa" value={placa} onChange={(e) => setPlaca(e.target.value)}>
            {veiculos.map((veiculo) => (
              <option key={veiculo.placa} value={veiculo.placa}>
                {veiculo.placa}
                {veiculo.modelo ? ` · ${veiculo.modelo}` : ""}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="inicio">Chegada</Label>
            <Input
              id="inicio"
              type="datetime-local"
              step={900}
              value={inicio}
              onChange={(e) => mudarPeriodo(() => setInicio(e.target.value))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="fim">Saída</Label>
            <Input
              id="fim"
              type="datetime-local"
              step={900}
              value={fim}
              onChange={(e) => mudarPeriodo(() => setFim(e.target.value))}
            />
          </div>
        </div>
        <p className="text-xs text-slate-500">
          Até {duracaoMaxH} horas por reserva, com até {antecedenciaMaxDias} dias de antecedência.
        </p>
        <Button className="w-full" disabled={buscando} onClick={verDisponibilidade}>
          {buscando && <Loader2 className="animate-spin" aria-hidden />}
          Ver vagas disponíveis
        </Button>
      </Card>

      {opcoes && opcoes.length === 0 && (
        <Card className="py-6 text-center text-slate-600">
          Nenhuma vaga disponível nesse horário. Tente outro horário.
        </Card>
      )}

      {opcoes?.map((opcao) => (
        <Card key={opcao.tipo} className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>{ROTULO_TIPO[opcao.tipo] ?? opcao.tipo}</CardTitle>
            <p className="text-sm text-slate-600">
              {opcao.disponiveis} {opcao.disponiveis === 1 ? "disponível" : "disponíveis"}
            </p>
            <p className="text-2xl font-bold tabular-nums">{formatarCentavos(opcao.valorCentavos)}</p>
          </div>
          <Button size="lg" disabled={reservando} onClick={() => confirmar(opcao.tipo)}>
            {reservando && <Loader2 className="animate-spin" aria-hidden />}
            Reservar
          </Button>
        </Card>
      ))}
    </div>
  );
}
