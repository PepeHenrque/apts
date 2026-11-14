/**
 * GET /api/geocodificar?q=endereço → { lat, lon } (ou 404).
 * Roda no servidor para enviar um User-Agent identificável ao Nominatim, respeitar 1 pedido por
 * segundo e guardar resultados em cache (memória + tabela cache_geocodificacao no Supabase, se
 * a service key estiver configurada).
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
import { supabaseServidor } from "@/lib/supabase/servidor";

const esquemaConsulta = z.string().trim().min(3).max(200);
const cache = new Map<string, Coordenadas | null>();
let ultimoPedido = 0;

async function lerCacheBanco(chave: string): Promise<Coordenadas | null | undefined> {
  const sb = supabaseServidor();
  if (!sb) return undefined;
  const { data } = await sb
    .from("cache_geocodificacao")
    .select("lat, lon")
    .eq("consulta", chave)
    .maybeSingle<{ lat: number | null; lon: number | null }>();
  if (!data) return undefined;
  return data.lat !== null && data.lon !== null ? { lat: data.lat, lon: data.lon } : null;
}

async function gravarCacheBanco(chave: string, c: Coordenadas | null) {
  const sb = supabaseServidor();
  if (!sb) return;
  await sb
    .from("cache_geocodificacao")
    .upsert({ consulta: chave, lat: c?.lat ?? null, lon: c?.lon ?? null });
}

async function consultarNominatim(consulta: string): Promise<Coordenadas | null> {
  const espera = ultimoPedido + 1000 - Date.now();
  if (espera > 0) await new Promise((r) => setTimeout(r, espera));
  ultimoPedido = Date.now();
  const resposta = await fetch(urlNominatim(consulta), {
    headers: {
      "User-Agent": process.env.NOMINATIM_USER_AGENT || USER_AGENT_PADRAO,
      "Accept-Language": "pt-BR",
    },
  });
  if (!resposta.ok) throw new Error(`Nominatim ${resposta.status}`);
  return lerRespostaNominatim(await resposta.json());
}

export async function GET(request: NextRequest) {
  const consulta = esquemaConsulta.safeParse(request.nextUrl.searchParams.get("q") ?? "");
  if (!consulta.success) {
    return NextResponse.json({ erro: "Endereço inválido." }, { status: 400 });
  }
  const chave = chaveConsulta(consulta.data);

  if (!cache.has(chave)) {
    try {
      let coordenadas = await lerCacheBanco(chave).catch(() => undefined);
      if (coordenadas === undefined) {
        coordenadas = await consultarNominatim(consulta.data);
        await gravarCacheBanco(chave, coordenadas).catch(() => undefined);
      }
      cache.set(chave, coordenadas);
    } catch {
      return NextResponse.json({ erro: "Serviço de mapas indisponível." }, { status: 502 });
    }
  }

  const coordenadas = cache.get(chave);
  return coordenadas
    ? NextResponse.json(coordenadas)
    : NextResponse.json({ erro: "Endereço não encontrado." }, { status: 404 });
}
