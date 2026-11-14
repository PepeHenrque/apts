/**
 * Converte os dados da família (pessoas, dinheiro) em compradores e gera automaticamente os
 * cenários de compra (cada pessoa sozinha, cada dupla e todos juntos).
 */
import { REGRAS, type Regras } from "@/config/regras-mcmv";
import { diasEntre, lerDataIso, paraDataIso, somarDias } from "@/lib/datas";
import type { EstadoFamilia, Pessoa } from "@/lib/dominio/esquemas";
import { idadeEmMeses } from "@/lib/financiamento/basico";
import {
  calcularCenario,
  type Proponente,
  type ResultadoCenario,
} from "@/lib/financiamento/capacidade";

/** Renda da pessoa na data: zero antes do início e depois do fim previsto do contrato. */
export function rendaNaData(
  pessoa: Pessoa,
  data: Date,
  regras: Regras = REGRAS,
): { comprovada: number; naoComprovada: number; temporaria: boolean } {
  const { situacao, salarioBruto, dataInicio, dataFimPrevista } = pessoa.emprego;
  const inicio = lerDataIso(dataInicio);
  const fim = lerDataIso(dataFimPrevista);
  const ativa =
    situacao !== "desempregado" &&
    salarioBruto > 0 &&
    (!inicio || diasEntre(inicio, data) >= 0) &&
    (!fim || diasEntre(data, fim) >= 0);
  if (!ativa) return { comprovada: 0, naoComprovada: 0, temporaria: false };
  const ehComprovada = regras.situacoesRendaComprovada.includes(situacao);
  return {
    comprovada: ehComprovada ? salarioBruto : 0,
    naoComprovada: ehComprovada ? 0 : salarioBruto,
    temporaria: regras.situacoesRendaTemporaria.includes(situacao),
  };
}

export type SituacaoCpf = Proponente["situacaoCpf"];

/**
 * Situação do CPF na data:
 * - "limpo": não negativado, ou pagou tudo há mais de `diasAguardarScore` dias;
 * - "aguardando-score": pagou todas as dívidas recentemente;
 * - "negativado": ainda há dívida não paga (ou nenhuma dívida cadastrada).
 */
export function situacaoCpfNaData(
  pessoa: Pessoa,
  data: Date,
  regras: Regras = REGRAS,
): SituacaoCpf {
  if (!pessoa.cpf.negativado) return "limpo";
  const dividas = pessoa.cpf.dividas;
  if (dividas.length === 0 || dividas.some((d) => d.status !== "pago")) return "negativado";
  const datas = dividas
    .map((d) => lerDataIso(d.dataPagamento))
    .filter((d): d is Date => d !== null);
  if (datas.length < dividas.length) return "aguardando-score";
  const ultimoPagamento = datas.reduce((a, b) => (a > b ? a : b));
  return diasEntre(ultimoPagamento, data) >= regras.diasAguardarScore
    ? "limpo"
    : "aguardando-score";
}

/** Data em que a pessoa passa a ser considerada com nome limpo (se estiver aguardando o score). */
export function dataScoreAtualizado(pessoa: Pessoa, regras: Regras = REGRAS): Date | null {
  const datas = pessoa.cpf.dividas.map((d) => lerDataIso(d.dataPagamento));
  if (!pessoa.cpf.negativado || datas.length === 0 || datas.some((d) => d === null)) return null;
  const ultimo = (datas as Date[]).reduce((a, b) => (a > b ? a : b));
  return somarDias(ultimo, regras.diasAguardarScore);
}

export function paraProponente(pessoa: Pessoa, data: Date, regras: Regras = REGRAS): Proponente {
  const renda = rendaNaData(pessoa, data, regras);
  return {
    id: pessoa.id,
    nome: pessoa.nome,
    idadeMeses: idadeEmMeses(pessoa.dataNascimento, data),
    rendaComprovada: renda.comprovada,
    rendaNaoComprovada: renda.naoComprovada,
    rendaTemporaria: renda.temporaria,
    situacaoCpf: situacaoCpfNaData(pessoa, data, regras),
    compromissosMensais: pessoa.compromissos.reduce((s, c) => s + c.valorMensal, 0),
    fgtsSaldo: pessoa.fgts.saldo,
    fgtsTem3Anos: pessoa.fgts.tem3Anos,
    temImovel: pessoa.temImovel,
  };
}

/** Renda bruta de quem vai morar no imóvel (comprovada ou não) — define a faixa do MCMV. */
export function rendaFamiliarNaData(
  pessoas: Pessoa[],
  data: Date,
  regras: Regras = REGRAS,
): number {
  return pessoas
    .filter((p) => p.vaiMorar)
    .reduce((s, p) => {
      const r = rendaNaData(p, data, regras);
      return s + r.comprovada + r.naoComprovada;
    }, 0);
}

export interface Cenario {
  /** Ids das pessoas, ordenados e unidos — estável entre renderizações. */
  id: string;
  nome: string;
  pessoasIds: string[];
  resultado: ResultadoCenario;
}

export interface OpcoesCenarios {
  /** Parcela mensal extra (ex.: empréstimo para a entrada). */
  compromissosExtras?: number;
  /** Ignora CPF negativado (para mostrar o potencial depois de limpar o nome). */
  ignorarCpf?: boolean;
  regras?: Regras;
}

function combinacoes<T>(lista: T[]): T[][] {
  const resultado: T[][] = lista.map((x) => [x]);
  for (let i = 0; i < lista.length; i++) {
    for (let j = i + 1; j < lista.length; j++) {
      resultado.push([lista[i] as T, lista[j] as T]);
    }
  }
  if (lista.length >= 3) resultado.push([...lista]);
  return resultado;
}

function nomeDoCenario(pessoas: Pessoa[], total: number): string {
  if (pessoas.length === 1) return `${pessoas[0]?.nome} sozinho(a)`;
  if (pessoas.length === total && total >= 3) return "Todos juntos";
  return pessoas.map((p) => p.nome).join(" + ");
}

/** Ordena: viáveis primeiro, depois pelo maior preço máximo (SAC). */
export function ordenarCenarios(cenarios: Cenario[]): Cenario[] {
  return [...cenarios].sort((a, b) => {
    if (a.resultado.viavel !== b.resultado.viavel) return a.resultado.viavel ? -1 : 1;
    return b.resultado.precoMaximo.SAC - a.resultado.precoMaximo.SAC;
  });
}

/** Gera e calcula todos os cenários possíveis com quem pode ser comprador. */
export function gerarCenarios(
  estado: EstadoFamilia,
  data: Date,
  opcoes: OpcoesCenarios = {},
): Cenario[] {
  const regras = opcoes.regras ?? REGRAS;
  const compradores = estado.pessoas.filter((p) => p.podeSerComprador);
  const rendaFamiliar = rendaFamiliarNaData(estado.pessoas, data, regras);
  const recursosProprios = estado.dinheiro.entrada + estado.dinheiro.outrosRecursos;

  const cenarios = combinacoes(compradores).map((grupo): Cenario => {
    const pessoasIds = grupo.map((p) => p.id).sort();
    return {
      id: pessoasIds.join("+"),
      nome: nomeDoCenario(grupo, compradores.length),
      pessoasIds,
      resultado: calcularCenario(
        {
          proponentes: grupo.map((p) => paraProponente(p, data, regras)),
          rendaFamiliar,
          recursosProprios,
          compromissosExtras: opcoes.compromissosExtras,
          ignorarCpf: opcoes.ignorarCpf,
        },
        regras,
      ),
    };
  });
  return ordenarCenarios(cenarios);
}

/** Melhor cenário viável (maior preço máximo) ou null se nenhum for aprovável hoje. */
export function melhorCenario(cenarios: Cenario[]): Cenario | null {
  return cenarios.find((c) => c.resultado.viavel) ?? null;
}

export interface MudancaFutura {
  data: string;
  pessoaId: string;
  descricao: string;
}

/** Mudanças já previstas (fim de contrato, score atualizando) a partir de hoje. */
export function mudancasFuturas(
  estado: EstadoFamilia,
  hojeData: Date,
  regras: Regras = REGRAS,
): MudancaFutura[] {
  const mudancas: MudancaFutura[] = [];
  for (const p of estado.pessoas) {
    const fim = lerDataIso(p.emprego.dataFimPrevista);
    if (fim && diasEntre(hojeData, fim) >= 0 && p.emprego.situacao !== "desempregado") {
      mudancas.push({
        data: p.emprego.dataFimPrevista,
        pessoaId: p.id,
        descricao: `Termina o contrato de ${p.nome}: a renda dela(e) deixa de contar.`,
      });
    }
    if (situacaoCpfNaData(p, hojeData, regras) === "aguardando-score") {
      const quando = dataScoreAtualizado(p, regras);
      if (quando) {
        mudancas.push({
          data: paraDataIso(quando),
          pessoaId: p.id,
          descricao: `Score de ${p.nome} deve estar atualizado: passa a contar como nome limpo.`,
        });
      }
    }
  }
  return mudancas.sort((a, b) => a.data.localeCompare(b.data));
}
