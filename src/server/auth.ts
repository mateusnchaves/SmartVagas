import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { env } from "@/lib/env";
import { prisma } from "./db";

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    // Fase 1: só o dono cria contas (RF-08). O portal do motorista abre o cadastro na Fase 2.
    disableSignUp: true,
  },
  // No banco, para valer entre instâncias serverless (login é alvo de força bruta).
  rateLimit: { storage: "database" },
  user: {
    additionalFields: {
      papel: { type: ["dono", "operador", "motorista"], required: false, input: false },
      estacionamentoId: { type: "string", required: false, input: false },
    },
  },
  plugins: [nextCookies()],
});
