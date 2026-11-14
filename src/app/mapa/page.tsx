"use client";
import { MapPin } from "lucide-react";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { TEXTO_COR } from "@/components/imoveis/CartaoImovel";
import type { PontoMapa } from "@/components/mapa/MapaLeaflet";
import { Aviso, Botao, Cartao, Carregando, TituloPagina } from "@/components/ui";
import { useDiagnostico, useEstadoFamilia } from "@/lib/armazenamento/hooks";
import { atualizarEstado } from "@/lib/armazenamento/loja";
import { avaliarImovelSalvo } from "@/lib/dominio/imoveis";
import { coordenadasDe } from "@/lib/geo/distancia";
import { enderecoCompleto, geocodificar } from "@/lib/geo/geocodificar";

const MapaLeaflet = dynamic(() => import("@/components/mapa/MapaLeaflet"), {
  ssr: false,
  loading: () => <Carregando texto="Carregando mapa…" />,
});

const LEGENDA = [
  { cor: "#15803d", texto: TEXTO_COR.verde },
  { cor: "#ca8a04", texto: TEXTO_COR.amarelo },
  { cor: "#b91c1c", texto: TEXTO_COR.vermelho },
  { cor: "#1d4ed8", texto: "Casa atual" },
  { cor: "#7e22ce", texto: "Lugares importantes" },
];

export default function PaginaMapa() {
  const estado = useEstadoFamilia();
  const diagnostico = useDiagnostico(estado);
  const [progresso, setProgresso] = useState("");

  const pontos = useMemo<PontoMapa[]>(() => {
    if (!estado || !diagnostico) return [];
    const lista: PontoMapa[] = [];
    const casa = coordenadasDe(estado.preferencias.casaAtual);
    if (casa) lista.push({ id: "casa", titulo: "Casa atual", coordenadas: casa, tipo: "casa" });
    for (const p of estado.preferencias.pontosImportantes) {
      const c = coordenadasDe(p);
      if (c) lista.push({ id: p.id, titulo: p.nome, coordenadas: c, tipo: "ponto" });
    }
    for (const i of estado.imoveis.filter((x) => x.status !== "descartado")) {
      const c = coordenadasDe(i);
      if (!c) continue;
      const cor = avaliarImovelSalvo(i, diagnostico, estado.preferencias).avaliacao?.cor;
      lista.push({
        id: i.id,
        titulo: i.titulo,
        coordenadas: c,
        preco: i.preco,
        cor,
        textoCor: cor ? TEXTO_COR[cor] : undefined,
        tipo: "imovel",
      });
    }
    return lista;
  }, [estado, diagnostico]);

  if (!estado || !diagnostico) return <Carregando />;

  const cidade = estado.preferencias.cidadeUf;
  const semLocal = estado.imoveis.filter(
    (i) => i.status !== "descartado" && !coordenadasDe(i) && (i.endereco || i.bairro),
  );

  async function localizarTodos() {
    let achados = 0;
    for (const [n, i] of semLocal.entries()) {
      setProgresso(`Localizando ${n + 1} de ${semLocal.length}…`);
      try {
        const c = await geocodificar(enderecoCompleto([i.endereco, i.bairro, i.cidade || cidade]));
        if (c) {
          achados++;
          atualizarEstado(`Localizou no mapa: ${i.titulo}`, (e) => ({
            ...e,
            imoveis: e.imoveis.map((x) => (x.id === i.id ? { ...x, lat: c.lat, lon: c.lon } : x)),
          }));
        }
      } catch {
        setProgresso("O serviço de mapas não respondeu. Tente de novo mais tarde.");
        return;
      }
    }
    setProgresso(`${achados} de ${semLocal.length} imóveis localizados.`);
  }

  return (
    <>
      <TituloPagina subtitulo="Toque em um ponto para ver o imóvel.">Mapa</TituloPagina>
      {pontos.length === 0 && (
        <Aviso tipo="info">
          Nenhum ponto no mapa ainda. Cadastre o endereço da casa atual e localize os imóveis
          salvos.
        </Aviso>
      )}
      <MapaLeaflet pontos={pontos} />
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1" aria-label="Legenda do mapa">
        {LEGENDA.map((l) => (
          <li key={l.texto} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-block h-4 w-4 rounded-full border border-white"
              style={{ background: l.cor }}
            />
            {l.texto}
          </li>
        ))}
      </ul>
      {semLocal.length > 0 && (
        <Cartao titulo="Imóveis sem localização" className="mt-4">
          <p className="mb-2">
            {semLocal.length} imóvel(is) têm endereço mas ainda não estão no mapa.
          </p>
          <Botao
            variante="secundario"
            icone={MapPin}
            onClick={localizarTodos}
            disabled={progresso.startsWith("Localizando")}
          >
            Localizar todos
          </Botao>
          {progresso && (
            <p role="status" className="mt-2 font-semibold">
              {progresso}
            </p>
          )}
        </Cartao>
      )}
    </>
  );
}
