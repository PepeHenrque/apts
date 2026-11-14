/**
 * REGRAS DO MINHA CASA MINHA VIDA (MCMV) E DO FINANCIAMENTO CAIXA
 * ================================================================
 *
 * TODOS os números usados nos cálculos ficam aqui. Para atualizar uma regra, mude só este arquivo
 * (a lógica em src/lib/financiamento/ não precisa mudar) e rode `npm test`.
 *
 * Data de referência: 22/04/2026 (início da vigência das regras atuais do MCMV).
 *
 * Fontes consultadas em 14/11/2026:
 * - Portaria MCID nº 333/2026 (limites de renda das faixas urbanas, vigente desde 22/04/2026),
 *   noticiada pela Agência Gov: https://agenciagov.ebc.com.br/noticias/202604/portaria-atualiza-limites-renda-minha-casa-minha-vida
 * - Agência Gov, "MCMV terá aumento dos limites de faixas e de valor dos imóveis":
 *   https://agenciagov.ebc.com.br/noticias/202603/mcmv-tera-aumento-dos-limites-de-faixas-e-de-valor-dos-imoveis
 * - Caixa, perguntas frequentes de financiamento (prazo de até 420 meses):
 *   https://www.caixa.gov.br/voce/habitacao/financiamento/perguntas-frequentes/
 *
 * Valores marcados com "A CONFIRMAR" não têm fonte oficial clara ou variam por cidade/caso.
 * São estimativas razoáveis; confirme com a Caixa ou um correspondente bancário e ajuste aqui.
 */

export type IdFaixa = "F1" | "F2" | "F3" | "F4";

export interface FaixaMcmv {
  id: IdFaixa;
  nome: string;
  /** Renda familiar bruta mensal máxima (inclusive: renda exatamente igual pertence à faixa). */
  rendaMaxima: number;
  /** Juros nominais ao ano usados na simulação (fração: 0.045 = 4,5% a.a.). */
  jurosNominalAnual: number;
  /** Faixa de juros divulgada, só para exibir ao usuário. */
  jurosDivulgados: string;
  /** Valor máximo do imóvel nesta faixa (varia por cidade). */
  tetoImovel: number;
  /** Se a faixa recebe subsídio (desconto do governo). */
  temSubsidio: boolean;
  /** Parte máxima do valor do imóvel que o banco financia (0.8 = 80%). */
  cotaMaximaFinanciamento: number;
}

export interface FaixaMip {
  /** Idade (anos completos) máxima desta linha da tabela. */
  idadeAte: number;
  /** Taxa MENSAL do seguro MIP sobre o saldo devedor (fração: 0.001 = 0,1% ao mês). */
  taxaMensal: number;
}

export const REGRAS: Regras = {
  dataReferencia: "2026-04-22",

  /** Faixas urbanas do MCMV, em ordem crescente de renda. */
  faixas: [
    {
      id: "F1",
      nome: "Faixa 1",
      rendaMaxima: 3200, // Portaria MCID 333/2026
      jurosNominalAnual: 0.045, // A CONFIRMAR: divulgado entre 4,00% e 5,25% conforme renda/região
      jurosDivulgados: "4,00% a 5,25% ao ano",
      tetoImovel: 275_000, // A CONFIRMAR: varia por porte do município
      temSubsidio: true,
      cotaMaximaFinanciamento: 0.8, // A CONFIRMAR
    },
    {
      id: "F2",
      nome: "Faixa 2",
      rendaMaxima: 5000, // Portaria MCID 333/2026
      jurosNominalAnual: 0.06, // A CONFIRMAR: divulgado entre 4,75% e 7,00%
      jurosDivulgados: "4,75% a 7,00% ao ano",
      tetoImovel: 275_000, // A CONFIRMAR: varia por porte do município
      temSubsidio: true,
      cotaMaximaFinanciamento: 0.8, // A CONFIRMAR
    },
    {
      id: "F3",
      nome: "Faixa 3",
      rendaMaxima: 9600, // Portaria MCID 333/2026
      jurosNominalAnual: 0.0816, // divulgado entre 7,66% e 8,16% (usamos o maior, mais conservador)
      jurosDivulgados: "7,66% a 8,16% ao ano",
      tetoImovel: 400_000, // regras de abril/2026
      temSubsidio: false,
      cotaMaximaFinanciamento: 0.8, // A CONFIRMAR
    },
    {
      id: "F4",
      nome: "Faixa 4",
      rendaMaxima: 13000, // Portaria MCID 333/2026
      jurosNominalAnual: 0.105, // A CONFIRMAR: divulgado "cerca de 10%"
      jurosDivulgados: "cerca de 10% ao ano",
      tetoImovel: 600_000, // regras de abril/2026
      temSubsidio: false,
      cotaMaximaFinanciamento: 0.8, // A CONFIRMAR
    },
  ],

  /** Financiamento comum (SBPE), usado quando a família não se enquadra no MCMV. A CONFIRMAR. */
  foraDoMcmv: {
    nome: "Fora do MCMV (financiamento comum)",
    jurosNominalAnual: 0.1149,
    jurosDivulgados: "cerca de 11,5% ao ano",
    tetoImovel: 1_500_000,
    cotaMaximaFinanciamento: 0.8,
  },

  /**
   * Subsídio (desconto do governo) das Faixas 1 e 2.
   * O valor real depende de cidade, renda e imóvel; aqui é uma ESTIMATIVA linear:
   * - renda familiar até `rendaParaTetoIntegral` → recebe o teto;
   * - cai em linha reta até zero quando a renda chega em `rendaSemSubsidio`.
   * A CONFIRMAR (teto de R$ 55.000 é o divulgado; a curva é uma aproximação).
   */
  subsidio: {
    teto: 55_000,
    rendaParaTetoIntegral: 2_000,
    rendaSemSubsidio: 5_000,
  },

  /** Idade do proponente mais velho + prazo não pode passar de 80 anos e 6 meses. */
  idadeMaximaFinalMeses: 80 * 12 + 6,
  /** Prazo máximo do financiamento (35 anos). */
  prazoMaximoMeses: 420,
  /** Abaixo deste prazo consideramos o financiamento inviável pela idade. A CONFIRMAR. */
  prazoMinimoMeses: 60,

  /** A parcela pode comprometer no máximo esta fração da renda bruta comprovada. */
  comprometimentoMaximoRenda: 0.3,

  /** Taxa de administração mensal cobrada na parcela (R$). A CONFIRMAR. */
  taxaAdministracaoMensal: 25,

  /**
   * Seguro MIP (morte e invalidez permanente): taxa mensal sobre o saldo devedor, por idade.
   * Cresce com a idade. A CONFIRMAR — valores aproximados; a tabela real é da seguradora.
   */
  mipPorIdade: [
    { idadeAte: 30, taxaMensal: 0.0001 },
    { idadeAte: 35, taxaMensal: 0.00012 },
    { idadeAte: 40, taxaMensal: 0.00016 },
    { idadeAte: 45, taxaMensal: 0.00022 },
    { idadeAte: 50, taxaMensal: 0.00032 },
    { idadeAte: 55, taxaMensal: 0.00048 },
    { idadeAte: 60, taxaMensal: 0.00075 },
    { idadeAte: 65, taxaMensal: 0.00115 },
    { idadeAte: 70, taxaMensal: 0.00175 },
    { idadeAte: 75, taxaMensal: 0.0027 },
    { idadeAte: 81, taxaMensal: 0.004 },
  ],

  /** FGTS só entra na compra com pelo menos este tempo de trabalho sob regime do FGTS. */
  fgtsAnosMinimos: 3,

  /** Depois de pagar todas as dívidas, quantos dias esperamos o score atualizar. A CONFIRMAR. */
  diasAguardarScore: 30,

  /** Situações de trabalho cuja renda o banco aceita como comprovada. */
  situacoesRendaComprovada: ["clt", "aposentado", "mei", "jovem-aprendiz"],
  /** Situações com contrato temporário: a renda conta, mas o banco pode recusar. A CONFIRMAR. */
  situacoesRendaTemporaria: ["jovem-aprendiz"],

  /** Imóvel "amarelo" = até esta fração acima do preço máximo (0.1 = 10%). */
  toleranciaAmarelo: 0.1,
};

export type SituacaoEmprego =
  | "clt"
  | "aposentado"
  | "mei"
  | "autonomo-informal"
  | "jovem-aprendiz"
  | "estagio"
  | "desempregado";

export interface Regras {
  dataReferencia: string;
  faixas: FaixaMcmv[];
  foraDoMcmv: {
    nome: string;
    jurosNominalAnual: number;
    jurosDivulgados: string;
    tetoImovel: number;
    cotaMaximaFinanciamento: number;
  };
  subsidio: { teto: number; rendaParaTetoIntegral: number; rendaSemSubsidio: number };
  idadeMaximaFinalMeses: number;
  prazoMaximoMeses: number;
  prazoMinimoMeses: number;
  comprometimentoMaximoRenda: number;
  taxaAdministracaoMensal: number;
  mipPorIdade: FaixaMip[];
  fgtsAnosMinimos: number;
  diasAguardarScore: number;
  situacoesRendaComprovada: SituacaoEmprego[];
  situacoesRendaTemporaria: SituacaoEmprego[];
  toleranciaAmarelo: number;
}
