/**
 * Geocodificação no navegador: usa a rota /api/geocodificar (site) ou o Nominatim direto
 * (app de Windows, que não tem servidor). Pedidos em fila (≥ 1,1 s entre eles) e cache local.
 */
import type { Coordenadas } from "@/lib/geo/distancia";
import { chaveConsulta, lerRespostaNominatim, urlNominatim } from "@/lib/geo/nominatim";

const CHAVE_CACHE = "apts:geocache:v1";
const INTERVALO_MS = 1100;

let fila: Promise<unknown> = Promise.resolve();
let ultimoPedido = 0;

function lerCache(): Record<string, Coordenadas | null> {
  try {
    return JSON.parse(window.localStorage.getItem(CHAVE_CACHE) ?? "{}");
  } catch {
    return {};
  }
}

function salvarNoCache(chave: string, valor: Coordenadas | null) {
  try {
    const cache = lerCache();
    cache[chave] = valor;
    window.localStorage.setItem(CHAVE_CACHE, JSON.stringify(cache));
  } catch {
    // Sem espaço: segue sem cache.
  }
}

async function pedir(consulta: string): Promise<Coordenadas | null> {
  if (process.env.NEXT_PUBLIC_DESKTOP === "1") {
    const resposta = await fetch(urlNominatim(consulta), {
      headers: { "Accept-Language": "pt-BR" },
    });
    if (!resposta.ok) throw new Error("Serviço de mapas indisponível.");
    return lerRespostaNominatim(await resposta.json());
  }
  const resposta = await fetch(`/api/geocodificar?q=${encodeURIComponent(consulta)}`);
  if (resposta.status === 404) return null;
  if (!resposta.ok) throw new Error("Serviço de mapas indisponível. Tente de novo mais tarde.");
  return (await resposta.json()) as Coordenadas;
}

/** Endereço → coordenadas. null = não encontrado. Lança erro se o serviço falhar. */
export async function geocodificar(endereco: string): Promise<Coordenadas | null> {
  const consulta = endereco.trim();
  if (consulta.length < 3) return null;
  const chave = chaveConsulta(consulta);
  const cache = lerCache();
  if (chave in cache) return cache[chave] ?? null;

  const resultado = fila.then(async () => {
    const espera = ultimoPedido + INTERVALO_MS - Date.now();
    if (espera > 0) await new Promise((r) => setTimeout(r, espera));
    ultimoPedido = Date.now();
    return pedir(consulta);
  });
  fila = resultado.catch(() => null);
  const coordenadas = await resultado;
  salvarNoCache(chave, coordenadas);
  return coordenadas;
}

/** Junta as partes de um endereço, ignorando as vazias. Ex.: ["Rua A, 10", "Centro", "Campinas - SP"]. */
export function enderecoCompleto(partes: (string | undefined)[]): string {
  return partes
    .map((p) => p?.trim())
    .filter(Boolean)
    .join(", ");
}
