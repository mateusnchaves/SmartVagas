"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { normalizarPlaca } from "@/lib/placa";
import { adicionarVeiculoAction, removerVeiculoAction } from "../actions";

export function FormVeiculo() {
  const [placa, setPlaca] = useState("");
  const [modelo, setModelo] = useState("");
  const [pendente, iniciar] = useTransition();

  function adicionar() {
    iniciar(async () => {
      const resultado = await adicionarVeiculoAction({ placa, modelo });
      if (!resultado.ok) {
        toast.error(resultado.erro.mensagem);
        return;
      }
      toast.success(`${resultado.dados.placa} adicionado.`);
      setPlaca("");
      setModelo("");
    });
  }

  return (
    <Card>
      <form
        onSubmit={(evento) => {
          evento.preventDefault();
          adicionar();
        }}
        className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
      >
        <div className="space-y-1">
          <Label htmlFor="nova-placa">Placa</Label>
          <Input
            id="nova-placa"
            value={placa}
            onChange={(e) => setPlaca(normalizarPlaca(e.target.value).slice(0, 7))}
            placeholder="ABC1D23"
            autoComplete="off"
            className="font-bold tracking-widest uppercase"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="novo-modelo">Modelo (opcional)</Label>
          <Input
            id="novo-modelo"
            value={modelo}
            maxLength={40}
            onChange={(e) => setModelo(e.target.value)}
            placeholder="Ex.: Onix prata"
          />
        </div>
        <Button type="submit" disabled={pendente || placa.length < 7}>
          {pendente ? <Loader2 className="animate-spin" aria-hidden /> : <Plus aria-hidden />}
          Adicionar
        </Button>
      </form>
    </Card>
  );
}

export function ItemVeiculo({ id, placa, modelo }: { id: string; placa: string; modelo: string | null }) {
  const [pendente, iniciar] = useTransition();

  function remover() {
    if (!window.confirm(`Remover ${placa}?`)) return;
    iniciar(async () => {
      const resultado = await removerVeiculoAction(id);
      if (!resultado.ok) toast.error(resultado.erro.mensagem);
    });
  }

  return (
    <li className="flex items-center justify-between py-2">
      <span>
        <span className="font-bold tracking-widest">{placa}</span>
        {modelo && <span className="ml-2 text-sm text-slate-500">{modelo}</span>}
      </span>
      <Button variant="ghost" size="icon" disabled={pendente} onClick={remover} aria-label={`Remover ${placa}`}>
        <Trash2 aria-hidden />
      </Button>
    </li>
  );
}
