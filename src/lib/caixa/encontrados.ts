/**
 * Filtra os imóveis da Caixa pelas preferências da família e pelo orçamento (tela "Encontrados").
 */
import type { ImovelCaixa } from "@/lib/caixa/parser";
import { diasEntre, lerDataIso } from "@/lib/datas";
import type { Imovel, Preferencias } from "@/lib/dominio/esquemas";
import { distanciaKm, type Coordenadas } from "@/lib/geo/distancia";

export interface ArquivoCaixa {
  uf: string;
  baseDesde: string;
  dataDaLista: string | null;
  atualizadoEm: string;
  imoveis: ImovelCaixa[];
  novos: string[];
  removidos: { id: string; saiuEm: string; cidade: string; preco: number }[];
}

export interface StatusRobo {
  atualizadoEm: string;
  sucesso: boolean;
  ufs: string[];
  porUf: Record<
    string,
    { total: number; novos: number; removidos: number; comLocalizacao: number; erro?: string }
  >;
  erros: string[];
}

export interface FiltroEncontrados {
  /** Preço máximo do melhor cenário (null = sem limite). */
  precoMaximo: number | null;
  /** Mostrar também até 10% acima do preço máximo (faixa amarela). */
  incluirAmarelo: boolean;
  /** Nomes de cidades/bairros desejados (vazio = qualquer lugar do estado). */
  lugares: string[];
  tipo: Preferencias["tipo"];
  quartosMin: number;
  soFinanciamento: boolean;
  casa: Coordenadas | null;
  distanciaMaxKm: number;
}

export interface Encontrado {
  imovel: ImovelCaixa;
  novo: boolean;
  distanciaKm: number | null;
}

/** "São José" → "sao jose" (a lista da Caixa vem sem acentos). */
export function normalizarLugar(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

const TIPOS_ACEITOS: Record<Preferencias["tipo"], ImovelCaixa["tipo"][]> = {
  qualquer: ["apartamento", "casa", "sobrado"],
  apartamento: ["apartamento"],
  casa: ["casa", "sobrado"],
  "casa-condominio": ["casa", "sobrado"],
  sobrado: ["sobrado", "casa"],
  terreno: ["terreno"],
};

export function ehNovo(i: ImovelCaixa, baseDesde: string, hoje: Date): boolean {
  const visto = lerDataIso(i.vistoDesde);
  return i.vistoDesde > baseDesde && visto !== null && diasEntre(visto, hoje) <= 7;
}

export function filtrarEncontrados(
  arquivo: Pick<ArquivoCaixa, "imoveis" | "baseDesde">,
  f: FiltroEncontrados,
  hoje: Date,
): Encontrado[] {
  const lugares = f.lugares.map(normalizarLugar).filter(Boolean);
  const tipos = TIPOS_ACEITOS[f.tipo];
  const teto = f.precoMaximo === null ? Infinity : f.precoMaximo * (f.incluirAmarelo ? 1.1 : 1);

  const resultado: Encontrado[] = [];
  for (const i of arquivo.imoveis) {
    if (i.preco > teto) continue;
    if (f.soFinanciamento && !i.aceitaFinanciamento) continue;
    if (!tipos.includes(i.tipo)) continue;
    if (f.quartosMin > 0 && i.quartos !== null && i.quartos < f.quartosMin) continue;
    if (
      lugares.length > 0 &&
      !lugares.includes(normalizarLugar(i.cidade)) &&
      !lugares.includes(normalizarLugar(i.bairro))
    ) {
      continue;
    }
    const distancia =
      f.casa && i.lat !== null && i.lon !== null
        ? distanciaKm(f.casa, { lat: i.lat, lon: i.lon })
        : null;
    if (f.distanciaMaxKm > 0 && distancia !== null && distancia > f.distanciaMaxKm) continue;
    resultado.push({ imovel: i, novo: ehNovo(i, arquivo.baseDesde, hoje), distanciaKm: distancia });
  }
  return resultado.sort(
    (a, b) => Number(b.novo) - Number(a.novo) || a.imovel.preco - b.imovel.preco,
  );
}

/** Converte um imóvel da Caixa num "imóvel salvo" da família (o usuário pode editar depois). */
export function paraImovelSalvo(
  i: ImovelCaixa,
  id: string,
  quem: string,
  agoraIso: string,
): Imovel {
  const tipo: Imovel["tipo"] =
    i.tipo === "apartamento" || i.tipo === "casa" || i.tipo === "sobrado" || i.tipo === "terreno"
      ? i.tipo
      : "qualquer";
  const titulo = [
    {
      apartamento: "Apartamento",
      casa: "Casa",
      sobrado: "Sobrado",
      terreno: "Terreno",
      comercial: "Imóvel comercial",
      outro: "Imóvel",
    }[i.tipo],
    i.quartos ? `${i.quartos} quarto(s)` : "",
    i.bairro ? `— ${i.bairro}` : "",
    "(Caixa)",
  ]
    .filter(Boolean)
    .join(" ");
  return {
    id,
    titulo,
    link: i.link,
    preco: Math.round(i.preco * 100) / 100,
    tipo,
    quartos: i.quartos ?? 0,
    banheiros: 0,
    vagas: 0,
    area: i.area ?? 0,
    endereco: i.endereco,
    bairro: i.bairro,
    cidade: `${i.cidade} - ${i.uf}`,
    lat: i.lat,
    lon: i.lon,
    condominio: 0,
    iptu: 0,
    aceitaFinanciamento: i.aceitaFinanciamento ? "sim" : "nao",
    observacoes: `Imóvel da Caixa (${i.modalidade}). Avaliação: R$ ${i.avaliacao.toLocaleString("pt-BR")}; desconto de ${i.desconto.toLocaleString("pt-BR")}%. Confira as regras de venda e as despesas no link oficial.`,
    fotos: [],
    status: "interessado",
    ehRepasse: false,
    repasse: { agio: 0, saldoDevedor: 0, parcela: 0, parcelasRestantes: 0, banco: "" },
    criadoPor: quem,
    criadoEm: agoraIso,
  };
}
