/**
 * Sistemas de amortização SAC e Price.
 *
 * Parcela = amortização + juros + seguro MIP (sobre o saldo) + taxa de administração.
 * - SAC: amortização constante; a 1ª parcela é a MAIOR, por isso é ela que precisa caber na renda.
 * - Price: amortização+juros constante; financia mais com a mesma parcela inicial,
 *   mas paga mais juros no total.
 */

export type Sistema = "SAC" | "PRICE";

export interface CondicoesFinanciamento {
  /** Número de parcelas (meses). */
  prazoMeses: number;
  /** Juros mensais (fração). */
  taxaMensal: number;
  /** Seguro MIP mensal (fração sobre o saldo). */
  taxaMip: number;
  /** Taxa de administração mensal (R$). */
  taxaAdministracao: number;
}

/** Juros mensais a partir dos juros nominais anuais (como a Caixa divulga). */
export function taxaMensalDeNominalAnual(jurosNominalAnual: number): number {
  return jurosNominalAnual / 12;
}

/** Fator Price: parcela de amortização+juros por real financiado. */
export function fatorPrice(taxaMensal: number, prazoMeses: number): number {
  if (prazoMeses <= 0) return 0;
  if (taxaMensal === 0) return 1 / prazoMeses;
  return taxaMensal / (1 - Math.pow(1 + taxaMensal, -prazoMeses));
}

/** Primeira parcela (a maior no SAC). */
export function primeiraParcela(
  sistema: Sistema,
  valor: number,
  c: CondicoesFinanciamento,
): number {
  if (valor <= 0 || c.prazoMeses <= 0) return 0;
  const amortizacaoMaisJuros =
    sistema === "SAC"
      ? valor / c.prazoMeses + valor * c.taxaMensal
      : valor * fatorPrice(c.taxaMensal, c.prazoMeses);
  return amortizacaoMaisJuros + valor * c.taxaMip + c.taxaAdministracao;
}

/** Maior valor financiável cuja PRIMEIRA parcela cabe em `parcelaDisponivel`. */
export function valorFinanciavel(
  sistema: Sistema,
  parcelaDisponivel: number,
  c: CondicoesFinanciamento,
): number {
  const livre = parcelaDisponivel - c.taxaAdministracao;
  if (livre <= 0 || c.prazoMeses <= 0) return 0;
  const porReal =
    sistema === "SAC"
      ? 1 / c.prazoMeses + c.taxaMensal + c.taxaMip
      : fatorPrice(c.taxaMensal, c.prazoMeses) + c.taxaMip;
  return livre / porReal;
}

export interface LinhaEvolucao {
  mes: number;
  parcela: number;
  amortizacao: number;
  juros: number;
  seguro: number;
  taxa: number;
  saldoDepois: number;
}

export interface EvolucaoParcelas {
  /** Primeiros meses (para mostrar na tabela). */
  linhas: LinhaEvolucao[];
  primeiraParcela: number;
  ultimaParcela: number;
  totalPago: number;
  totalJuros: number;
}

/**
 * Evolução das parcelas mês a mês. O seguro MIP é calculado sobre o saldo de cada mês com taxa
 * fixa (na prática a taxa também sobe com a idade — simplificação documentada).
 */
export function evolucaoParcelas(
  sistema: Sistema,
  valor: number,
  c: CondicoesFinanciamento,
  mesesParaMostrar = 12,
): EvolucaoParcelas {
  const linhas: LinhaEvolucao[] = [];
  let saldo = valor;
  let totalPago = 0;
  let totalJuros = 0;
  let primeira = 0;
  let ultima = 0;
  const amortizacaoSac = c.prazoMeses > 0 ? valor / c.prazoMeses : 0;
  const prestacaoPrice = valor * fatorPrice(c.taxaMensal, c.prazoMeses);

  for (let mes = 1; mes <= c.prazoMeses && saldo > 0.005; mes++) {
    const juros = saldo * c.taxaMensal;
    const amortizacao = Math.min(
      saldo,
      sistema === "SAC" ? amortizacaoSac : prestacaoPrice - juros,
    );
    const seguro = saldo * c.taxaMip;
    const parcela = amortizacao + juros + seguro + c.taxaAdministracao;
    saldo -= amortizacao;
    totalPago += parcela;
    totalJuros += juros;
    if (mes === 1) primeira = parcela;
    ultima = parcela;
    if (mes <= mesesParaMostrar) {
      linhas.push({
        mes,
        parcela,
        amortizacao,
        juros,
        seguro,
        taxa: c.taxaAdministracao,
        saldoDepois: Math.max(0, saldo),
      });
    }
  }
  return { linhas, primeiraParcela: primeira, ultimaParcela: ultima, totalPago, totalJuros };
}

/** Parcela de um empréstimo comum (tabela Price, sem seguro/taxa). */
export function parcelaEmprestimo(valor: number, taxaMensal: number, parcelas: number): number {
  if (valor <= 0 || parcelas <= 0) return 0;
  return valor * fatorPrice(taxaMensal, parcelas);
}
