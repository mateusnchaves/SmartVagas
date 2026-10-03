import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { normalizarPlaca } from "@/lib/placa";

type Props = {
  ref: React.Ref<HTMLInputElement>;
  valor: string;
  pendente: boolean;
  aoMudar: (placa: string) => void;
  aoEnviar: () => void;
};

const TAMANHO_PLACA = 7;

export function CampoPlaca({ ref, valor, pendente, aoMudar, aoEnviar }: Props) {
  return (
    <form
      onSubmit={(evento) => {
        evento.preventDefault();
        aoEnviar();
      }}
      className="flex gap-2"
    >
      <Input
        ref={ref}
        value={valor}
        onChange={(evento) => aoMudar(normalizarPlaca(evento.target.value).slice(0, TAMANHO_PLACA))}
        placeholder="ABC1D23"
        aria-label="Placa do veículo"
        autoFocus
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        enterKeyHint="go"
        className="h-14 text-center text-2xl font-bold tracking-[0.3em] uppercase placeholder:font-normal placeholder:tracking-widest"
      />
      <Button type="submit" size="lg" disabled={pendente || valor.length < TAMANHO_PLACA}>
        {pendente ? <Loader2 className="animate-spin" aria-hidden /> : <Search aria-hidden />}
        <span className="sr-only sm:not-sr-only">Buscar</span>
      </Button>
    </form>
  );
}
