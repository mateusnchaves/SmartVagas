import { agruparPor, cn } from "@/lib/utils";
import type { VagaNoMapa } from "../queries";
import type { StatusVaga } from "../status-vaga";
import { CardVaga, ESTILO_STATUS } from "./card-vaga";

type Props = {
  vagas: VagaNoMapa[];
  agora: Date;
  vagaSelecionadaId: string | null;
  aoClicar: (vaga: VagaNoMapa) => void;
};

const ORDEM_STATUS: StatusVaga[] = ["livre", "ocupada", "reservada", "bloqueada"];
const SEM_SETOR = "Sem setor";

export function MapaVagas({ vagas, agora, vagaSelecionadaId, aoClicar }: Props) {
  const porSetor = agruparPor(vagas, (vaga) => vaga.setor ?? SEM_SETOR);
  const contagem = agruparPor(vagas, (vaga) => vaga.status);

  return (
    <section aria-label="Mapa de vagas" className="space-y-4">
      {/* A contagem é também a legenda: cor + ícone + texto. */}
      <ul className="flex flex-wrap gap-2">
        {ORDEM_STATUS.map((status) => {
          const { classe, Icone, rotulo } = ESTILO_STATUS[status];
          return (
            <li
              key={status}
              className={cn("flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold", classe)}
            >
              <Icone className="size-4" aria-hidden />
              {rotulo}: {contagem.get(status)?.length ?? 0}
            </li>
          );
        })}
      </ul>

      {[...porSetor].map(([setor, vagasDoSetor]) => (
        <div key={setor} className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-600">{setor}</h3>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(6rem,1fr))] gap-2">
            {vagasDoSetor.map((vaga) => (
              <CardVaga
                key={vaga.id}
                vaga={vaga}
                agora={agora}
                selecionada={vaga.id === vagaSelecionadaId}
                aoClicar={aoClicar}
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
