/**
 * Monta um resumo SEM dados pessoais para o "Explicar minha situação": nada de nomes, CPF,
 * credores ou valores de dívidas — só idades, rendas, situação de trabalho e bloqueios por tipo.
 */
import { z } from "zod";
import { rendaNaData, situacaoCpfNaData } from "@/lib/dominio/cenarios";
import type { Diagnostico } from "@/lib/dominio/diagnostico";
import type { EstadoFamilia } from "@/lib/dominio/esquemas";
import { idadeEmAnos } from "@/lib/financiamento/basico";

export const esquemaSituacaoAnonima = z.object({
  pessoas: z
    .array(
      z.object({
        rotulo: z.string().regex(/^Pessoa \d+$/),
        idade: z.number().int().min(0).max(120),
        rendaComprovada: z.number().min(0).max(1_000_000),
        rendaNaoComprovada: z.number().min(0).max(1_000_000),
        trabalho: z.string().max(40),
        nome: z.enum(["limpo", "negativado", "aguardando-score"]),
        podeComprar: z.boolean(),
      }),
    )
    .max(10),
  semaforo: z.enum(["pronto", "quase", "ainda-nao"]),
  precoMaximoHoje: z.number().min(0),
  precoMaximoNomeLimpo: z.number().min(0),
  bloqueios: z.array(z.string().max(40)).max(20),
  recusasPorCausa: z.record(z.string().max(30), z.number().int().min(0)),
  dinheiroGuardado: z.number().min(0),
});

export type SituacaoAnonima = z.infer<typeof esquemaSituacaoAnonima>;

export function anonimizarSituacao(
  estado: EstadoFamilia,
  diagnostico: Diagnostico,
  data: Date,
): SituacaoAnonima {
  return {
    pessoas: estado.pessoas.slice(0, 10).map((p, i) => {
      const renda = rendaNaData(p, data);
      return {
        rotulo: `Pessoa ${i + 1}`,
        idade: idadeEmAnos(p.dataNascimento, data),
        rendaComprovada: Math.round(renda.comprovada),
        rendaNaoComprovada: Math.round(renda.naoComprovada),
        trabalho: p.emprego.situacao,
        nome: situacaoCpfNaData(p, data),
        podeComprar: p.podeSerComprador,
      };
    }),
    semaforo: diagnostico.semaforo,
    precoMaximoHoje: Math.round(diagnostico.melhor?.resultado.precoMaximo.SAC ?? 0),
    precoMaximoNomeLimpo: Math.round(diagnostico.potencial?.resultado.precoMaximo.SAC ?? 0),
    // Só o tipo do bloqueio (ex.: "cpf", "idade") — os títulos têm nomes de pessoas.
    bloqueios: diagnostico.bloqueios.map((b) => b.id.replace(/^fim-contrato-.*/, "fim-contrato")),
    recusasPorCausa: Object.fromEntries(
      diagnostico.recusas.porCausa.map((c) => [c.causa, c.quantidade]),
    ),
    dinheiroGuardado: Math.round(estado.dinheiro.entrada + estado.dinheiro.outrosRecursos),
  };
}

export function promptExplicar(situacao: SituacaoAnonima): string {
  return [
    "Você ajuda uma família brasileira leiga a entender por que o financiamento habitacional da",
    "Caixa (Minha Casa Minha Vida) está sendo negado e o que fazer. Escreva em português simples,",
    "sem jargão, em no máximo 8 frases curtas, tratando a família por 'vocês'. Explique os",
    "principais bloqueios e os 2 ou 3 próximos passos mais importantes. Não recomende bancos nem",
    "empréstimos específicos. Termine dizendo que é uma estimativa e que o valor final é da Caixa.",
    "Regras: o mais velho do contrato define o prazo (idade + prazo até 80 anos e 6 meses);",
    "parcela até 30% da renda comprovada; nome sujo impede aprovação.",
    "",
    "Dados (anonimizados, valores em reais):",
    JSON.stringify(situacao),
  ].join("\n");
}
