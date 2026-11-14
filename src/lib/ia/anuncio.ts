/** Leitura de anúncio com IA: prompt, esquema de resposta e validação (Zod). */
import { z } from "zod";
import { SIM_NAO_NAO_SEI, TIPOS_IMOVEL, type Imovel } from "@/lib/dominio/esquemas";

export function promptAnuncio(textoAnuncio: string): string {
  return [
    "Você extrai dados de anúncios de imóveis à venda no Brasil.",
    "Responda SOMENTE com JSON. Use null quando a informação não estiver no texto. NÃO invente.",
    "Campos: titulo (curto, ex.: 'Apto 2 quartos no Centro'), preco (reais, número), tipo",
    `(${TIPOS_IMOVEL.join(", ")}), quartos, banheiros, vagas (inteiros), area (m²), endereco,`,
    "bairro, cidade (texto), condominio (R$ por mês), iptu (R$ por ANO; se o anúncio der o valor",
    "mensal, multiplique por 12), aceitaFinanciamento (sim, nao, nao-sei).",
    "",
    "Anúncio:",
    '"""',
    textoAnuncio,
    '"""',
  ].join("\n");
}

const numero = { type: "NUMBER", nullable: true };
const texto = { type: "STRING", nullable: true };

/** Esquema no formato que a API do Gemini aceita (subconjunto do OpenAPI). */
export const ESQUEMA_RESPOSTA_ANUNCIO = {
  type: "OBJECT",
  properties: {
    titulo: texto,
    preco: numero,
    tipo: { type: "STRING", nullable: true, enum: [...TIPOS_IMOVEL] },
    quartos: numero,
    banheiros: numero,
    vagas: numero,
    area: numero,
    endereco: texto,
    bairro: texto,
    cidade: texto,
    condominio: numero,
    iptu: numero,
    aceitaFinanciamento: { type: "STRING", nullable: true, enum: [...SIM_NAO_NAO_SEI] },
  },
};

const n = z.number().nonnegative().finite().nullish().catch(null);
const t = z.string().trim().max(200).nullish().catch(null);

export const esquemaDadosAnuncioIA = z.object({
  titulo: t,
  preco: n,
  tipo: z.enum(TIPOS_IMOVEL).nullish().catch(null),
  quartos: n,
  banheiros: n,
  vagas: n,
  area: n,
  endereco: t,
  bairro: t,
  cidade: t,
  condominio: n,
  iptu: n,
  aceitaFinanciamento: z.enum(SIM_NAO_NAO_SEI).nullish().catch(null),
});

export type DadosAnuncioIA = Partial<
  Pick<
    Imovel,
    | "titulo"
    | "preco"
    | "tipo"
    | "quartos"
    | "banheiros"
    | "vagas"
    | "area"
    | "endereco"
    | "bairro"
    | "cidade"
    | "condominio"
    | "iptu"
    | "aceitaFinanciamento"
  >
>;

/** Valida o JSON devolvido pela IA e descarta campos vazios ou inválidos. */
export function lerDadosAnuncioIA(textoJson: string): DadosAnuncioIA | null {
  let bruto: unknown;
  try {
    bruto = JSON.parse(textoJson.replace(/^```(?:json)?\s*|\s*```$/g, ""));
  } catch {
    return null;
  }
  const r = esquemaDadosAnuncioIA.safeParse(bruto);
  if (!r.success) return null;
  const inteiros = new Set(["quartos", "banheiros", "vagas"]);
  const dados: Record<string, unknown> = {};
  for (const [chave, valor] of Object.entries(r.data)) {
    if (valor === null || valor === undefined || valor === "") continue;
    dados[chave] = typeof valor === "number" && inteiros.has(chave) ? Math.round(valor) : valor;
  }
  return dados as DadosAnuncioIA;
}
