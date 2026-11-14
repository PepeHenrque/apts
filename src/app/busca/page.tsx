"use client";
import { ExternalLink } from "lucide-react";

import { useState } from "react";
import { BotaoLocalizar } from "@/components/BotaoLocalizar";
import { CampoNumero, CampoTexto } from "@/components/campos";
import { Aviso, AvisoCalculo, BotaoLink, Cartao, Carregando, TituloPagina } from "@/components/ui";
import { useDiagnostico, useEstadoFamilia } from "@/lib/armazenamento/hooks";
import { atualizarEstado } from "@/lib/armazenamento/loja";
import { gerarLinksBusca, separarCidadeUf } from "@/lib/busca/links";
import type { Local } from "@/lib/dominio/esquemas";
import { coordenadasDe, distanciaKm, formatarDistancia } from "@/lib/geo/distancia";
import { enderecoCompleto } from "@/lib/geo/geocodificar";
import { formatarMoedaInteira } from "@/lib/formatar";

function salvarLocal(
  campo: "locaisDesejados" | "pontosImportantes",
  local: Local,
  lat: number,
  lon: number,
) {
  atualizarEstado(`Localizou no mapa: ${local.nome}`, (e) => ({
    ...e,
    preferencias: {
      ...e.preferencias,
      [campo]: e.preferencias[campo].map((l) => (l.id === local.id ? { ...l, lat, lon } : l)),
    },
  }));
}

export default function PaginaBusca() {
  const estado = useEstadoFamilia();
  const diagnostico = useDiagnostico(estado);
  const [precoDigitado, setPreco] = useState<number | null>(null);
  const [cidadeDigitada, setCidade] = useState<string | null>(null);
  if (!estado || !diagnostico) return <Carregando />;

  const p = estado.preferencias;
  const referencia = diagnostico.melhor ?? diagnostico.potencial;
  const precoSugerido = Math.floor((referencia?.resultado.precoMaximo.SAC ?? 0) / 1000) * 1000;
  const precoMax = precoDigitado ?? precoSugerido;
  const cidadeUf = cidadeDigitada ?? p.cidadeUf;
  const { cidade, uf } = separarCidadeUf(cidadeUf);
  const filtroBase = { precoMax, quartosMin: p.quartosMin, cidade, uf, tipo: p.tipo };
  const links = gerarLinksBusca(filtroBase);
  const casa = coordenadasDe(p.casaAtual);

  return (
    <>
      <TituloPagina
        idAjuda="busca"
        ajuda="Os links abrem os sites de imóveis já filtrados pelo preço máximo do melhor cenário. Quando acharem um anúncio bom, salvem em Imóveis salvos."
        subtitulo="Links já filtrados com o preço que cabe no orçamento. Abra, encontre e salve os anúncios aqui no app."
      >
        Buscar imóveis
      </TituloPagina>
      <AvisoCalculo />

      <Cartao titulo="Filtros">
        <CampoNumero
          rotulo="Preço máximo"
          ajuda={
            referencia
              ? `Sugestão do melhor cenário ("${referencia.nome}"${diagnostico.melhor ? "" : ", depois de limpar o nome"}): ${formatarMoedaInteira(precoSugerido)}`
              : "Cadastre quem tem renda para calcular o preço máximo."
          }
          moeda
          valor={precoMax}
          aoMudar={setPreco}
        />
        <CampoTexto
          rotulo="Cidade e estado (ex.: Campinas - SP)"
          valor={cidadeUf}
          aoMudar={setCidade}
        />
        <p className="text-texto-2">
          Quartos e tipo de imóvel vêm de Situação → Imóvel desejado (
          {p.quartosMin || "qualquer nº de"} quarto(s)).
        </p>
      </Cartao>

      {!cidade && (
        <Aviso tipo="alerta">Informe a cidade para os links filtrarem a região certa.</Aviso>
      )}

      <h2 className="mb-3 text-xl font-semibold">Sites</h2>
      <ul className="mb-6 grid gap-3 sm:grid-cols-2">
        {links.map((l) => (
          <li key={l.site}>
            <a
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-md border border-primaria bg-white p-4 hover:bg-primaria-suave"
            >
              <span className="block text-lg font-semibold text-primaria">
                {l.site}
                <ExternalLink
                  size={16}
                  strokeWidth={1.75}
                  aria-hidden="true"
                  className="ml-1.5 inline align-[-2px]"
                />
                <span className="sr-only"> (abre em nova aba)</span>
              </span>
              {l.observacao && <span className="text-texto-2">{l.observacao}</span>}
            </a>
          </li>
        ))}
      </ul>
      <Aviso tipo="info">
        Os sites mudam de vez em quando. Se algum filtro não funcionar, ajuste na própria página.
      </Aviso>

      <Cartao titulo="Bairros e cidades desejados">
        {!casa && (
          <div className="mb-4">
            <p className="">Para ver distâncias, localize a casa atual:</p>
            {p.casaAtual.endereco ? (
              <BotaoLocalizar
                endereco={p.casaAtual.endereco}
                rotulo="Localizar casa atual"
                aoEncontrar={(c) =>
                  atualizarEstado("Localizou a casa atual no mapa", (e) => ({
                    ...e,
                    preferencias: {
                      ...e.preferencias,
                      casaAtual: { ...e.preferencias.casaAtual, ...c },
                    },
                  }))
                }
              />
            ) : (
              <BotaoLink href="/situacao/preferencias" variante="discreto" className="px-0">
                Cadastrar endereço da casa atual
              </BotaoLink>
            )}
          </div>
        )}
        {p.locaisDesejados.length === 0 ? (
          <p className="">
            Nenhum bairro cadastrado.{" "}
            <BotaoLink href="/situacao/preferencias" variante="discreto" className="px-0">
              Adicionar bairros
            </BotaoLink>
          </p>
        ) : (
          <ul className="space-y-4">
            {p.locaisDesejados.map((l) => {
              const c = coordenadasDe(l);
              const linksBairro = gerarLinksBusca({ ...filtroBase, bairro: l.nome }).slice(0, 3);
              return (
                <li key={l.id} className="rounded-md border border-borda p-3">
                  <p className="font-semibold">{l.nome}</p>
                  {c && casa && <p>{formatarDistancia(distanciaKm(casa, c))} da casa atual</p>}
                  {c && casa && p.distanciaMaxKm > 0 && distanciaKm(casa, c) > p.distanciaMaxKm && (
                    <p className="font-semibold text-atencao">
                      Acima da distância máxima ({p.distanciaMaxKm} km).
                    </p>
                  )}
                  <p className="mt-1">
                    Buscar aqui:{" "}
                    {linksBairro.map((lb) => (
                      <a
                        key={lb.site}
                        href={lb.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mr-3 font-semibold text-primaria underline"
                      >
                        {lb.site}
                      </a>
                    ))}
                  </p>
                  {!c && (
                    <BotaoLocalizar
                      endereco={enderecoCompleto([l.endereco || l.nome, cidadeUf])}
                      aoEncontrar={(coord) =>
                        salvarLocal("locaisDesejados", l, coord.lat, coord.lon)
                      }
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Cartao>

      {p.pontosImportantes.some((l) => !coordenadasDe(l)) && (
        <Cartao titulo="Lugares importantes sem localização">
          {p.pontosImportantes
            .filter((l) => !coordenadasDe(l))
            .map((l) => (
              <div key={l.id} className="mb-3">
                <p className="text-lg font-semibold">{l.nome}</p>
                <BotaoLocalizar
                  endereco={enderecoCompleto([l.endereco || l.nome, cidadeUf])}
                  aoEncontrar={(coord) => salvarLocal("pontosImportantes", l, coord.lat, coord.lon)}
                />
              </div>
            ))}
        </Cartao>
      )}
    </>
  );
}
