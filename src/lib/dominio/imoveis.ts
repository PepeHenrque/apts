/**
 * Imóveis salvos: avaliação contra o orçamento, distâncias, alertas de preferência e leitura
 * simples de texto de anúncio colado (sem IA).
 */
import type { Cenario } from "@/lib/dominio/cenarios";
import type { Diagnostico } from "@/lib/dominio/diagnostico";
import type { Imovel, Preferencias } from "@/lib/dominio/esquemas";
import { coordenadasDe, distanciaKm } from "@/lib/geo/distancia";
import {
  avaliarImovel,
  custoRepasse,
  type AvaliacaoImovel,
  type ResultadoRepasse,
} from "@/lib/financiamento/orcamento";
import { lerNumero } from "@/lib/formatar";

export interface ImovelAvaliado {
  imovel: Imovel;
  /** null quando nenhum cenário existe (ninguém com renda). */
  avaliacao: AvaliacaoImovel | null;
  cenario: Cenario | null;
  /** true = comparado com o cenário "depois de limpar o nome" (nenhum aprovável hoje). */
  ehPotencial: boolean;
  distanciaCasaKm: number | null;
  distanciasPontos: { nome: string; km: number }[];
  /** Parcela + condomínio + IPTU/12. */
  custoMensal: number;
  alertas: string[];
  repasse: ResultadoRepasse | null;
}

export function avaliarImovelSalvo(
  imovel: Imovel,
  diagnostico: Pick<Diagnostico, "melhor" | "potencial">,
  preferencias: Preferencias,
): ImovelAvaliado {
  const cenario = diagnostico.melhor ?? diagnostico.potencial;
  const avaliacao = cenario ? avaliarImovel(imovel.preco, cenario.resultado) : null;
  const local = coordenadasDe(imovel);
  const casa = coordenadasDe(preferencias.casaAtual);
  const distanciaCasaKm = local && casa ? distanciaKm(casa, local) : null;
  const distanciasPontos = preferencias.pontosImportantes.flatMap((p) => {
    const c = coordenadasDe(p);
    return c && local ? [{ nome: p.nome, km: distanciaKm(c, local) }] : [];
  });

  const alertas: string[] = [];
  if (imovel.aceitaFinanciamento === "nao")
    alertas.push("O anúncio diz que NÃO aceita financiamento.");
  if (imovel.aceitaFinanciamento === "nao-sei") alertas.push("Confirme se aceita financiamento.");
  if (
    preferencias.quartosMin > 0 &&
    imovel.quartos > 0 &&
    imovel.quartos < preferencias.quartosMin
  ) {
    alertas.push(
      `Tem ${imovel.quartos} quarto(s); vocês querem pelo menos ${preferencias.quartosMin}.`,
    );
  }
  if (preferencias.condominioMax > 0 && imovel.condominio > preferencias.condominioMax) {
    alertas.push("Condomínio acima do máximo que vocês definiram.");
  }
  if (
    preferencias.distanciaMaxKm > 0 &&
    distanciaCasaKm !== null &&
    distanciaCasaKm > preferencias.distanciaMaxKm
  ) {
    alertas.push(`Fica a mais de ${preferencias.distanciaMaxKm} km da casa atual.`);
  }
  if (avaliacao?.acimaDoTeto) alertas.push("Preço acima do limite do programa nesta faixa.");
  if (imovel.ehRepasse) {
    alertas.push("Repasse: exija transferência formal no banco (precisa de aprovação de crédito).");
  }

  const custoMensal = (avaliacao?.parcelaEstimada ?? 0) + imovel.condominio + imovel.iptu / 12;

  const repasse = imovel.ehRepasse
    ? custoRepasse({
        agio: imovel.repasse.agio,
        saldoDevedor: imovel.repasse.saldoDevedor,
        parcelaAtual: imovel.repasse.parcela,
        parcelasRestantes: imovel.repasse.parcelasRestantes,
        custosTransferencia: 0,
      })
    : null;

  return {
    imovel,
    avaliacao,
    cenario,
    ehPotencial: !diagnostico.melhor && !!diagnostico.potencial,
    distanciaCasaKm,
    distanciasPontos,
    custoMensal,
    alertas,
    repasse,
  };
}

export type Ordenacao = "recentes" | "preco" | "distancia" | "orcamento";
const PESO_COR = { verde: 0, amarelo: 1, vermelho: 2 } as const;

export function ordenarImoveis(lista: ImovelAvaliado[], ordem: Ordenacao): ImovelAvaliado[] {
  const copia = [...lista];
  switch (ordem) {
    case "preco":
      return copia.sort((a, b) => a.imovel.preco - b.imovel.preco);
    case "distancia":
      return copia.sort(
        (a, b) => (a.distanciaCasaKm ?? Infinity) - (b.distanciaCasaKm ?? Infinity),
      );
    case "orcamento":
      return copia.sort(
        (a, b) =>
          PESO_COR[a.avaliacao?.cor ?? "vermelho"] - PESO_COR[b.avaliacao?.cor ?? "vermelho"] ||
          a.imovel.preco - b.imovel.preco,
      );
    case "recentes":
      return copia.sort((a, b) => b.imovel.criadoEm.localeCompare(a.imovel.criadoEm));
  }
}

export interface DadosExtraidos {
  preco?: number;
  quartos?: number;
  banheiros?: number;
  vagas?: number;
  area?: number;
  condominio?: number;
  iptu?: number;
  link?: string;
}

function numeroApos(texto: string, padrao: RegExp): number | undefined {
  const m = padrao.exec(texto);
  return m?.[1] ? (lerNumero(m[1]) ?? undefined) : undefined;
}

/**
 * Tenta tirar números de um texto de anúncio colado (sem IA). Ex.: "Apto 2 quartos, 45m²,
 * R$ 139.900, condomínio R$ 250". O usuário sempre revisa antes de salvar.
 */
export function extrairDoTexto(texto: string): DadosExtraidos {
  const t = texto.replace(/ /g, " ");
  const resultado: DadosExtraidos = {
    condominio: numeroApos(t, /condom[ií]nio[^\dR]{0,15}R?\$?\s*([\d.,]+)/i),
    iptu: numeroApos(t, /iptu[^\dR]{0,15}R?\$?\s*([\d.,]+)/i),
    quartos: numeroApos(t, /(\d+)\s*(?:quartos?|dormit[óo]rios?|dorms?\b)/i),
    banheiros: numeroApos(t, /(\d+)\s*(?:banheiros?|wc)\b/i),
    vagas: numeroApos(t, /(\d+)\s*vagas?/i),
    area: numeroApos(t, /([\d.,]+)\s*m(?:²|2(?!\d))/i),
    link: /https?:\/\/\S+/i.exec(t)?.[0],
  };
  // Preço: o maior valor em reais que não seja condomínio/IPTU.
  const valores = [...t.matchAll(/R\$\s*([\d.]+(?:,\d{2})?)/gi)]
    .map((m) => lerNumero(m[1] ?? "") ?? 0)
    .filter((v) => v !== resultado.condominio && v !== resultado.iptu);
  const maior = Math.max(0, ...valores);
  if (maior >= 10000) resultado.preco = maior;
  return Object.fromEntries(
    Object.entries(resultado).filter(([, v]) => v !== undefined && v !== 0),
  ) as DadosExtraidos;
}
