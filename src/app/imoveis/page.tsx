"use client";
import { Building2, Filter, Map as MapIcone, Plus, Search } from "lucide-react";

import { useMemo, useState } from "react";
import { CampoMarcar, CampoSelecao } from "@/components/campos";
import { BotaoPreencherIA } from "@/components/ia/Ia";
import { CartaoImovel, SeloOrcamento } from "@/components/imoveis/CartaoImovel";
import { FormImovel } from "@/components/imoveis/FormImovel";
import {
  AvisoCalculo,
  Botao,
  BotaoLink,
  Carregando,
  EstadoVazio,
  TituloPagina,
  confirmar,
} from "@/components/ui";
import { useDiagnostico, useEstadoFamilia, useQuem } from "@/lib/armazenamento/hooks";
import { atualizarEstado } from "@/lib/armazenamento/loja";
import {
  imovelEmBranco,
  NOMES_STATUS_IMOVEL,
  STATUS_IMOVEL,
  type Imovel,
} from "@/lib/dominio/esquemas";
import { avaliarImovelSalvo, ordenarImoveis, type Ordenacao } from "@/lib/dominio/imoveis";
import { avaliarImovel } from "@/lib/financiamento/orcamento";
import { formatarMoeda, formatarMoedaInteira } from "@/lib/formatar";

type FiltroStatus = "ativos" | "todos" | Imovel["status"];
const OPCOES_STATUS: Record<FiltroStatus, string> = {
  ativos: "Todos menos descartados",
  todos: "Todos",
  ...Object.fromEntries(STATUS_IMOVEL.map((s) => [s, NOMES_STATUS_IMOVEL[s]])),
} as Record<FiltroStatus, string>;
const OPCOES_ORDEM: Record<Ordenacao, string> = {
  orcamento: "Cabe no orçamento primeiro",
  preco: "Menor preço",
  distancia: "Mais perto da casa atual",
  recentes: "Adicionados por último",
};

export default function PaginaImoveis() {
  const estado = useEstadoFamilia();
  const diagnostico = useDiagnostico(estado);
  const quem = useQuem();
  const [editando, setEditando] = useState<Imovel | null>(null);
  const [filtro, setFiltro] = useState<FiltroStatus>("ativos");
  const [soCabem, setSoCabem] = useState(false);
  const [ordem, setOrdem] = useState<Ordenacao>("orcamento");

  const avaliados = useMemo(
    () =>
      estado && diagnostico
        ? estado.imoveis.map((i) => avaliarImovelSalvo(i, diagnostico, estado.preferencias))
        : [],
    [estado, diagnostico],
  );

  if (!estado || !diagnostico) return <Carregando />;
  const referencia = diagnostico.melhor ?? diagnostico.potencial;

  if (editando) {
    const existe = estado.imoveis.some((i) => i.id === editando.id);
    return (
      <>
        <TituloPagina
          idAjuda="imoveis"
          ajuda="Guarde aqui os anúncios que gostaram. Verde: cabe no orçamento. Amarelo: até 10% acima. Vermelho: não cabe. A entrada e a parcela são estimativas."
        >
          {existe ? "Editar imóvel" : "Novo imóvel"}
        </TituloPagina>
        <FormImovel
          inicial={editando}
          aoCancelar={() => setEditando(null)}
          extraTexto={(texto, aplicar) => <BotaoPreencherIA texto={texto} aoPreencher={aplicar} />}
          previa={(preco) =>
            referencia && (
              <div className="mb-4">
                <SeloOrcamento cor={avaliarImovel(preco, referencia.resultado).cor} />
                <p className="mt-1 text-texto-2">
                  Parcela estimada:{" "}
                  {formatarMoeda(avaliarImovel(preco, referencia.resultado).parcelaEstimada)}
                </p>
              </div>
            )
          }
          aoSalvar={(imovel) => {
            const final = existe
              ? imovel
              : { ...imovel, criadoPor: quem || "Alguém", criadoEm: new Date().toISOString() };
            atualizarEstado(
              existe ? `Editou o imóvel "${imovel.titulo}"` : `Salvou o imóvel "${imovel.titulo}"`,
              (e) => ({
                ...e,
                imoveis: existe
                  ? e.imoveis.map((i) => (i.id === imovel.id ? final : i))
                  : [...e.imoveis, final],
              }),
            );
            setEditando(null);
          }}
        />
      </>
    );
  }

  const visiveis = ordenarImoveis(
    avaliados.filter(
      (a) =>
        (filtro === "todos" ||
          (filtro === "ativos" ? a.imovel.status !== "descartado" : a.imovel.status === filtro)) &&
        (!soCabem || a.avaliacao?.cor === "verde"),
    ),
    ordem,
  );
  const quantosCabem = avaliados.filter(
    (a) => a.avaliacao?.cor === "verde" && a.imovel.status !== "descartado",
  ).length;
  const mudarImovel = (id: string) => (descricao: string, mudancas: Partial<Imovel>) =>
    atualizarEstado(descricao, (e) => ({
      ...e,
      imoveis: e.imoveis.map((i) => (i.id === id ? { ...i, ...mudancas } : i)),
    }));

  return (
    <>
      <TituloPagina
        subtitulo={
          referencia
            ? `Comparando com "${referencia.nome}": até ${formatarMoedaInteira(referencia.resultado.precoMaximo.SAC)}${diagnostico.melhor ? "" : " (depois de limpar o nome)"}.`
            : "Cadastre quem tem renda em Situação para comparar com o orçamento."
        }
      >
        Imóveis salvos
      </TituloPagina>
      <AvisoCalculo />
      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Botao icone={Plus} onClick={() => setEditando(imovelEmBranco())}>
          Adicionar imóvel
        </Botao>
        <BotaoLink href="/busca" variante="secundario" icone={Search}>
          Buscar nos sites
        </BotaoLink>
        <BotaoLink href="/mapa" variante="secundario" icone={MapIcone}>
          Ver no mapa
        </BotaoLink>
      </div>

      {estado.imoveis.length === 0 ? (
        <EstadoVazio titulo="Nenhum imóvel salvo ainda" icone={Building2}>
          Vocês ainda não salvaram nenhum imóvel. Toquem em Adicionar imóvel ou compartilhem um
          anúncio para o app. Para achar anúncios, usem Buscar nos sites.
        </EstadoVazio>
      ) : (
        <>
          <p className="mb-3">
            <strong>{quantosCabem}</strong> de {estado.imoveis.length} cabem no orçamento.
          </p>
          <details className="mb-4 rounded-md border border-borda bg-white p-3">
            <summary className="min-h-11 cursor-pointer py-2 text-lg font-semibold">
              Filtrar e ordenar
            </summary>
            <CampoSelecao
              rotulo="Mostrar"
              valor={filtro}
              opcoes={OPCOES_STATUS}
              aoMudar={setFiltro}
            />
            <CampoMarcar
              rotulo="Só os que cabem no orçamento"
              marcado={soCabem}
              aoMudar={setSoCabem}
            />
            <CampoSelecao
              rotulo="Ordenar por"
              valor={ordem}
              opcoes={OPCOES_ORDEM}
              aoMudar={setOrdem}
            />
          </details>
          {visiveis.length === 0 && (
            <EstadoVazio titulo="Nenhum imóvel com esses filtros" icone={Filter}>
              Mudem os filtros acima para ver os outros imóveis salvos.
            </EstadoVazio>
          )}
          <div className="grid gap-x-4 lg:grid-cols-2">
            {visiveis.map((dados) => (
              <CartaoImovel
                key={dados.imovel.id}
                dados={dados}
                preferencias={estado.preferencias}
                aoEditar={() => setEditando(dados.imovel)}
                aoMudar={mudarImovel(dados.imovel.id)}
                aoRemover={async () => {
                  if (!(await confirmar(`Remover "${dados.imovel.titulo}"?`))) return;
                  atualizarEstado(`Removeu o imóvel "${dados.imovel.titulo}"`, (e) => ({
                    ...e,
                    imoveis: e.imoveis.filter((i) => i.id !== dados.imovel.id),
                  }));
                }}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}
