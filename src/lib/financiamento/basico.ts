/**
 * Funções básicas do financiamento: idade, prazo, faixa, seguro e subsídio.
 * Todas puras: mesma entrada → mesma saída. Os números vêm de src/config/regras-mcmv.ts.
 */
import { REGRAS, type FaixaMcmv, type Regras } from "@/config/regras-mcmv";
import { lerDataIso } from "@/lib/datas";

/** Idade em meses completos na data informada. Data de nascimento inválida → 0. */
export function idadeEmMeses(dataNascimento: string, naData: Date): number {
  const nascimento = lerDataIso(dataNascimento);
  if (!nascimento) return 0;
  let meses =
    (naData.getFullYear() - nascimento.getFullYear()) * 12 +
    (naData.getMonth() - nascimento.getMonth());
  if (naData.getDate() < nascimento.getDate()) meses -= 1;
  return Math.max(0, meses);
}

/** Idade em anos completos. */
export function idadeEmAnos(dataNascimento: string, naData: Date): number {
  return Math.floor(idadeEmMeses(dataNascimento, naData) / 12);
}

/**
 * Prazo máximo do financiamento em meses.
 * Regra: idade do proponente MAIS VELHO + prazo ≤ 80 anos e 6 meses, e prazo ≤ 420 meses.
 */
export function prazoMaximoMeses(idadesEmMeses: number[], regras: Regras = REGRAS): number {
  if (idadesEmMeses.length === 0) return 0;
  const maisVelho = Math.max(...idadesEmMeses);
  const pelaIdade = regras.idadeMaximaFinalMeses - maisVelho;
  return Math.max(0, Math.min(regras.prazoMaximoMeses, pelaIdade));
}

/**
 * Enquadra a renda familiar bruta mensal numa faixa do MCMV.
 * Renda exatamente no limite pertence à faixa. Acima da última faixa → null (fora do MCMV).
 */
export function enquadrarFaixa(rendaFamiliar: number, regras: Regras = REGRAS): FaixaMcmv | null {
  const renda = Math.max(0, rendaFamiliar);
  return regras.faixas.find((faixa) => renda <= faixa.rendaMaxima) ?? null;
}

/** Taxa mensal do seguro MIP (fração sobre o saldo devedor) para a idade em anos. */
export function taxaMipMensal(idadeAnos: number, regras: Regras = REGRAS): number {
  const tabela = regras.mipPorIdade;
  const linha = tabela.find((l) => idadeAnos <= l.idadeAte) ?? tabela[tabela.length - 1];
  return linha?.taxaMensal ?? 0;
}

/**
 * Subsídio estimado (desconto do governo). Só faixas com `temSubsidio`.
 * Fórmula isolada aqui de propósito: teto até `rendaParaTetoIntegral`, depois cai em linha reta
 * até zero em `rendaSemSubsidio`. O valor real é definido pela Caixa.
 */
export function estimarSubsidio(
  rendaFamiliar: number,
  faixa: FaixaMcmv | null,
  regras: Regras = REGRAS,
): number {
  if (!faixa || !faixa.temSubsidio) return 0;
  const { teto, rendaParaTetoIntegral, rendaSemSubsidio } = regras.subsidio;
  if (rendaFamiliar <= rendaParaTetoIntegral) return teto;
  if (rendaFamiliar >= rendaSemSubsidio) return 0;
  const fracao = (rendaSemSubsidio - rendaFamiliar) / (rendaSemSubsidio - rendaParaTetoIntegral);
  return Math.round(teto * fracao);
}

/** Meses necessários para juntar `falta` guardando `porMes`. null = nunca (não guarda nada). */
export function mesesParaJuntar(falta: number, porMes: number): number | null {
  if (falta <= 0) return 0;
  if (porMes <= 0) return null;
  return Math.ceil(falta / porMes);
}
