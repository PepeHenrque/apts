/** Distâncias e links de rota (sem serviços pagos). */

export interface Coordenadas {
  lat: number;
  lon: number;
}

const RAIO_TERRA_KM = 6371;

/** Distância em linha reta (fórmula de Haversine), em km. */
export function distanciaKm(a: Coordenadas, b: Coordenadas): number {
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * RAIO_TERRA_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Coordenadas válidas de um objeto com lat/lon possivelmente nulos. */
export function coordenadasDe(x: { lat: number | null; lon: number | null }): Coordenadas | null {
  return x.lat !== null && x.lon !== null ? { lat: x.lat, lon: x.lon } : null;
}

type Ponto = Coordenadas | string;

function textoPonto(p: Ponto): string {
  return typeof p === "string" ? p : `${p.lat},${p.lon}`;
}

/** Link "ver rota" no Google Maps (aceita coordenadas ou endereço em texto). */
export function linkRotaGoogleMaps(origem: Ponto, destino: Ponto): string {
  const params = new URLSearchParams({
    api: "1",
    origin: textoPonto(origem),
    destination: textoPonto(destino),
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/** Ex.: 1.234 → "1,2 km"; 0.4 → "400 m". */
export function formatarDistancia(km: number): string {
  if (km < 1) return `${Math.round(km * 100) * 10} m`;
  return `${km.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km`;
}
