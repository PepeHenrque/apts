"use client";

import { useState } from "react";
import {
  CampoAreaTexto,
  CampoData,
  CampoMarcar,
  CampoNumero,
  CampoSelecao,
  CampoTexto,
  errosPorCampo,
} from "@/components/campos";
import { GraficoCausas } from "@/components/situacao/GraficoCausas";
import { Aviso, Botao, Cartao, Carregando, EstadoVazio, confirmar } from "@/components/ui";
import { useEstadoFamilia } from "@/lib/armazenamento/hooks";
import { atualizarEstado } from "@/lib/armazenamento/loja";
import { resumirRecusas } from "@/lib/dominio/diagnostico";
import {
  esquemaRecusa,
  NOMES_CANAL,
  NOMES_CAUSA,
  novoId,
  type Pessoa,
  type Recusa,
} from "@/lib/dominio/esquemas";
import { formatarData, formatarMoedaInteira } from "@/lib/formatar";

function FormRecusa({
  inicial,
  pessoas,
  aoSalvar,
  aoCancelar,
}: {
  inicial: Recusa;
  pessoas: Pessoa[];
  aoSalvar: (r: Recusa) => void;
  aoCancelar: () => void;
}) {
  const [r, setR] = useState(inicial);
  const [erros, setErros] = useState<Record<string, string>>({});
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const resultado = esquemaRecusa.safeParse(r);
        if (!resultado.success) return setErros(errosPorCampo(resultado.error));
        aoSalvar(resultado.data);
      }}
    >
      <Cartao titulo={inicial.banco || inicial.imovelDescricao ? "Editar recusa" : "Nova recusa"}>
        <CampoData
          rotulo="Data"
          valor={r.data}
          aoMudar={(data) => setR({ ...r, data })}
          erro={erros.data}
        />
        <CampoTexto rotulo="Banco" valor={r.banco} aoMudar={(banco) => setR({ ...r, banco })} />
        <CampoSelecao
          rotulo="Onde pediram"
          valor={r.canal}
          opcoes={NOMES_CANAL}
          aoMudar={(canal) => setR({ ...r, canal })}
        />
        <CampoTexto
          rotulo="Imóvel (descrição ou endereço)"
          valor={r.imovelDescricao}
          aoMudar={(imovelDescricao) => setR({ ...r, imovelDescricao })}
        />
        <CampoNumero
          rotulo="Valor do imóvel"
          moeda
          valor={r.imovelValor}
          aoMudar={(imovelValor) => setR({ ...r, imovelValor })}
        />
        <CampoTexto
          rotulo="Link do anúncio (opcional)"
          tipo="url"
          valor={r.imovelLink}
          aoMudar={(imovelLink) => setR({ ...r, imovelLink })}
        />
        <fieldset className="mb-4">
          <legend className="text-lg font-semibold">Quem estava como comprador</legend>
          {pessoas.map((p) => (
            <CampoMarcar
              key={p.id}
              rotulo={p.nome}
              marcado={r.compradoresIds.includes(p.id)}
              aoMudar={(marcado) =>
                setR({
                  ...r,
                  compradoresIds: marcado
                    ? [...r.compradoresIds, p.id]
                    : r.compradoresIds.filter((id) => id !== p.id),
                })
              }
            />
          ))}
        </fieldset>
        <CampoSelecao
          rotulo="Motivo informado"
          valor={r.causa}
          opcoes={NOMES_CAUSA}
          aoMudar={(causa) => setR({ ...r, causa })}
        />
        {r.causa === "outra" && (
          <CampoTexto
            rotulo="Qual motivo?"
            valor={r.causaOutra}
            aoMudar={(causaOutra) => setR({ ...r, causaOutra })}
          />
        )}
        <CampoAreaTexto
          rotulo="Observações"
          valor={r.observacoes}
          aoMudar={(observacoes) => setR({ ...r, observacoes })}
        />
        <div className="flex gap-2">
          <Botao type="submit" className="flex-1">
            Salvar
          </Botao>
          <Botao variante="secundario" onClick={aoCancelar}>
            Cancelar
          </Botao>
        </div>
      </Cartao>
    </form>
  );
}

export default function PaginaRecusas() {
  const estado = useEstadoFamilia();
  const [editando, setEditando] = useState<Recusa | null>(null);
  if (!estado) return <Carregando />;

  const resumo = resumirRecusas(estado.recusas);
  const nomeDe = (id: string) => estado.pessoas.find((p) => p.id === id)?.nome ?? "pessoa removida";
  const recusas = [...estado.recusas].sort((a, b) => b.data.localeCompare(a.data));

  if (editando) {
    const existe = estado.recusas.some((x) => x.id === editando.id);
    return (
      <FormRecusa
        inicial={editando}
        pessoas={estado.pessoas}
        aoCancelar={() => setEditando(null)}
        aoSalvar={(recusa) => {
          atualizarEstado(
            existe
              ? "Editou uma recusa de financiamento"
              : `Registrou uma recusa (${NOMES_CAUSA[recusa.causa]})`,
            (e) => ({
              ...e,
              recusas: existe
                ? e.recusas.map((x) => (x.id === recusa.id ? recusa : x))
                : [...e.recusas, recusa],
            }),
          );
          setEditando(null);
        }}
      />
    );
  }

  return (
    <>
      <Cartao>
        <p className="text-4xl font-bold">{resumo.total}</p>
        <p className="text-lg">
          {resumo.total === 1 ? "recusa registrada" : "recusas registradas"}
        </p>
        {resumo.total > 0 && <p className="mt-2 text-lg font-semibold">{resumo.frase}</p>}
      </Cartao>
      {resumo.total > 0 && (
        <Cartao>
          <GraficoCausas resumo={resumo} />
        </Cartao>
      )}
      <Aviso tipo="info">
        Cadastrar cada recusa ajuda o Diagnóstico a mostrar o que mais está atrapalhando.
      </Aviso>
      {recusas.length === 0 && <EstadoVazio titulo="Nenhuma recusa registrada" />}
      {recusas.map((r) => (
        <Cartao
          key={r.id}
          titulo={`${r.data ? formatarData(r.data) : "Sem data"} · ${r.banco || NOMES_CANAL[r.canal]}`}
          acoes={
            <div className="flex gap-2">
              <Botao variante="secundario" onClick={() => setEditando(r)}>
                Editar
              </Botao>
              <Botao
                variante="perigo"
                onClick={() => {
                  if (!confirmar("Remover esta recusa?")) return;
                  atualizarEstado("Removeu uma recusa", (e) => ({
                    ...e,
                    recusas: e.recusas.filter((x) => x.id !== r.id),
                  }));
                }}
              >
                Remover
              </Botao>
            </div>
          }
        >
          <p className="text-lg font-semibold">
            Motivo: {r.causa === "outra" && r.causaOutra ? r.causaOutra : NOMES_CAUSA[r.causa]}
          </p>
          {(r.imovelDescricao || r.imovelValor > 0) && (
            <p>
              {r.imovelDescricao}
              {r.imovelValor > 0 && ` — ${formatarMoedaInteira(r.imovelValor)}`}
            </p>
          )}
          {r.compradoresIds.length > 0 && (
            <p>Compradores: {r.compradoresIds.map(nomeDe).join(", ")}</p>
          )}
          {r.imovelLink && (
            <a
              href={r.imovelLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-800 underline"
            >
              Ver anúncio
            </a>
          )}
          {r.observacoes && <p className="mt-1 text-gray-700">{r.observacoes}</p>}
        </Cartao>
      ))}
      <Botao
        className="mt-2 w-full"
        onClick={() => setEditando(esquemaRecusa.parse({ id: novoId() }))}
      >
        + Registrar recusa
      </Botao>
    </>
  );
}
