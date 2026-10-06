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
    // Cadastro público é só do motorista: o hook abaixo força o papel. Operador é criado pelo dono.
    disableSignUp: false,
  },
  // No banco, para valer entre instâncias serverless (login é alvo de força bruta).
  rateLimit: { storage: "database" },
  user: {
    additionalFields: {
      papel: { type: ["dono", "operador", "motorista"], required: false, input: false },
      estacionamentoId: { type: "string", required: false, input: false },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (usuario) => {
          // MVP: um estacionamento por conta, então todo cadastro público vai para ele.
          const estacionamento = await prisma.estacionamento.findFirst({ select: { id: true } });
          if (!estacionamento) return false;
          return {
            data: { ...usuario, papel: "motorista", estacionamentoId: estacionamento.id },
          };
        },
        after: async (usuario) => {
          const estacionamento = await prisma.estacionamento.findFirstOrThrow({ select: { id: true } });
          // Mensalista cadastrado pelo dono com o mesmo e-mail ganha o login, sem duplicar.
          const { count } = await prisma.motorista.updateMany({
            where: { estacionamentoId: estacionamento.id, email: usuario.email, userId: null },
            data: { userId: usuario.id },
          });
          if (count > 0) return;
          await prisma.motorista.create({
            data: {
              estacionamentoId: estacionamento.id,
              nome: usuario.name,
              email: usuario.email,
              userId: usuario.id,
            },
          });
        },
      },
    },
  },
  plugins: [nextCookies()],
});
