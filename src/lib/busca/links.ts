/**
 * Links de busca pré-filtrados nos sites de imóveis. NÃO fazemos scraping: só montamos o endereço
 * da busca para a família abrir no navegador.
 *
 * Os sites mudam o formato dos links de vez em quando. Se um filtro não pegar, a página abre
 * mesmo assim e basta ajustar os filtros lá. Atualize os formatos aqui quando necessário.
 */
import type { Preferencias } from "@/lib/dominio/esquemas";

export interface FiltroBusca {
  precoMax: number;
  quartosMin: number;
  cidade: string;
  uf: string;
  bairro?: string;
  tipo: Preferencias["tipo"];
}

export interface LinkBusca {
  site: string;
  url: string;
  observacao: string;
}

/** "Campinas - SP", "Campinas/SP", "Campinas, sp" → { cidade: "Campinas", uf: "SP" }. */
export function separarCidadeUf(texto: string): { cidade: string; uf: string } {
  const m = /^(.*?)[\s,/-]+([A-Za-z]{2})\s*$/.exec(texto.trim());
  if (m && m[1]) return { cidade: m[1].trim(), uf: (m[2] ?? "").toUpperCase() };
  return { cidade: texto.trim(), uf: "" };
}

/** "São José dos Campos" → "sao-jose-dos-campos". */
export function slug(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const TIPO_ZAP: Record<Preferencias["tipo"], string> = {
  qualquer: "imoveis",
  apartamento: "apartamentos",
  casa: "casas",
  "casa-condominio": "casas-de-condominio",
  sobrado: "sobrados",
  terreno: "terrenos-lotes-condominios",
};

const TIPO_VIVAREAL: Record<Preferencias["tipo"], string> = {
  qualquer: "",
  apartamento: "apartamento_residencial/",
  casa: "casa_residencial/",
  "casa-condominio": "condominio_residencial/",
  sobrado: "sobrado_residencial/",
  terreno: "lote-terreno_residencial/",
};

export function gerarLinksBusca(f: FiltroBusca): LinkBusca[] {
  const preco = Math.max(0, Math.floor(f.precoMax));
  const quartos = Math.max(0, Math.floor(f.quartosMin));
  const local = [f.bairro, f.cidade].filter(Boolean).join(" ");
  const ufMin = f.uf.toLowerCase();
  const links: LinkBusca[] = [];

  // OLX
  const olx = new URLSearchParams();
  if (local) olx.set("q", local);
  if (preco) olx.set("pe", String(preco));
  if (quartos) olx.set("ros", String(quartos));
  links.push({
    site: "OLX",
    url: `https://www.olx.com.br/imoveis/venda${ufMin ? `/estado-${ufMin}` : ""}?${olx.toString()}`,
    observacao: "Confira se o anúncio aceita financiamento.",
  });

  // Zap Imóveis
  const zap = new URLSearchParams();
  if (preco) zap.set("precoMaximo", String(preco));
  if (quartos)
    zap.set(
      "quartos",
      Array.from({ length: 5 - Math.min(quartos, 4) }, (_, i) => quartos + i).join(","),
    );
  const lugarZap =
    f.cidade && ufMin ? `${ufMin}+${slug(f.cidade)}${f.bairro ? `++${slug(f.bairro)}` : ""}/` : "";
  links.push({
    site: "Zap Imóveis",
    url: `https://www.zapimoveis.com.br/venda/${TIPO_ZAP[f.tipo]}/${lugarZap}?${zap.toString()}`,
    observacao: "",
  });

  // VivaReal
  const viva = new URLSearchParams();
  if (preco) viva.set("precoMaximo", String(preco));
  if (quartos) viva.set("quartos", String(quartos));
  const lugarViva =
    f.cidade && ufMin
      ? `${ufMin}/${slug(f.cidade)}/${f.bairro ? `bairros/${slug(f.bairro)}/` : ""}`
      : "";
  links.push({
    site: "VivaReal",
    url: `https://www.vivareal.com.br/venda/${lugarViva}${TIPO_VIVAREAL[f.tipo]}?${viva.toString()}`,
    observacao: "",
  });

  // Imóveis da Caixa (o site não aceita filtros pelo link)
  links.push({
    site: "Imóveis à venda da Caixa",
    url: "https://venda-imoveis.caixa.gov.br/sistema/busca-imovel.asp",
    observacao: `No site, escolha ${f.uf || "o estado"} e ${f.cidade || "a cidade"}, e "aceita financiamento". São imóveis retomados pela Caixa, muitas vezes com desconto.`,
  });

  // Facebook Marketplace (precisa estar logado; a cidade é escolhida na página)
  const face = new URLSearchParams();
  if (preco) face.set("maxPrice", String(preco));
  if (quartos) face.set("minBedrooms", String(quartos));
  if (local) face.set("query", local);
  links.push({
    site: "Facebook Marketplace",
    url: `https://www.facebook.com/marketplace/category/propertyforsale?${face.toString()}`,
    observacao:
      "Precisa estar logado. Ajuste a localização na página. Cuidado com golpes: nunca pague sinal antes de visitar.",
  });

  return links;
}
