"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

const MUITAS_TENTATIVAS = 429;

export function FormLogin({ aviso }: { aviso?: string }) {
  const router = useRouter();
  const [erro, setErro] = useState(aviso ?? null);
  const [pendente, iniciar] = useTransition();

  function entrar(dados: FormData) {
    iniciar(async () => {
      const { error } = await authClient.signIn.email({
        email: String(dados.get("email")),
        password: String(dados.get("senha")),
      });
      if (error) {
        setErro(
          error.status === MUITAS_TENTATIVAS
            ? "Muitas tentativas. Aguarde um minuto."
            : "E-mail ou senha incorretos.",
        );
        return;
      }
      router.replace("/");
      router.refresh();
    });
  }

  return (
    <Card>
      <form action={entrar} className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" autoComplete="username" required autoFocus />
        </div>
        <div className="space-y-1">
          <Label htmlFor="senha">Senha</Label>
          <Input id="senha" name="senha" type="password" autoComplete="current-password" required />
        </div>
        {erro && (
          <p role="alert" className="text-sm font-medium text-alerta">
            {erro}
          </p>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={pendente}>
          {pendente && <Loader2 className="animate-spin" aria-hidden />}
          Entrar
        </Button>
      </form>
    </Card>
  );
}
