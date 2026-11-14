"use client";
import { AlertTriangle, CheckCircle2, MapPin, XCircle } from "lucide-react";

import { BotaoLocalizar } from "@/components/BotaoLocalizar";
import { CampoSelecao } from "@/components/campos";
import { Botao, Selo } from "@/components/ui";
import type { Preferencias } from "@/lib/dominio/esquemas";
import { NOMES_STATUS_IMOVEL, NOMES_TIPO_IMOVEL, type Imovel } from "@/lib/dominio/esquemas";
import type { ImovelAvaliado } from "@/lib/dominio/imoveis";
import type { CorOrcamento } from "@/lib/financiamento/orcamento";
import { coordenadasDe, formatarDistancia, linkRotaGoogleMaps } from "@/lib/geo/distancia";
import { enderecoCompleto } from "@/lib/geo/geocodificar";
import { linkSeguro } from "@/lib/seguranca";
import { formatarDataHora, formatarMoeda, formatarMoedaInteira } from "@/lib/formatar";

export const TEXTO_COR: Record<CorOrcamento, string> = {
  verde: "Cabe no orçamento",
  amarelo: "Quase (até 10% acima)",
  vermelho: "Não cabe no orçamento",
};

export function SeloOrcamento({ cor }: { cor: CorOrcamento }) {
  return (
    <span data-testid="cor-orcamento">
      <Selo cor={cor}>
        {cor === "verde" ? (
          <CheckCircle2 size={16} strokeWidth={2} aria-hidden="true" />
        ) : cor === "amarelo" ? (
          <AlertTriangle size={16} strokeWidth={2} aria-hidden="true" />
        ) : (
          <XCircle size={16} strokeWidth={2} aria-hidden="true" />
        )}
        {TEXTO_COR[cor]}
      </Selo>
    </span>
  );
}

export function CartaoImovel({
  dados,
  preferencias,
  aoEditar,
  aoRemover,
  aoMudar,
}: {
  dados: ImovelAvaliado;
  preferencias: Preferencias;
  aoEditar: () => void;
  aoRemover: () => void;
  aoMudar: (descricao: string, mudancas: Partial<Imovel>) => void;
}) {
  const { imovel: im, avaliacao } = dados;
  const local = coordenadasDe(im);
  const casa = coordenadasDe(preferencias.casaAtual);
  const endereco = enderecoCompleto([im.endereco, im.bairro, im.cidade || preferencias.cidadeUf]);
  const origemRota = casa ?? preferencias.casaAtual.endereco;
  const destinoRota = local ?? endereco;

  return (
    <article
      id={`imovel-${im.id}`}
      className={`mb-4 scroll-mt-4 rounded-md border bg-white p-4 ${im.status === "descartado" ? "border-borda opacity-80" : "border-borda"}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-lg font-semibold">{im.titulo}</h2>
        {avaliacao && <SeloOrcamento cor={avaliacao.cor} />}
      </div>
      <p className="mt-1 numeros text-2xl font-semibold tracking-tight">
        {formatarMoedaInteira(im.preco)}
      </p>
      <p className="text-texto-2">
        {[
          im.tipo !== "qualquer" ? NOMES_TIPO_IMOVEL[im.tipo] : "",
          im.quartos ? `${im.quartos} quarto(s)` : "",
          im.banheiros ? `${im.banheiros} banheiro(s)` : "",
          im.vagas ? `${im.vagas} vaga(s)` : "",
          im.area ? `${im.area} m²` : "",
        ]
          .filter(Boolean)
          .join(" · ")}
      </p>
      {(im.bairro || im.cidade) && (
        <p className="">{[im.bairro, im.cidade].filter(Boolean).join(", ")}</p>
      )}

      {avaliacao && (
        <dl className="mt-3 grid grid-cols-2 gap-2 rounded-md bg-fundo p-3">
          <div>
            <dt className="text-sm text-texto-2">Entrada estimada</dt>
            <dd className="text-lg font-semibold">
              {formatarMoedaInteira(avaliacao.entradaNecessaria)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-texto-2">Parcela estimada</dt>
            <dd className="text-lg font-semibold">{formatarMoeda(avaliacao.parcelaEstimada)}</dd>
          </div>
          {avaliacao.faltaEntrada > 0 && (
            <div>
              <dt className="text-sm text-texto-2">Falta de entrada</dt>
              <dd className="text-lg font-semibold text-erro">
                {formatarMoedaInteira(avaliacao.faltaEntrada)}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-sm text-texto-2">Custo por mês</dt>
            <dd className="text-lg font-semibold">{formatarMoeda(dados.custoMensal)}</dd>
          </div>
        </dl>
      )}
      {dados.ehPotencial && (
        <p className="mt-1 text-texto-2">Comparado com o cenário depois de limpar o nome.</p>
      )}

      <div className="mt-3">
        {dados.distanciaCasaKm !== null && (
          <p className="">
            <MapPin
              size={18}
              strokeWidth={1.75}
              aria-hidden="true"
              className="mr-1 inline align-[-3px] text-texto-3"
            />
            {formatarDistancia(dados.distanciaCasaKm)} da casa atual (em linha reta)
          </p>
        )}
        {dados.distanciasPontos.map((d) => (
          <p key={d.nome}>
            {formatarDistancia(d.km)} até {d.nome}
          </p>
        ))}
        {(local || endereco) && (origemRota || casa) && (
          <a
            href={linkRotaGoogleMaps(origemRota, destinoRota)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block font-semibold text-primaria underline"
          >
            Ver rota no Google Maps
          </a>
        )}
        {!local && endereco && (
          <BotaoLocalizar
            endereco={endereco}
            aoEncontrar={(c) =>
              aoMudar(`Localizou no mapa: ${im.titulo}`, { lat: c.lat, lon: c.lon })
            }
          />
        )}
      </div>

      {dados.alertas.length > 0 && (
        <ul className="mt-3 space-y-1 rounded-md bg-atencao-suave p-3 text-atencao">
          {dados.alertas.map((a) => (
            <li key={a} className="flex gap-2">
              <AlertTriangle
                size={18}
                strokeWidth={1.75}
                aria-hidden="true"
                className="mt-0.5 shrink-0"
              />
              {a}
            </li>
          ))}
        </ul>
      )}

      {dados.repasse && (
        <p className="mt-2">
          Repasse: pagar {formatarMoedaInteira(dados.repasse.desembolsoInicial)} de ágio + parcelas
          ({formatarMoedaInteira(dados.repasse.totalParcelas)}) ={" "}
          <strong>{formatarMoedaInteira(dados.repasse.custoTotal)}</strong>.
        </p>
      )}

      {linkSeguro(im.link) && (
        <a
          href={linkSeguro(im.link) ?? undefined}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block font-semibold text-primaria underline"
        >
          Abrir anúncio
        </a>
      )}
      {im.observacoes && <p className="mt-2 whitespace-pre-line text-texto-2">{im.observacoes}</p>}
      {im.fotos.length > 0 && (
        <p className="mt-1">
          Fotos:{" "}
          {im.fotos
            .map((f) => linkSeguro(f))
            .filter((f): f is string => f !== null)
            .map((f, i) => (
              <a
                key={f}
                href={f}
                target="_blank"
                rel="noopener noreferrer"
                className="mr-2 text-primaria underline"
              >
                foto {i + 1}
              </a>
            ))}
        </p>
      )}

      <div className="mt-3">
        <CampoSelecao
          rotulo="Situação"
          valor={im.status}
          opcoes={NOMES_STATUS_IMOVEL}
          aoMudar={(status) =>
            aoMudar(`Mudou "${im.titulo}" para ${NOMES_STATUS_IMOVEL[status]}`, { status })
          }
        />
      </div>
      <div className="flex gap-2">
        <Botao variante="secundario" onClick={aoEditar}>
          Editar
        </Botao>
        <Botao variante="perigo" onClick={aoRemover} aria-label={`Remover ${im.titulo}`}>
          Remover
        </Botao>
      </div>
      {(im.criadoPor || im.criadoEm) && (
        <p className="mt-2 text-sm text-texto-2">
          Adicionado {im.criadoPor && `por ${im.criadoPor}`}{" "}
          {im.criadoEm && `em ${formatarDataHora(im.criadoEm)}`}
        </p>
      )}
    </article>
  );
}
