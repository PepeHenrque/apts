/**
 * GET /api/geocodificar?q=endereço → { lat, lon } (ou 404).
 * Roda no servidor para enviar um User-Agent identificável ao Nominatim, respeitar 1 pedido por
 * segundo e guardar resultados em cache.
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import type { Coordenadas } from "@/lib/geo/distancia";
import {
  chaveConsulta,
  lerRespostaNominatim,
  urlNominatim,
  USER_AGENT_PADRAO,
} from "@/lib/geo/nominatim";

const esquemaConsulta = z.string().trim().min(3).max(200);
const cache = new Map<string, Coordenadas | null>();
let ultimoPedido = 0;

export async function GET(request: NextRequest) {
  const consulta = esquemaConsulta.safeParse(request.nextUrl.searchParams.get("q") ?? "");
  if (!consulta.success) {
    return NextResponse.json({ erro: "Endereço inválido." }, { status: 400 });
  }
  const chave = chaveConsulta(consulta.data);

  if (!cache.has(chave)) {
    const espera = ultimoPedido + 1000 - Date.now();
    if (espera > 0) await new Promise((r) => setTimeout(r, espera));
    ultimoPedido = Date.now();
    try {
      const resposta = await fetch(urlNominatim(consulta.data), {
        headers: {
          "User-Agent": process.env.NOMINATIM_USER_AGENT || USER_AGENT_PADRAO,
          "Accept-Language": "pt-BR",
        },
      });
      if (!resposta.ok) {
        return NextResponse.json({ erro: "Serviço de mapas indisponível." }, { status: 502 });
      }
      cache.set(chave, lerRespostaNominatim(await resposta.json()));
    } catch {
      return NextResponse.json({ erro: "Serviço de mapas indisponível." }, { status: 502 });
    }
  }

  const coordenadas = cache.get(chave);
  return coordenadas
    ? NextResponse.json(coordenadas)
    : NextResponse.json({ erro: "Endereço não encontrado." }, { status: 404 });
}
