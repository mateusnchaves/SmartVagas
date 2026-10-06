"use client";

import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Campo } from "@/components/campo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import {
  ajustarVagaAction,
  atualizarEstacionamentoAction,
  criarOperadorAction,
  criarVagaAction,
  excluirVagaAction,
} from "../actions";

type Vaga = { id: string; numero: string; tipo: string; setor: string | null; ativa: boolean; reservavel: boolean; motivoBloqueio: string | null };

const ROTULO_TIPO: Record<string, string> = { comum: "Comum", pcd: "PCD", idoso: "Idoso", moto: "Moto", eletrica: "Elétrica" };

function LinhaVaga({ vaga }: { vaga: Vaga }) {
  const [ativa, setAtiva] = useState(vaga.ativa);
  const [reservavel, setReservavel] = useState(vaga.reservavel);
  const [motivo, setMotivo] = useState(vaga.motivoBloqueio ?? "");
  const [pendente, iniciar] = useTransition();
  const mudou = ativa !== vaga.ativa || reservavel !== vaga.reservavel || motivo !== (vaga.motivoBloqueio ?? "");

  function salvar() {
    iniciar(async () => {
      const r = await ajustarVagaAction({ vagaId: vaga.id, ativa, reservavel, motivoBloqueio: motivo });
      if (!r.ok) toast.error(r.erro.mensagem);
      else toast.success(`Vaga ${vaga.numero} atualizada.`);
    });
  }

  function excluir() {
    if (!window.confirm(`Excluir a vaga ${vaga.numero}?`)) return;
    iniciar(async () => {
      const r = await excluirVagaAction(vaga.id);
      if (!r.ok) toast.error(r.erro.mensagem);
    });
  }

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 py-2">
      <span className="w-14 font-bold">{vaga.numero}</span>
      <Badge>{ROTULO_TIPO[vaga.tipo] ?? vaga.tipo}</Badge>
      <label className="flex h-11 items-center gap-2 text-sm">
        <input type="checkbox" className="size-5" checked={ativa} onChange={(e) => setAtiva(e.target.checked)} />
        Ativa
      </label>
      <label className="flex h-11 items-center gap-2 text-sm">
        <input type="checkbox" className="size-5" checked={reservavel} onChange={(e) => setReservavel(e.target.checked)} />
        Reservável
      </label>
      {!ativa && (
        <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo do bloqueio" maxLength={80} className="w-52" aria-label={`Motivo do bloqueio da vaga ${vaga.numero}`} />
      )}
      <div className="ml-auto flex gap-1">
        {mudou && (
          <Button disabled={pendente} onClick={salvar}>
            <Save aria-hidden />
            Salvar
          </Button>
        )}
        <Button variant="ghost" size="icon" disabled={pendente} onClick={excluir} aria-label={`Excluir vaga ${vaga.numero}`}>
          <Trash2 aria-hidden />
        </Button>
      </div>
    </li>
  );
}

export function GerenciarVagas({ vagas }: { vagas: Vaga[] }) {
  const [pendente, iniciar] = useTransition();

  function criar(dados: FormData, form: HTMLFormElement) {
    iniciar(async () => {
      const c = (n: string) => String(dados.get(n) ?? "");
      const r = await criarVagaAction({
        numero: c("numero"),
        tipo: c("tipo") as "comum",
        setor: c("setor"),
        coberta: dados.get("coberta") === "on",
        reservavel: dados.get("reservavel") === "on",
      });
      if (!r.ok) toast.error(r.erro.mensagem);
      else {
        toast.success("Vaga criada.");
        form.reset();
      }
    });
  }

  return (
    <Card className="space-y-3">
      <CardTitle>Vagas ({vagas.length})</CardTitle>
      <p className="text-sm text-slate-500">
        Vaga reservável aparece para o motorista. Desligar não cancela reservas já feitas. Vagas com histórico só podem ser bloqueadas.
      </p>
      <ul className="max-h-[28rem] divide-y divide-slate-100 overflow-y-auto">
        {vagas.map((vaga) => (
          <LinhaVaga key={vaga.id} vaga={vaga} />
        ))}
      </ul>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          criar(new FormData(e.currentTarget), e.currentTarget);
        }}
        className="grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-4"
      >
        <Campo id="numero" rotulo="Número" required maxLength={10} placeholder="B-27" />
        <div className="space-y-1">
          <Label htmlFor="tipo">Tipo</Label>
          <Select id="tipo" name="tipo" defaultValue="comum">
            {Object.entries(ROTULO_TIPO).map(([valor, nome]) => (
              <option key={valor} value={valor}>
                {nome}
              </option>
            ))}
          </Select>
        </div>
        <Campo id="setor" rotulo="Setor (opcional)" maxLength={40} className="sm:col-span-2" />
        <label className="flex h-11 items-center gap-2 text-sm">
          <input type="checkbox" name="coberta" className="size-5" />
          Coberta
        </label>
        <label className="flex h-11 items-center gap-2 text-sm">
          <input type="checkbox" name="reservavel" className="size-5" />
          Reservável
        </label>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={pendente}>
            {pendente ? <Loader2 className="animate-spin" aria-hidden /> : <Plus aria-hidden />}
            Adicionar vaga
          </Button>
        </div>
      </form>
    </Card>
  );
}

export function FormEstacionamento({ nome, endereco, horario }: { nome: string; endereco: string; horario: string | null }) {
  const [pendente, iniciar] = useTransition();

  function salvar(dados: FormData) {
    iniciar(async () => {
      const c = (n: string) => String(dados.get(n) ?? "");
      const r = await atualizarEstacionamentoAction({ nome: c("nome"), endereco: c("endereco"), horario: c("horario") });
      if (!r.ok) toast.error(r.erro.mensagem);
      else toast.success("Dados do estacionamento salvos.");
    });
  }

  return (
    <Card className="space-y-3">
      <CardTitle>Estacionamento</CardTitle>
      <form action={salvar} className="grid gap-3 sm:grid-cols-2">
        <Campo id="nome" rotulo="Nome" defaultValue={nome} required />
        <Campo id="horario" rotulo="Horário de funcionamento" defaultValue={horario ?? ""} />
        <Campo id="endereco" rotulo="Endereço" defaultValue={endereco} required className="sm:col-span-2" />
        <div className="sm:col-span-2">
          <Button type="submit" disabled={pendente}>
            Salvar
          </Button>
        </div>
      </form>
    </Card>
  );
}

export function Operadores({ operadores }: { operadores: { id: string; name: string; email: string }[] }) {
  const [pendente, iniciar] = useTransition();

  function criar(dados: FormData, form: HTMLFormElement) {
    iniciar(async () => {
      const c = (n: string) => String(dados.get(n) ?? "");
      const r = await criarOperadorAction({ nome: c("nome"), email: c("email"), senha: c("senha") });
      if (!r.ok) toast.error(r.erro.mensagem);
      else {
        toast.success("Operador criado. Passe o e-mail e a senha para ele.");
        form.reset();
      }
    });
  }

  return (
    <Card className="space-y-3">
      <CardTitle>Operadores</CardTitle>
      <p className="text-sm text-slate-500">
        Operador dá entrada e saída, recebe mensalidade e fecha o próprio caixa. Não vê salário, lucro nem edita preços.
      </p>
      <ul className="divide-y divide-slate-100">
        {operadores.map((o) => (
          <li key={o.id} className="py-2 text-sm">
            <span className="font-semibold">{o.name}</span> <span className="text-slate-500">· {o.email}</span>
          </li>
        ))}
      </ul>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          criar(new FormData(e.currentTarget), e.currentTarget);
        }}
        className="grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-3"
      >
        <Campo id="nome" rotulo="Nome" required />
        <Campo id="email" rotulo="E-mail" type="email" required autoComplete="off" />
        <Campo id="senha" rotulo="Senha (mín. 8)" type="password" minLength={8} required autoComplete="new-password" />
        <div className="sm:col-span-3">
          <Button type="submit" disabled={pendente}>
            {pendente ? <Loader2 className="animate-spin" aria-hidden /> : <Plus aria-hidden />}
            Criar operador
          </Button>
        </div>
      </form>
    </Card>
  );
}
