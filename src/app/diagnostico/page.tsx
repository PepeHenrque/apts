"use client";

import { CartaoSemaforo } from "@/components/calculo";
import { AvisoCalculo, BotaoLink, Cartao, Carregando, Selo, TituloPagina } from "@/components/ui";
import { useDiagnostico, useEstadoFamilia } from "@/lib/armazenamento/hooks";
import type { Gravidade } from "@/lib/dominio/diagnostico";
import { formatarData } from "@/lib/formatar";

const SELO_GRAVIDADE: Record<Gravidade, { cor: "vermelho" | "amarelo" | "azul"; texto: string }> = {
  3: { cor: "vermelho", texto: "Impede a aprovação" },
  2: { cor: "amarelo", texto: "Precisa de atenção" },
  1: { cor: "azul", texto: "Bom saber" },
};

export default function PaginaDiagnostico() {
  const estado = useEstadoFamilia();
  const d = useDiagnostico(estado);
  if (!estado || !d) return <Carregando />;

  return (
    <>
      <TituloPagina subtitulo="O que está bloqueando a aprovação e o que fazer, do mais grave ao mais leve.">
        Por que estão negando?
      </TituloPagina>
      <AvisoCalculo />
      <CartaoSemaforo diagnostico={d} />

      {d.recusas.total > 0 && (
        <Cartao titulo="O que dizem as recusas">
          <p className="text-lg">{d.recusas.frase}</p>
          <BotaoLink href="/situacao/recusas" variante="discreto" className="mt-1 px-0">
            Ver todas as recusas
          </BotaoLink>
        </Cartao>
      )}

      {d.mudancas.length > 0 && (
        <Cartao titulo="Mudanças já previstas">
          <ul className="space-y-2">
            {d.mudancas.map((m) => (
              <li key={`${m.pessoaId}-${m.data}`} className="text-lg">
                <strong>{formatarData(m.data)}:</strong> {m.descricao}
              </li>
            ))}
          </ul>
        </Cartao>
      )}

      <h2 className="mt-6 mb-3 text-2xl font-bold">Bloqueios e alertas</h2>
      {d.bloqueios.length === 0 && (
        <Cartao>
          <p className="text-lg">Nenhum bloqueio encontrado com os dados atuais. 🎉</p>
        </Cartao>
      )}
      {d.bloqueios.map((b) => (
        <Cartao key={b.id} titulo={b.titulo}>
          <div className="mb-2">
            <Selo cor={SELO_GRAVIDADE[b.gravidade].cor}>{SELO_GRAVIDADE[b.gravidade].texto}</Selo>
          </div>
          <p className="text-lg">{b.explicacao}</p>
          <h3 className="mt-3 text-lg font-bold">O que fazer</h3>
          <ul className="mt-1 list-disc space-y-1 pl-6 text-lg">
            {b.oQueFazer.map((passo) => (
              <li key={passo}>{passo}</li>
            ))}
          </ul>
          {b.links.length > 0 && (
            <ul className="mt-3 space-y-2">
              {b.links.map((l) => (
                <li key={l.url}>
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg font-semibold text-blue-800 underline"
                  >
                    {l.texto} ↗
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Cartao>
      ))}

      <div className="mt-4 flex flex-col gap-2">
        <BotaoLink href="/simulador">Ver os cenários de compra</BotaoLink>
        <BotaoLink href="/situacao" variante="secundario">
          Atualizar nossa situação
        </BotaoLink>
      </div>
    </>
  );
}
