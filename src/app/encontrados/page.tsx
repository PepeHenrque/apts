"use client";

import { Building2, MapPin, Radar, Upload } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CampoMarcar } from "@/components/campos";
import { SeloOrcamento } from "@/components/imoveis/CartaoImovel";
import {
  Aviso,
  AvisoCalculo,
  Botao,
  Carregando,
  EstadoVazio,
  LinkExterno,
  Selo,
  TituloPagina,
  avisar,
} from "@/components/ui";
import { useDiagnostico, useEstadoFamilia, useQuem } from "@/lib/armazenamento/hooks";
import { atualizarEstado } from "@/lib/armazenamento/loja";
import { separarCidadeUf } from "@/lib/busca/links";
import {
  filtrarEncontrados,
  paraImovelSalvo,
  type ArquivoCaixa,
  type Encontrado,
  type StatusRobo,
} from "@/lib/caixa/encontrados";
import { lerListaCaixa } from "@/lib/caixa/parser";
import { hoje, paraDataIso } from "@/lib/datas";
import { novoId } from "@/lib/dominio/esquemas";
import { avaliarImovel } from "@/lib/financiamento/orcamento";
import { formatarData, formatarDataHora, formatarMoedaInteira } from "@/lib/formatar";
import { coordenadasDe, formatarDistancia } from "@/lib/geo/distancia";

const POR_PAGINA = 24;

type Carga =
  | { tipo: "carregando" }
  | { tipo: "erro"; mensagem: string }
  | { tipo: "ok"; status: StatusRobo | null; arquivo: ArquivoCaixa | null; ufUsada: string };

async function carregar(ufDesejada: string): Promise<Carga> {
  const status = await fetch("/dados/caixa/status.json")
    .then((r) => (r.ok ? (r.json() as Promise<StatusRobo>) : null))
    .catch(() => null);
  const uf = ufDesejada || status?.ufs[0] || "SP";
  const arquivo = await fetch(`/dados/caixa/${uf}.json`)
    .then((r) => (r.ok ? (r.json() as Promise<ArquivoCaixa>) : null))
    .catch(() => null);
  return { tipo: "ok", status, arquivo, ufUsada: uf };
}

export default function PaginaEncontrados() {
  const estado = useEstadoFamilia();
  const diagnostico = useDiagnostico(estado);
  const quem = useQuem();
  const ufDesejada = estado ? separarCidadeUf(estado.preferencias.cidadeUf).uf : "";
  const [carga, setCarga] = useState<Carga>({ tipo: "carregando" });
  const [importado, setImportado] = useState<ArquivoCaixa | null>(null);
  const [soFinanciamento, setSoFinanciamento] = useState(true);
  const [incluirAmarelo, setIncluirAmarelo] = useState(true);
  const [limite, setLimite] = useState(POR_PAGINA);

  useEffect(() => {
    if (!estado) return;
    let ativo = true;
    carregar(ufDesejada)
      .then((c) => ativo && setCarga(c))
      .catch(
        () => ativo && setCarga({ tipo: "erro", mensagem: "Não foi possível carregar a lista." }),
      );
    return () => {
      ativo = false;
    };
  }, [estado, ufDesejada]);

  const referencia = diagnostico?.melhor ?? diagnostico?.potencial ?? null;
  const arquivo = importado ?? (carga.tipo === "ok" ? carga.arquivo : null);

  const encontrados = useMemo<Encontrado[]>(() => {
    if (!estado || !arquivo) return [];
    const p = estado.preferencias;
    const { cidade } = separarCidadeUf(p.cidadeUf);
    return filtrarEncontrados(
      arquivo,
      {
        precoMaximo: referencia?.resultado.precoMaximo.SAC ?? null,
        incluirAmarelo,
        lugares: [cidade, ...p.locaisDesejados.map((l) => l.nome)].filter(Boolean),
        tipo: p.tipo,
        quartosMin: p.quartosMin,
        soFinanciamento,
        casa: coordenadasDe(p.casaAtual),
        distanciaMaxKm: p.distanciaMaxKm,
      },
      hoje(),
    );
  }, [estado, arquivo, referencia, incluirAmarelo, soFinanciamento]);

  if (!estado || !diagnostico || carga.tipo === "carregando") {
    return (
      <>
        <TituloPagina>Encontrados automaticamente</TituloPagina>
        <Carregando />
      </>
    );
  }

  const linksSalvos = new Set(estado.imoveis.map((i) => i.link));
  const status = carga.tipo === "ok" ? carga.status : null;
  const ufUsada = importado?.uf ?? (carga.tipo === "ok" ? carga.ufUsada : "");
  const erroUf = status?.porUf[ufUsada]?.erro;

  function salvar(e: Encontrado) {
    const novo = paraImovelSalvo(e.imovel, novoId(), quem || "Alguém", new Date().toISOString());
    atualizarEstado(`Salvou o imóvel da Caixa "${novo.titulo}"`, (s) => ({
      ...s,
      imoveis: [...s.imoveis, novo],
    }));
    avisar("Imóvel salvo em Imóveis salvos.");
  }

  async function importarArquivo(arquivoCsv: File) {
    const texto = new TextDecoder("latin1").decode(await arquivoCsv.arrayBuffer());
    const dataHoje = paraDataIso(hoje());
    const imoveis = lerListaCaixa(texto, dataHoje);
    if (imoveis.length === 0) {
      avisar("Esse arquivo não parece a lista de imóveis da Caixa.", "erro");
      return;
    }
    setImportado({
      uf: imoveis[0]?.uf ?? "",
      baseDesde: dataHoje,
      dataDaLista: null,
      atualizadoEm: dataHoje,
      imoveis,
      novos: [],
      removidos: [],
    });
    avisar(`${imoveis.length} imóveis carregados do arquivo.`);
  }

  return (
    <>
      <TituloPagina
        idAjuda="encontrados"
        ajuda="Todo dia um robô baixa a lista oficial de imóveis à venda da Caixa e mostra aqui os que combinam com o que vocês procuram e com o orçamento. Imóveis da Caixa costumam ter desconto, mas confiram as regras de venda e se aceitam financiamento."
        subtitulo="Imóveis da Caixa filtrados pelo orçamento e pelo que vocês procuram."
      >
        Encontrados automaticamente
      </TituloPagina>
      <AvisoCalculo />

      {status ? (
        <p className="mb-4 text-sm text-texto-2">
          Lista oficial da Caixa
          {arquivo?.dataDaLista ? ` de ${formatarData(arquivo.dataDaLista)}` : ""} · {ufUsada} ·
          verificada pelo robô em {formatarDataHora(status.atualizadoEm)}
        </p>
      ) : null}
      {importado && (
        <Aviso tipo="info">Mostrando a lista importada do arquivo (só nesta visita).</Aviso>
      )}
      {erroUf && !importado && (
        <Aviso tipo="alerta" titulo="A última busca automática falhou.">
          {erroUf}. A lista abaixo é a da última busca que deu certo.
        </Aviso>
      )}
      {ufDesejada && status && !status.ufs.includes(ufDesejada) && !importado && (
        <Aviso tipo="alerta" titulo={`O robô ainda não busca imóveis de ${ufDesejada}.`}>
          O administrador pode incluir {ufDesejada} no painel de administração. Enquanto isso, é
          possível importar a lista manualmente (abaixo).
        </Aviso>
      )}
      {!referencia && (
        <Aviso tipo="info">
          Sem um cenário de compra calculado, a lista não é filtrada por preço. Cadastrem quem tem
          renda em Nossa situação.
        </Aviso>
      )}

      <div className="mb-4 flex flex-wrap gap-x-6 rounded-md border border-borda bg-superficie px-4 pt-4">
        <CampoMarcar
          rotulo="Só os que aceitam financiamento"
          marcado={soFinanciamento}
          aoMudar={setSoFinanciamento}
        />
        <CampoMarcar
          rotulo="Incluir até 10% acima do orçamento"
          marcado={incluirAmarelo}
          aoMudar={setIncluirAmarelo}
        />
      </div>

      {!arquivo ? (
        <EstadoVazio titulo="A lista da Caixa ainda não está disponível" icone={Radar}>
          O robô roda uma vez por dia. Se preferir, importe o arquivo baixado do site da Caixa
          (abaixo).
        </EstadoVazio>
      ) : encontrados.length === 0 ? (
        <EstadoVazio titulo="Nenhum imóvel da Caixa combina com a busca agora" icone={Building2}>
          Tentem incluir mais cidades ou bairros em Nossa situação → Imóvel desejado, ou desmarquem
          “Só os que aceitam financiamento”. O robô confere a lista de novo amanhã.
        </EstadoVazio>
      ) : (
        <>
          <p className="mb-3 text-texto-2">
            <span className="numeros font-medium text-texto">{encontrados.length}</span> imóveis
            combinam com a busca
            {encontrados.some((e) => e.novo) && (
              <>
                ,{" "}
                <span className="numeros font-medium text-texto">
                  {encontrados.filter((e) => e.novo).length}
                </span>{" "}
                novos nesta semana
              </>
            )}
            .
          </p>
          <ul className="grid gap-4 lg:grid-cols-2">
            {encontrados.slice(0, limite).map((e) => {
              const i = e.imovel;
              const cor = referencia ? avaliarImovel(i.preco, referencia.resultado).cor : null;
              const jaSalvo = linksSalvos.has(i.link);
              return (
                <li
                  key={i.id}
                  className="rounded-md border border-borda bg-superficie p-4 shadow-sutil"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    {e.novo && <Selo cor="azul">Novo</Selo>}
                    {cor && <SeloOrcamento cor={cor} />}
                  </div>
                  <h2 className="mt-2 font-semibold">
                    {
                      {
                        apartamento: "Apartamento",
                        casa: "Casa",
                        sobrado: "Sobrado",
                        terreno: "Terreno",
                        comercial: "Comercial",
                        outro: "Imóvel",
                      }[i.tipo]
                    }
                    {i.quartos ? `, ${i.quartos} quarto(s)` : ""}
                    {i.area ? `, ${i.area.toLocaleString("pt-BR")} m²` : ""}
                  </h2>
                  <p className="text-texto-2">
                    {i.bairro}, {i.cidade} - {i.uf}
                  </p>
                  <p className="numeros mt-2 text-2xl font-semibold tracking-tight">
                    {formatarMoedaInteira(i.preco)}
                  </p>
                  <p className="numeros text-sm text-texto-2">
                    Avaliação {formatarMoedaInteira(i.avaliacao)} · desconto de{" "}
                    {i.desconto.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
                  </p>
                  <p className="mt-1 text-sm text-texto-2">
                    {i.modalidade} ·{" "}
                    {i.aceitaFinanciamento ? "aceita financiamento" : "não aceita financiamento"}
                  </p>
                  {e.distanciaKm !== null && (
                    <p className="mt-1 flex items-center gap-1 text-sm text-texto-2">
                      <MapPin size={16} strokeWidth={1.75} aria-hidden="true" />
                      {formatarDistancia(e.distanciaKm)} da casa atual (em linha reta)
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <Botao
                      variante={jaSalvo ? "secundario" : "primario"}
                      disabled={jaSalvo}
                      onClick={() => salvar(e)}
                    >
                      {jaSalvo ? "Já está nos meus imóveis" : "Salvar nos meus imóveis"}
                    </Botao>
                    {i.link && <LinkExterno href={i.link}>Ver no site da Caixa</LinkExterno>}
                  </div>
                </li>
              );
            })}
          </ul>
          {encontrados.length > limite && (
            <Botao
              variante="secundario"
              className="mt-4 w-full"
              onClick={() => setLimite(limite + POR_PAGINA)}
            >
              Mostrar mais
            </Botao>
          )}
        </>
      )}

      <details className="mt-6 rounded-md border border-borda bg-superficie p-4">
        <summary className="min-h-11 cursor-pointer font-medium">
          Importar a lista manualmente
        </summary>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-texto-2">
          <li>
            Abram{" "}
            <LinkExterno href="https://venda-imoveis.caixa.gov.br/sistema/download-lista.asp">
              a página de download da Caixa
            </LinkExterno>
            .
          </li>
          <li>Escolham o estado e baixem o arquivo da lista (CSV).</li>
          <li>Selecionem o arquivo abaixo. A lista fica disponível só nesta visita.</li>
        </ol>
        <label htmlFor="arquivo-caixa" className="mt-3 flex items-center gap-2 font-medium">
          <Upload size={18} strokeWidth={1.75} aria-hidden="true" />
          Arquivo da lista da Caixa (.csv)
        </label>
        <input
          id="arquivo-caixa"
          type="file"
          accept=".csv,text/csv"
          className="mt-1"
          onChange={(ev) => {
            const f = ev.target.files?.[0];
            if (f) void importarArquivo(f);
          }}
        />
      </details>
    </>
  );
}
