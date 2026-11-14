/**
 * Lista pública de imóveis à venda da Caixa (arquivo CSV por estado, o mesmo do botão
 * "Baixar lista" de https://venda-imoveis.caixa.gov.br). NÃO é scraping: é o arquivo oficial
 * oferecido para download.
 *
 * Formato (latin1, separado por ";"):
 *   linha 1: " Lista de Imóveis da Caixa;;Data de geração:;13/11/2026;..."
 *   linha 2: cabeçalho
 *   linha 3: vazia
 *   demais: N° do imóvel;UF;Cidade;Bairro;Endereço;Preço;Valor de avaliação;Desconto;
 *           Financiamento;Descrição;Modalidade de venda;Link de acesso
 *
 * Este arquivo não usa o alias "@/" de propósito: o robô (scripts/robo-caixa.ts) o importa
 * direto com o Node.
 */

export type TipoCaixa = "apartamento" | "casa" | "sobrado" | "terreno" | "comercial" | "outro";

export interface ImovelCaixa {
  id: string;
  uf: string;
  cidade: string;
  bairro: string;
  endereco: string;
  preco: number;
  avaliacao: number;
  /** Desconto em % sobre a avaliação. */
  desconto: number;
  aceitaFinanciamento: boolean;
  tipo: TipoCaixa;
  quartos: number | null;
  /** Área privativa (ou total, se não houver) em m². */
  area: number | null;
  descricao: string;
  modalidade: string;
  link: string;
  lat: number | null;
  lon: number | null;
  /** Data (AAAA-MM-DD) em que o robô viu o imóvel pela primeira vez. */
  vistoDesde: string;
}

/** "136.584,86" → 136584.86 ; "37.06" → 37.06 */
export function lerValorCaixa(texto: string): number {
  const t = texto.trim();
  if (!t) return 0;
  const normal = t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t;
  const n = Number(normal);
  return Number.isFinite(n) ? n : 0;
}

/** "SAO JOSE DOS CAMPOS" → "Sao Jose Dos Campos" (sem mexer em acentos já existentes). */
export function nomeProprio(texto: string): string {
  const pequenas = new Set(["de", "da", "do", "das", "dos", "e"]);
  return texto
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((p, i) => (i > 0 && pequenas.has(p) ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join(" ");
}

export function tipoDaDescricao(descricao: string): TipoCaixa {
  const primeiro = descricao.split(",")[0]?.trim().toLowerCase() ?? "";
  if (primeiro.startsWith("apartamento")) return "apartamento";
  if (primeiro.startsWith("sobrado")) return "sobrado";
  if (primeiro.startsWith("casa")) return "casa";
  if (primeiro.startsWith("terreno") || primeiro.startsWith("gleba")) return "terreno";
  if (/comercial|loja|sala|galp|pr[ée]dio/.test(primeiro)) return "comercial";
  return "outro";
}

export function quartosDaDescricao(descricao: string): number | null {
  const m = /(\d+)\s*qto/i.exec(descricao);
  return m ? Number(m[1]) : null;
}

export function areaDaDescricao(descricao: string): number | null {
  const privativa = /([\d.]+)\s+de [áa]rea privativa/i.exec(descricao);
  const total = /([\d.]+)\s+de [áa]rea total/i.exec(descricao);
  const valor = Number((privativa ?? total)?.[1]);
  return Number.isFinite(valor) && valor > 0 ? valor : null;
}

/** Data de geração escrita na 1ª linha ("13/11/2026" → "2026-11-13"). */
export function dataDeGeracao(textoCsv: string): string | null {
  // O arquivo começa com uma linha vazia; a data fica no topo, antes do cabeçalho.
  const m = /(\d{2})\/(\d{2})\/(\d{4})/.exec(textoCsv.slice(0, 300));
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

/** Lê o CSV (já convertido de latin1 para texto) e devolve os imóveis. */
export function lerListaCaixa(textoCsv: string, hoje: string): ImovelCaixa[] {
  const imoveis: ImovelCaixa[] = [];
  for (const linha of textoCsv.split(/\r?\n/)) {
    const c = linha.split(";").map((x) => x.trim());
    // Linhas de dados começam com o número do imóvel (só dígitos) e têm 12 colunas.
    if (c.length < 12 || !/^\d{6,}$/.test(c[0] ?? "")) continue;
    const [
      id,
      uf,
      cidade,
      bairro,
      endereco,
      preco,
      avaliacao,
      desconto,
      financ,
      descricao,
      modalidade,
      link,
    ] = c as [
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
    ];
    imoveis.push({
      id,
      uf: uf.toUpperCase(),
      cidade: nomeProprio(cidade),
      bairro: nomeProprio(bairro),
      endereco: nomeProprio(endereco),
      preco: lerValorCaixa(preco),
      avaliacao: lerValorCaixa(avaliacao),
      desconto: lerValorCaixa(desconto),
      aceitaFinanciamento: /^sim$/i.test(financ),
      tipo: tipoDaDescricao(descricao),
      quartos: quartosDaDescricao(descricao),
      area: areaDaDescricao(descricao),
      descricao,
      modalidade,
      link: link.startsWith("https://venda-imoveis.caixa.gov.br/") ? link : "",
      lat: null,
      lon: null,
      vistoDesde: hoje,
    });
  }
  return imoveis;
}

export interface ResultadoComparacao {
  imoveis: ImovelCaixa[];
  novos: string[];
  removidos: { id: string; saiuEm: string; cidade: string; preco: number }[];
}

/**
 * Junta a lista nova com a anterior: mantém a data em que cada imóvel apareceu e as
 * coordenadas já descobertas, e lista os que saíram.
 */
export function compararComAnterior(
  atual: ImovelCaixa[],
  anterior: ImovelCaixa[],
  hoje: string,
  removidosAntes: ResultadoComparacao["removidos"] = [],
): ResultadoComparacao {
  const porId = new Map(anterior.map((i) => [i.id, i]));
  const novos: string[] = [];
  const imoveis = atual.map((i) => {
    const antigo = porId.get(i.id);
    if (!antigo) {
      novos.push(i.id);
      return i;
    }
    return { ...i, vistoDesde: antigo.vistoDesde, lat: antigo.lat, lon: antigo.lon };
  });
  const idsAtuais = new Set(atual.map((i) => i.id));
  const limite = new Date(`${hoje}T00:00:00Z`).getTime() - 30 * 86_400_000;
  const removidos = [
    ...removidosAntes.filter(
      (r) => new Date(`${r.saiuEm}T00:00:00Z`).getTime() >= limite && !idsAtuais.has(r.id),
    ),
    ...anterior
      .filter((i) => !idsAtuais.has(i.id))
      .map((i) => ({ id: i.id, saiuEm: hoje, cidade: i.cidade, preco: i.preco })),
  ];
  return { imoveis, novos, removidos };
}
