/**
 * Avaliação de um imóvel específico contra um cenário: cabe no orçamento? quanto falta?
 * Também a comparação de repasse e o efeito de um empréstimo.
 */
import { REGRAS, type Regras } from "@/config/regras-mcmv";
import type { ResultadoCenario } from "@/lib/financiamento/capacidade";
import { evolucaoParcelas, primeiraParcela, type Sistema } from "@/lib/financiamento/sistemas";

export type CorOrcamento = "verde" | "amarelo" | "vermelho";

export interface AvaliacaoImovel {
  cor: CorOrcamento;
  preco: number;
  precoMaximo: number;
  /** Quanto o preço passa do máximo (negativo = sobra). */
  diferenca: number;
  /** Quanto o banco financiaria neste imóvel. */
  financiado: number;
  /** Dinheiro que a família precisa pôr (depois de subsídio e FGTS). */
  entradaNecessaria: number;
  /** Quanto falta de entrada, além do que a família já tem. */
  faltaEntrada: number;
  /** Primeira parcela estimada. */
  parcelaEstimada: number;
  /** Renda comprovada que seria necessária para financiar o que falta (0 se já dá). */
  rendaNecessaria: number;
  acimaDoTeto: boolean;
}

export function corDoOrcamento(
  preco: number,
  precoMaximo: number,
  regras: Regras = REGRAS,
): CorOrcamento {
  if (precoMaximo > 0 && preco <= precoMaximo) return "verde";
  if (precoMaximo > 0 && preco <= precoMaximo * (1 + regras.toleranciaAmarelo)) return "amarelo";
  return "vermelho";
}

export function avaliarImovel(
  preco: number,
  cenario: ResultadoCenario,
  sistema: Sistema = "SAC",
  regras: Regras = REGRAS,
): AvaliacaoImovel {
  const precoMaximo = cenario.precoMaximo[sistema];
  const recursosSemDinheiro = cenario.subsidio + cenario.fgts;
  const limiteBanco = preco * cenario.cotaMaximaFinanciamento;
  // Financia o que o banco permite, sem passar do que a parcela comporta nem do que é preciso.
  const precisaFinanciar = Math.max(0, preco - recursosSemDinheiro - cenario.recursosProprios);
  const financiado = Math.min(
    limiteBanco,
    cenario.financiavel[sistema],
    Math.max(precisaFinanciar, 0),
  );
  const entradaNecessaria = Math.max(0, preco - financiado - recursosSemDinheiro);
  const faltaEntrada = Math.max(0, entradaNecessaria - cenario.recursosProprios);
  const parcelaEstimada = primeiraParcela(sistema, financiado, cenario.condicoes);

  // Renda necessária para financiar tudo o que o banco permite (o máximo possível pela cota).
  const idealFinanciar = Math.min(limiteBanco, precisaFinanciar);
  let rendaNecessaria = 0;
  if (idealFinanciar > cenario.financiavel[sistema] && cenario.condicoes.prazoMeses > 0) {
    const parcela = primeiraParcela(sistema, idealFinanciar, cenario.condicoes);
    rendaNecessaria = (parcela + cenario.compromissos) / regras.comprometimentoMaximoRenda;
  }

  return {
    cor: corDoOrcamento(preco, precoMaximo, regras),
    preco,
    precoMaximo,
    diferenca: preco - precoMaximo,
    financiado,
    entradaNecessaria,
    faltaEntrada,
    parcelaEstimada,
    rendaNecessaria,
    acimaDoTeto: preco > cenario.tetoImovel,
  };
}

export interface CustoCompra {
  entrada: number;
  totalParcelas: number;
  custoTotal: number;
  primeiraParcela: number;
}

/** Custo total de comprar um imóvel financiado (entrada + todas as parcelas). */
export function custoCompraFinanciada(
  preco: number,
  cenario: ResultadoCenario,
  sistema: Sistema = "SAC",
): CustoCompra {
  const avaliacao = avaliarImovel(preco, cenario, sistema);
  const evolucao = evolucaoParcelas(sistema, avaliacao.financiado, cenario.condicoes, 0);
  return {
    entrada: avaliacao.entradaNecessaria,
    totalParcelas: evolucao.totalPago,
    custoTotal: avaliacao.entradaNecessaria + evolucao.totalPago,
    primeiraParcela: evolucao.primeiraParcela,
  };
}

export interface DadosRepasse {
  /** Valor pedido pelo vendedor pelo que ele já pagou ("ágio"). */
  agio: number;
  saldoDevedor: number;
  parcelaAtual: number;
  parcelasRestantes: number;
  /** Custos de transferência (cartório, ITBI, taxa do banco). */
  custosTransferencia: number;
}

export interface ResultadoRepasse {
  desembolsoInicial: number;
  totalParcelas: number;
  custoTotal: number;
  /** Valor equivalente do imóvel (ágio + saldo devedor). */
  valorEquivalente: number;
}

/** Custo de assumir um financiamento (repasse) — parcela considerada constante. */
export function custoRepasse(d: DadosRepasse): ResultadoRepasse {
  const desembolsoInicial = Math.max(0, d.agio) + Math.max(0, d.custosTransferencia);
  const totalParcelas = Math.max(0, d.parcelaAtual) * Math.max(0, d.parcelasRestantes);
  return {
    desembolsoInicial,
    totalParcelas,
    custoTotal: desembolsoInicial + totalParcelas,
    valorEquivalente: Math.max(0, d.agio) + Math.max(0, d.saldoDevedor),
  };
}
