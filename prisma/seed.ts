// Estacionamento demo do centro de Sorocaba. Só desenvolvimento: apaga tudo antes de criar.
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";
import { calcularValorEstadia, type TabelaPreco } from "../src/features/estadias/preco";
import { PrismaClient } from "../src/generated/prisma/client";
import type { FormaPagamento, Papel, TipoVaga } from "../src/generated/prisma/enums";
import { diaCivil, diaParaData, somarDias, somarMeses } from "../src/lib/tempo";

function exigir(nome: string): string {
  const valor = process.env[nome];
  if (!valor) throw new Error(`Defina ${nome} no .env (veja .env.example).`);
  return valor;
}

if (process.env.NODE_ENV === "production") throw new Error("O seed é só para desenvolvimento.");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: exigir("DATABASE_URL") }),
});

const FUSO = process.env.APP_TIMEZONE ?? "America/Sao_Paulo";
const agora = new Date();
const hoje = diaCivil(agora, FUSO);
const minutosAtras = (minutos: number) => new Date(agora.getTime() - minutos * 60_000);

// Valores de exemplo: o dono ajusta em Configurações (RF-03).
const TABELA: TabelaPreco = {
  toleranciaMin: 15,
  primeiraHoraCentavos: 1000,
  horaAdicionalCentavos: 500,
  diariaCentavos: 4000,
};

const SETORES = [
  { nome: "A · Coberto", prefixo: "A", total: 20, coberta: true },
  { nome: "B · Descoberto", prefixo: "B", total: 26, coberta: false },
  { nome: "M · Motos", prefixo: "M", total: 4, coberta: true },
];
const TIPOS_ESPECIAIS: Record<string, TipoVaga> = {
  "A-01": "pcd",
  "A-02": "pcd",
  "A-03": "idoso",
  "A-04": "idoso",
  "A-20": "eletrica",
};
const RESERVAVEIS = new Set(["B-21", "B-22", "B-23", "B-24", "B-25"]);
const BLOQUEADAS: Record<string, string> = { "B-26": "Manutenção do piso" };

const TODOS_OS_DIAS = [0, 1, 2, 3, 4, 5, 6];
const PLANOS = [
  { nome: "Mensal Integral", valorCentavos: 25000, diasSemana: TODOS_OS_DIAS, inicioMin: null, fimMin: null },
  { nome: "Noturno", valorCentavos: 12000, diasSemana: TODOS_OS_DIAS, inicioMin: 18 * 60, fimMin: 8 * 60 },
  { nome: "Fim de semana", valorCentavos: 9000, diasSemana: [6, 0], inicioMin: null, fimMin: null },
];

const MENSALISTAS = [
  { nome: "Marcos Lima", placa: "FQX2B47", modelo: "Corolla preto", plano: "Mensal Integral", vagaFixa: "A-05", venceEm: somarDias(hoje, 12), dentroHaMin: 190 },
  { nome: "Beatriz Nunes", placa: "GHT5E32", modelo: "HB20 branco", plano: "Mensal Integral", vagaFixa: "A-07", venceEm: somarMeses(hoje, 1), dentroHaMin: null },
  { nome: "Juliana Prado", placa: "EJK4821", modelo: "Kwid vermelho", plano: "Noturno", vagaFixa: null, venceEm: somarDias(hoje, -3), dentroHaMin: null },
  { nome: "Rogério Santos", placa: "DPL7C19", modelo: "Strada prata", plano: "Mensal Integral", vagaFixa: "A-06", venceEm: somarDias(hoje, -20), dentroHaMin: null },
];

// [placa, vaga, minutos dentro, modelo]
const AVULSOS_DENTRO: [string, string, number, string | null][] = [
  ["RTA1B23", "B-01", 25, "Onix prata"],
  ["QWE4D56", "B-02", 70, null],
  ["BRA2E19", "B-03", 160, "Gol branco"],
  ["MNO8F12", "B-04", 185, null],
  ["KLP3G45", "B-05", 255, "Compass cinza"],
  ["JHG6H78", "B-06", 300, null],
  ["ZXC9J01", "B-07", 45, "Mobi vermelho"],
  ["PLM5K34", "B-08", 10, null],
  ["DFG7L56", "B-10", 14 * 60, "Hilux preta"], // passa do alerta de 12h
  ["MTO1A23", "M-01", 95, "CG 160"],
];

// [placa, vaga, entrou há (min), ficou (min)]
const AVULSOS_SAIRAM: [string, string, number, number][] = [
  ["AAA1A11", "B-11", 600, 125],
  ["BBB2B22", "B-12", 560, 40],
  ["CCC3C33", "B-13", 520, 230],
  ["DDD4D44", "B-14", 480, 12],
  ["EEE5E55", "B-15", 430, 75],
  ["FFF6F66", "B-16", 400, 180],
  ["GGG7G77", "B-17", 350, 61],
  ["HHH8H88", "B-18", 300, 95],
  ["III9I99", "B-19", 240, 150],
  ["JJJ1J11", "B-20", 200, 30],
  ["KKK2K22", "A-10", 150, 110],
  ["LLL3L33", "A-11", 120, 50],
];
const FORMAS: FormaPagamento[] = ["pix", "dinheiro", "pix", "cartao"];

async function limpar() {
  await prisma.$executeRaw`TRUNCATE TABLE audit_logs, estadias, pagamentos_mensalidade, assinaturas,
    veiculos, motoristas, planos, custos, funcionarios, turnos, vagas, setores, configuracoes,
    sessions, accounts, verifications, rate_limits, users, estacionamentos CASCADE`;
}

async function criarUsuario(estacionamentoId: string, email: string, nome: string, papel: Papel, senha: string) {
  const id = randomUUID();
  await prisma.user.create({
    data: {
      id,
      email,
      name: nome,
      papel,
      emailVerified: true,
      estacionamentoId,
      accounts: {
        create: { id: randomUUID(), accountId: id, providerId: "credential", password: await hashPassword(senha) },
      },
    },
  });
  return id;
}

async function criarVagas(estacionamentoId: string) {
  const idPorNumero = new Map<string, string>();
  for (const setor of SETORES) {
    const { id: setorId } = await prisma.setor.create({ data: { estacionamentoId, nome: setor.nome } });
    const vagas = await prisma.vaga.createManyAndReturn({
      data: Array.from({ length: setor.total }, (_, i) => {
        const numero = `${setor.prefixo}-${String(i + 1).padStart(2, "0")}`;
        return {
          estacionamentoId,
          setorId,
          numero,
          coberta: setor.coberta,
          tipo: setor.prefixo === "M" ? ("moto" as const) : (TIPOS_ESPECIAIS[numero] ?? "comum"),
          reservavel: RESERVAVEIS.has(numero),
          ativa: !(numero in BLOQUEADAS),
          motivoBloqueio: BLOQUEADAS[numero] ?? null,
        };
      }),
      select: { id: true, numero: true },
    });
    for (const vaga of vagas) idPorNumero.set(vaga.numero, vaga.id);
  }
  return (numero: string) => {
    const id = idPorNumero.get(numero);
    if (!id) throw new Error(`Vaga ${numero} não existe no seed.`);
    return id;
  };
}

async function main() {
  await limpar();

  const { id: estacionamentoId } = await prisma.estacionamento.create({
    data: {
      nome: "Estacionamento Central (demo)",
      endereco: "Rua de Demonstração, 100 - Centro, Sorocaba/SP",
      horario: "Seg-Sex 7h-20h · Sáb 7h-14h",
      configuracao: { create: { ...TABELA, chavePix: "pix@estacionamento-demo.test" } },
    },
  });

  await criarUsuario(estacionamentoId, "dono@smartvagas.test", "Paulo (dono)", "dono", exigir("SEED_SENHA_DONO"));
  const operadorId = await criarUsuario(
    estacionamentoId,
    "operador@smartvagas.test",
    "Carlos (operador)",
    "operador",
    exigir("SEED_SENHA_OPERADOR"),
  );

  await prisma.funcionario.createMany({
    data: [
      { estacionamentoId, nome: "Carlos Souza", funcao: "Operador", salarioCentavos: 220000, encargosCentavos: 88000, userId: operadorId },
      { estacionamentoId, nome: "Ana Ribeiro", funcao: "Operadora", salarioCentavos: 200000, encargosCentavos: 80000 },
    ],
  });
  const mes = hoje.slice(0, 7);
  await prisma.custo.createMany({
    data: [
      { estacionamentoId, categoria: "aluguel", descricao: "Aluguel do terreno", valorCentavos: 600000, data: diaParaData(`${mes}-05`), criadoPorId: operadorId },
      { estacionamentoId, categoria: "energia", descricao: "Conta de luz", valorCentavos: 45000, data: diaParaData(`${mes}-10`), criadoPorId: operadorId },
    ],
  });

  const vaga = await criarVagas(estacionamentoId);

  const planos = await prisma.plano.createManyAndReturn({
    data: PLANOS.map((plano) => ({ estacionamentoId, ...plano })),
    select: { id: true, nome: true, valorCentavos: true },
  });

  for (const m of MENSALISTAS) {
    const plano = planos.find((p) => p.nome === m.plano);
    if (!plano) throw new Error(`Plano ${m.plano} não existe no seed.`);
    const motorista = await prisma.motorista.create({
      data: { estacionamentoId, nome: m.nome, veiculos: { create: { placa: m.placa, modelo: m.modelo } } },
    });
    const assinatura = await prisma.assinatura.create({
      data: {
        motoristaId: motorista.id,
        planoId: plano.id,
        vagaFixaId: m.vagaFixa ? vaga(m.vagaFixa) : null,
        venceEm: diaParaData(m.venceEm),
      },
    });
    const pagoHoje = m.venceEm === somarMeses(hoje, 1);
    await prisma.pagamentoMensalidade.create({
      data: {
        estacionamentoId,
        assinaturaId: assinatura.id,
        valorCentavos: plano.valorCentavos,
        formaPagamento: "pix",
        pagoEm: pagoHoje ? minutosAtras(30) : diaParaData(somarMeses(m.venceEm, -1)),
        periodoAte: diaParaData(m.venceEm),
        registradoPorId: operadorId,
      },
    });
    if (m.dentroHaMin !== null && m.vagaFixa) {
      await prisma.estadia.create({
        data: {
          estacionamentoId,
          vagaId: vaga(m.vagaFixa),
          placa: m.placa,
          modelo: m.modelo,
          entradaEm: minutosAtras(m.dentroHaMin),
          assinaturaId: assinatura.id,
          entradaPorId: operadorId,
        },
      });
    }
  }

  await prisma.estadia.createMany({
    data: AVULSOS_DENTRO.map(([placa, numero, minutos, modelo]) => ({
      estacionamentoId,
      vagaId: vaga(numero),
      placa,
      modelo,
      entradaEm: minutosAtras(minutos),
      entradaPorId: operadorId,
    })),
  });

  await prisma.estadia.createMany({
    data: AVULSOS_SAIRAM.map(([placa, numero, entrouHa, ficou], i) => {
      const valorCentavos = calcularValorEstadia(ficou, TABELA);
      return {
        estacionamentoId,
        vagaId: vaga(numero),
        placa,
        entradaEm: minutosAtras(entrouHa),
        saidaEm: minutosAtras(entrouHa - ficou),
        valorCentavos,
        formaPagamento: valorCentavos > 0 ? FORMAS[i % FORMAS.length] : null,
        entradaPorId: operadorId,
        saidaPorId: operadorId,
      };
    }),
  });

  console.log("Seed ok: 50 vagas, 3 planos, 4 mensalistas, 11 carros no pátio.");
  console.log("Logins: dono@smartvagas.test e operador@smartvagas.test (senhas no .env).");
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
