/**
 * Capacidade de compra de um grupo de compradores (um "cenário").
 * Responde: quanto dá para financiar, qual o preço máximo do imóvel e o que impede a aprovação.
 */
import { REGRAS, type FaixaMcmv, type Regras } from "@/config/regras-mcmv";
import {
  enquadrarFaixa,
  estimarSubsidio,
  prazoMaximoMeses,
  taxaMipMensal,
} from "@/lib/financiamento/basico";
import {
  taxaMensalDeNominalAnual,
  valorFinanciavel,
  type CondicoesFinanciamento,
  type Sistema,
} from "@/lib/financiamento/sistemas";

/** Um comprador (proponente) já com os números calculados para a data da simulação. */
export interface Proponente {
  id: string;
  nome: string;
  idadeMeses: number;
  /** Renda bruta mensal que o banco aceita (CLT, aposentadoria, MEI...). */
  rendaComprovada: number;
  /** Renda que existe mas o banco não aceita (informal, estágio...). */
  rendaNaoComprovada: number;
  /** Renda vem de contrato temporário (ex.: jovem aprendiz). */
  rendaTemporaria: boolean;
  situacaoCpf: "limpo" | "negativado" | "aguardando-score";
  /** Empréstimos, cartão, consignado etc. já pagos todo mês. */
  compromissosMensais: number;
  fgtsSaldo: number;
  fgtsTem3Anos: boolean;
  temImovel: boolean;
}

export interface EntradaCenario {
  proponentes: Proponente[];
  /** Renda bruta de TODA a família que vai morar no imóvel (define a faixa e o subsídio). */
  rendaFamiliar: number;
  /** Dinheiro da família para a entrada (poupança + outros recursos). */
  recursosProprios: number;
  /** Parcela extra que vai existir (ex.: empréstimo para a entrada). */
  compromissosExtras?: number;
  /** Ignora restrições de CPF (para mostrar "quanto daria se limpar o nome"). */
  ignorarCpf?: boolean;
}

export type CodigoImpedimento =
  | "sem-compradores"
  | "cpf-negativado"
  | "aguardando-score"
  | "sem-renda"
  | "idade"
  | "parcela-insuficiente";

export interface Impedimento {
  codigo: CodigoImpedimento;
  mensagem: string;
  /** Quem causa o impedimento (se for de uma pessoa). */
  pessoaId?: string;
}

export interface ResultadoCenario {
  viavel: boolean;
  impedimentos: Impedimento[];
  avisos: string[];

  faixa: FaixaMcmv | null;
  nomeFaixa: string;
  dentroDoMcmv: boolean;
  jurosNominalAnual: number;
  jurosDivulgados: string;

  rendaFamiliar: number;
  rendaComprovada: number;
  compromissos: number;
  idadeMaisVelhoMeses: number;
  prazoMeses: number;

  /** 30% da renda comprovada menos compromissos. */
  parcelaMaxima: number;
  condicoes: CondicoesFinanciamento;
  financiavel: Record<Sistema, number>;

  subsidio: number;
  fgts: number;
  recursosProprios: number;
  cotaMaximaFinanciamento: number;
  tetoImovel: number;

  precoMaximo: Record<Sistema, number>;
  /** O que limita o preço no SAC. */
  limitadoPor: "parcela" | "entrada" | "teto";
}

/** Preço máximo dado o valor financiável e os recursos (subsídio + FGTS + dinheiro). */
function calcularPrecoMaximo(
  financiavel: number,
  recursos: number,
  cota: number,
  teto: number,
): { preco: number; limitadoPor: ResultadoCenario["limitadoPor"] } {
  const pelaParcela = financiavel + recursos;
  // O banco financia no máximo `cota` do imóvel; o resto precisa vir dos recursos.
  const pelaEntrada = cota < 1 ? recursos / (1 - cota) : Number.POSITIVE_INFINITY;
  const preco = Math.max(0, Math.min(pelaParcela, pelaEntrada, teto));
  const limitadoPor =
    preco === teto
      ? "teto"
      : preco === pelaEntrada && pelaEntrada < pelaParcela
        ? "entrada"
        : "parcela";
  return { preco, limitadoPor };
}

export function calcularCenario(
  entrada: EntradaCenario,
  regras: Regras = REGRAS,
): ResultadoCenario {
  const { proponentes } = entrada;
  const impedimentos: Impedimento[] = [];
  const avisos: string[] = [];

  if (proponentes.length === 0) {
    impedimentos.push({ codigo: "sem-compradores", mensagem: "Nenhum comprador escolhido." });
  }

  // --- Faixa (pela renda de toda a família) e regras do MCMV ---
  const algumTemImovel = proponentes.some((p) => p.temImovel);
  const faixaPelaRenda = enquadrarFaixa(entrada.rendaFamiliar, regras);
  const faixa = algumTemImovel ? null : faixaPelaRenda;
  if (algumTemImovel) {
    avisos.push(
      "Quem já tem imóvel no nome não pode usar o Minha Casa Minha Vida: a simulação usa o financiamento comum (juros maiores, sem subsídio).",
    );
  } else if (!faixaPelaRenda) {
    avisos.push(
      "A renda da família passa do limite do MCMV: a simulação usa o financiamento comum.",
    );
  }
  const fora = regras.foraDoMcmv;
  const jurosNominalAnual = faixa?.jurosNominalAnual ?? fora.jurosNominalAnual;
  const cota = faixa?.cotaMaximaFinanciamento ?? fora.cotaMaximaFinanciamento;
  const tetoImovel = faixa?.tetoImovel ?? fora.tetoImovel;

  // --- Cada comprador ---
  for (const p of proponentes) {
    if (!entrada.ignorarCpf && p.situacaoCpf === "negativado") {
      impedimentos.push({
        codigo: "cpf-negativado",
        pessoaId: p.id,
        mensagem: `${p.nome} está com o CPF negativado (nome sujo). O banco não aprova enquanto isso não for resolvido.`,
      });
    }
    if (!entrada.ignorarCpf && p.situacaoCpf === "aguardando-score") {
      impedimentos.push({
        codigo: "aguardando-score",
        pessoaId: p.id,
        mensagem: `${p.nome} já pagou as dívidas, mas o score (pontuação de crédito) ainda pode estar baixo. Espere a atualização antes de pedir o crédito.`,
      });
    }
    if (p.rendaComprovada <= 0 && proponentes.length > 1) {
      avisos.push(
        `${p.nome} não tem renda comprovada: não ajuda na parcela, mas a idade conta para o prazo.`,
      );
    }
    if (p.rendaNaoComprovada > 0) {
      avisos.push(
        `A renda de ${p.nome} não é comprovada (informal/estágio) e não entra no cálculo do banco.`,
      );
    }
    if (p.rendaTemporaria && p.rendaComprovada > 0) {
      avisos.push(
        `A renda de ${p.nome} vem de contrato temporário: o banco pode não aceitar ou pedir mais garantias.`,
      );
    }
  }

  const rendaComprovada = proponentes.reduce((s, p) => s + p.rendaComprovada, 0);
  if (proponentes.length > 0 && rendaComprovada <= 0) {
    impedimentos.push({
      codigo: "sem-renda",
      mensagem:
        proponentes.length === 1
          ? `${proponentes[0]?.nome} não tem renda comprovada e não pode ser o comprador sozinho.`
          : "Ninguém neste grupo tem renda comprovada.",
    });
  }

  // --- Prazo pela idade do mais velho ---
  const idades = proponentes.map((p) => p.idadeMeses);
  const idadeMaisVelhoMeses = idades.length ? Math.max(...idades) : 0;
  const prazoMeses = prazoMaximoMeses(idades, regras);
  if (proponentes.length > 0 && prazoMeses < regras.prazoMinimoMeses) {
    impedimentos.push({
      codigo: "idade",
      mensagem: `Pela idade do comprador mais velho, o prazo seria de só ${prazoMeses} meses — curto demais para financiar.`,
    });
  }

  // --- Parcela máxima ---
  const compromissos =
    proponentes.reduce((s, p) => s + p.compromissosMensais, 0) + (entrada.compromissosExtras ?? 0);
  const parcelaMaxima = Math.max(
    0,
    rendaComprovada * regras.comprometimentoMaximoRenda - compromissos,
  );

  const condicoes: CondicoesFinanciamento = {
    prazoMeses,
    taxaMensal: taxaMensalDeNominalAnual(jurosNominalAnual),
    taxaMip: taxaMipMensal(Math.floor(idadeMaisVelhoMeses / 12), regras),
    taxaAdministracao: regras.taxaAdministracaoMensal,
  };
  const financiavel: Record<Sistema, number> = {
    SAC: valorFinanciavel("SAC", parcelaMaxima, condicoes),
    PRICE: valorFinanciavel("PRICE", parcelaMaxima, condicoes),
  };
  if (rendaComprovada > 0 && financiavel.SAC <= 0) {
    impedimentos.push({
      codigo: "parcela-insuficiente",
      mensagem:
        "Depois de descontar os outros compromissos mensais, não sobra parcela possível para o financiamento.",
    });
  }

  // --- Recursos: subsídio, FGTS e dinheiro da família ---
  const subsidio = estimarSubsidio(entrada.rendaFamiliar, faixa, regras);
  const fgts = proponentes.filter((p) => p.fgtsTem3Anos).reduce((s, p) => s + p.fgtsSaldo, 0);
  const fgtsSemDireito = proponentes.filter((p) => !p.fgtsTem3Anos && p.fgtsSaldo > 0);
  for (const p of fgtsSemDireito) {
    avisos.push(
      `O FGTS de ${p.nome} não entra porque ainda não tem ${regras.fgtsAnosMinimos} anos de trabalho com FGTS.`,
    );
  }
  const recursosProprios = Math.max(0, entrada.recursosProprios);
  const recursos = subsidio + fgts + recursosProprios;

  const sac = calcularPrecoMaximo(financiavel.SAC, recursos, cota, tetoImovel);
  const price = calcularPrecoMaximo(financiavel.PRICE, recursos, cota, tetoImovel);

  return {
    viavel: impedimentos.length === 0,
    impedimentos,
    avisos,
    faixa,
    nomeFaixa: faixa?.nome ?? fora.nome,
    dentroDoMcmv: faixa !== null,
    jurosNominalAnual,
    jurosDivulgados: faixa?.jurosDivulgados ?? fora.jurosDivulgados,
    rendaFamiliar: entrada.rendaFamiliar,
    rendaComprovada,
    compromissos,
    idadeMaisVelhoMeses,
    prazoMeses,
    parcelaMaxima,
    condicoes,
    financiavel,
    subsidio,
    fgts,
    recursosProprios,
    cotaMaximaFinanciamento: cota,
    tetoImovel,
    precoMaximo: { SAC: sac.preco, PRICE: price.preco },
    limitadoPor: sac.limitadoPor,
  };
}
