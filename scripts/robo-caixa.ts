/**
 * Robô diário dos imóveis da Caixa (roda no GitHub Actions: .github/workflows/robo-caixa.yml).
 *
 * 1. Baixa a lista oficial (CSV) de cada estado configurado (CAIXA_UFS, padrão "SP").
 * 2. Normaliza (src/lib/caixa/parser.ts), compara com a lista anterior (novos / saíram).
 * 3. Geocodifica com cache (dados/geocache-caixa.json), no máximo 1 pedido por segundo ao
 *    Nominatim e um limite de pedidos por execução (o resto fica para os próximos dias).
 * 4. Grava public/dados/caixa/<UF>.json e public/dados/caixa/status.json (o app lê de lá).
 * 5. Se o Supabase estiver configurado: registra o status e "acorda" o banco (evita a pausa
 *    do plano gratuito).
 *
 * Rodar localmente (opcional, leve): node scripts/robo-caixa.ts
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import {
  compararComAnterior,
  dataDeGeracao,
  lerListaCaixa,
  type ImovelCaixa,
  type ResultadoComparacao,
} from "../src/lib/caixa/parser.ts";

const PASTA = "public/dados/caixa";
const CACHE_GEO = "dados/geocache-caixa.json";
const HOJE = new Date().toISOString().slice(0, 10);
const UFS = (process.env.CAIXA_UFS || "SP")
  .split(/[,\s]+/)
  .map((u) => u.trim().toUpperCase())
  .filter((u) => /^[A-Z]{2}$/.test(u));
const CIDADES_PRIORITARIAS = (process.env.CAIXA_CIDADES || "")
  .split(",")
  .map((c) => c.trim().toLowerCase())
  .filter(Boolean);
const LIMITE_PEDIDOS_GEO = Number(process.env.CAIXA_LIMITE_GEOCODIFICACAO || 300);
const USER_AGENT =
  process.env.NOMINATIM_USER_AGENT ||
  "apts-app/1.0 (robo diario de imoveis da Caixa; https://github.com/PepeHenrque/apts)";

interface ArquivoUf {
  uf: string;
  /** Data da primeira execução: o que já existia nesse dia não conta como "novo". */
  baseDesde: string;
  dataDaLista: string | null;
  atualizadoEm: string;
  imoveis: ImovelCaixa[];
  novos: string[];
  removidos: ResultadoComparacao["removidos"];
}

interface StatusUf {
  total: number;
  novos: number;
  removidos: number;
  comLocalizacao: number;
  erro?: string;
}

function lerJson<T>(caminho: string, padrao: T): T {
  try {
    return existsSync(caminho) ? (JSON.parse(readFileSync(caminho, "utf8")) as T) : padrao;
  } catch {
    return padrao;
  }
}

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function baixarLista(uf: string, tentativa = 1): Promise<string> {
  const url = `https://venda-imoveis.caixa.gov.br/listaweb/Lista_imoveis_${uf}.csv`;
  // User-Agent honesto (identifica o robô). Se a Caixa redirecionar (proteção contra robôs),
  // NÃO tentamos contornar: tentamos de novo uma vez mais tarde e, se continuar, registramos o
  // erro. A família pode importar o arquivo manualmente na tela "Encontrados".
  const resposta = await fetch(url, {
    headers: { "User-Agent": "apts-robo/1.0 (+https://github.com/PepeHenrque/apts)" },
    redirect: "manual",
    signal: AbortSignal.timeout(120_000),
  });
  if (resposta.status >= 300 && resposta.status < 400) {
    if (tentativa < 2) {
      await esperar(60_000);
      return baixarLista(uf, tentativa + 1);
    }
    throw new Error(
      `A Caixa recusou o download automático da lista de ${uf} (redirecionamento ${resposta.status})`,
    );
  }
  if (!resposta.ok) throw new Error(`A Caixa respondeu ${resposta.status} para ${uf}`);
  const texto = new TextDecoder("latin1").decode(await resposta.arrayBuffer());
  if (/<html/i.test(texto.slice(0, 500))) {
    throw new Error(`A Caixa devolveu uma página em vez da lista de ${uf}`);
  }
  return texto;
}

// ---- Geocodificação com cache e limite ----
const cacheGeo = lerJson<Record<string, { lat: number; lon: number } | null>>(CACHE_GEO, {});
let pedidosGeo = 0;
let ultimoPedido = 0;

async function geocodificar(
  consulta: string,
): Promise<{ lat: number; lon: number } | null | undefined> {
  const chave = consulta.toLowerCase();
  if (chave in cacheGeo) return cacheGeo[chave];
  if (pedidosGeo >= LIMITE_PEDIDOS_GEO) return undefined; // fica para amanhã
  const espera = ultimoPedido + 1100 - Date.now();
  if (espera > 0) await esperar(espera);
  ultimoPedido = Date.now();
  pedidosGeo++;
  const params = new URLSearchParams({
    format: "jsonv2",
    limit: "1",
    countrycodes: "br",
    q: consulta,
  });
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: { "User-Agent": USER_AGENT, "Accept-Language": "pt-BR" },
      signal: AbortSignal.timeout(30_000),
    });
    if (!r.ok) return undefined;
    const lista = (await r.json()) as { lat: string; lon: string }[];
    const achado = lista[0] ? { lat: Number(lista[0].lat), lon: Number(lista[0].lon) } : null;
    cacheGeo[chave] = achado;
    return achado;
  } catch {
    return undefined;
  }
}

/** "RUA JOSE DE OLIVEIRA, N. 670, LT 09" → "Rua Jose de Oliveira, 670". */
function ruaComNumero(endereco: string): string {
  const partes = endereco.split(",").map((p) => p.trim());
  const numero = /n\.?\s*(\d+)/i.exec(endereco)?.[1];
  return numero ? `${partes[0]}, ${numero}` : (partes[0] ?? "");
}

async function localizar(i: ImovelCaixa): Promise<void> {
  const cidade = `${i.cidade}, ${i.uf}, Brasil`;
  let c = await geocodificar(`${ruaComNumero(i.endereco)}, ${cidade}`);
  if (c === null) c = await geocodificar(`${i.bairro}, ${cidade}`);
  if (c) {
    i.lat = Number(c.lat.toFixed(6));
    i.lon = Number(c.lon.toFixed(6));
  }
}

function prioridade(i: ImovelCaixa): number {
  let p = 0;
  if (CIDADES_PRIORITARIAS.includes(i.cidade.toLowerCase())) p -= 100;
  if (i.aceitaFinanciamento) p -= 10;
  if (i.vistoDesde === HOJE) p -= 5;
  if (i.tipo === "apartamento" || i.tipo === "casa") p -= 2;
  return p;
}

// ---- Supabase (opcional) ----
async function registrarNoSupabase(status: unknown) {
  const url = process.env.SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) return "Supabase não configurado (ok)";
  const cabecalhos = {
    apikey: chave,
    Authorization: `Bearer ${chave}`,
    "Content-Type": "application/json",
    Prefer: "resolution=merge-duplicates",
  };
  // Consulta simples: mantém o projeto gratuito ativo.
  const vivo = await fetch(`${url}/rest/v1/familias?select=id&limit=1`, { headers: cabecalhos });
  const gravou = await fetch(`${url}/rest/v1/estado_sistema`, {
    method: "POST",
    headers: cabecalhos,
    body: JSON.stringify({
      chave: "robo_caixa",
      valor: status,
      atualizado_em: new Date().toISOString(),
    }),
  });
  return `Supabase: consulta ${vivo.status}, status ${gravou.status}`;
}

async function main() {
  mkdirSync(PASTA, { recursive: true });
  mkdirSync("dados", { recursive: true });
  const porUf: Record<string, StatusUf> = {};
  const erros: string[] = [];

  for (const uf of UFS) {
    const caminho = `${PASTA}/${uf}.json`;
    const anterior = lerJson<ArquivoUf | null>(caminho, null);
    try {
      const csv = await baixarLista(uf);
      const lidos = lerListaCaixa(csv, HOJE);
      if (lidos.length === 0) throw new Error(`Lista de ${uf} veio vazia`);
      const r = compararComAnterior(
        lidos,
        anterior?.imoveis ?? [],
        HOJE,
        anterior?.removidos ?? [],
      );
      // Primeira execução: a lista inteira vira a base (nada é "novo" ainda).
      if (!anterior) r.novos = [];
      for (const i of [...r.imoveis]
        .filter((x) => x.lat === null)
        .sort((a, b) => prioridade(a) - prioridade(b))) {
        if (pedidosGeo >= LIMITE_PEDIDOS_GEO) break;
        await localizar(i);
      }
      const arquivo: ArquivoUf = {
        uf,
        baseDesde: anterior?.baseDesde ?? HOJE,
        dataDaLista: dataDeGeracao(csv),
        atualizadoEm: HOJE,
        // A descrição longa já virou tipo/quartos/área; fica de fora para o arquivo ser leve.
        imoveis: r.imoveis.map((i) => ({ ...i, descricao: "" })),
        novos: r.novos,
        removidos: r.removidos,
      };
      writeFileSync(caminho, JSON.stringify(arquivo));
      porUf[uf] = {
        total: r.imoveis.length,
        novos: r.novos.length,
        removidos: r.removidos.filter((x) => x.saiuEm === HOJE).length,
        comLocalizacao: r.imoveis.filter((i) => i.lat !== null).length,
      };
      console.log(
        `${uf}: ${r.imoveis.length} imóveis, ${r.novos.length} novos, ${porUf[uf].removidos} saíram`,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      erros.push(msg);
      porUf[uf] = {
        total: anterior?.imoveis.length ?? 0,
        novos: 0,
        removidos: 0,
        comLocalizacao: 0,
        erro: msg,
      };
      console.error(`ERRO ${uf}: ${msg}`);
    }
  }

  writeFileSync(CACHE_GEO, JSON.stringify(cacheGeo));
  const status = {
    atualizadoEm: new Date().toISOString(),
    sucesso: erros.length === 0,
    ufs: UFS,
    porUf,
    erros,
    pedidosDeLocalizacao: pedidosGeo,
  };
  writeFileSync(`${PASTA}/status.json`, JSON.stringify(status, null, 2));
  console.log(await registrarNoSupabase(status).catch((e) => `Supabase indisponível: ${e}`));

  if (erros.length === UFS.length) {
    console.error("Nenhum estado foi atualizado.");
    process.exitCode = 1;
  }
}

await main();
