/**
 * Nominatim (OpenStreetMap): transforma endereço em coordenadas. Gratuito, com regras de uso:
 * no máximo 1 pedido por segundo, identificação do app (User-Agent/Referer) e cache dos resultados.
 * https://operations.osmfoundation.org/policies/nominatim/
 */
import type { Coordenadas } from "@/lib/geo/distancia";

export const USER_AGENT_PADRAO = "apts-app/1.0 (app familiar de busca de imovel)";

export function urlNominatim(consulta: string): string {
  const params = new URLSearchParams({
    format: "jsonv2",
    limit: "1",
    countrycodes: "br",
    q: consulta,
  });
  return `https://nominatim.openstreetmap.org/search?${params.toString()}`;
}

/** Lê a resposta do Nominatim (lista de lugares) e devolve as coordenadas do primeiro. */
export function lerRespostaNominatim(json: unknown): Coordenadas | null {
  if (!Array.isArray(json) || json.length === 0) return null;
  const primeiro = json[0] as { lat?: unknown; lon?: unknown };
  const lat = Number(primeiro.lat);
  const lon = Number(primeiro.lon);
  return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null;
}

/** Normaliza o texto usado como chave de cache. */
export function chaveConsulta(consulta: string): string {
  return consulta.trim().toLowerCase().replace(/\s+/g, " ");
}
