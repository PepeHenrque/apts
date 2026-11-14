"use client";

/**
 * Mapa com Leaflet + OpenStreetMap. Carregado só no navegador (Leaflet usa `window`).
 * Cores: verde/amarelo/vermelho = cabe no orçamento; azul = casa atual; roxo = lugares importantes.
 */
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import type { CorOrcamento } from "@/lib/financiamento/orcamento";
import type { Coordenadas } from "@/lib/geo/distancia";
import { formatarMoedaInteira } from "@/lib/formatar";

export interface PontoMapa {
  id: string;
  titulo: string;
  coordenadas: Coordenadas;
  preco?: number;
  cor?: CorOrcamento;
  tipo: "imovel" | "casa" | "ponto";
  textoCor?: string;
}

const CORES: Record<CorOrcamento, string> = {
  verde: "#15803d",
  amarelo: "#ca8a04",
  vermelho: "#b91c1c",
};

function corDoPonto(p: PontoMapa): string {
  if (p.tipo === "casa") return "#1d4ed8";
  if (p.tipo === "ponto") return "#7e22ce";
  return p.cor ? CORES[p.cor] : "#4b5563";
}

export default function MapaLeaflet({ pontos }: { pontos: PontoMapa[] }) {
  const coords = pontos.map((p) => [p.coordenadas.lat, p.coordenadas.lon] as [number, number]);
  const props =
    coords.length >= 2
      ? { bounds: coords, boundsOptions: { padding: [30, 30] as [number, number] } }
      : {
          center: coords[0] ?? ([-15.78, -47.93] as [number, number]),
          zoom: coords.length ? 14 : 4,
        };

  return (
    <MapContainer
      {...props}
      scrollWheelZoom
      className="h-[60vh] w-full rounded-2xl border-2 border-gray-300"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      {pontos.map((p) => (
        <CircleMarker
          key={`${p.tipo}-${p.id}`}
          center={[p.coordenadas.lat, p.coordenadas.lon]}
          radius={p.tipo === "casa" ? 12 : 10}
          pathOptions={{ color: "#ffffff", weight: 2, fillColor: corDoPonto(p), fillOpacity: 0.95 }}
        >
          <Popup>
            <div className="text-base">
              <p className="font-bold">{p.titulo}</p>
              {p.preco !== undefined && <p>{formatarMoedaInteira(p.preco)}</p>}
              {p.textoCor && <p>{p.textoCor}</p>}
              {p.tipo === "imovel" && (
                <Link
                  href={`/imoveis#imovel-${p.id}`}
                  className="font-semibold text-blue-800 underline"
                >
                  Ver detalhes
                </Link>
              )}
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
