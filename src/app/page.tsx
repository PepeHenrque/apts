"use client";

import Link from "next/link";
import { useMemo } from "react";
import { CartaoSemaforo } from "@/components/calculo";
import { AvisoCalculo, BotaoLink, Cartao, Carregando, Valor } from "@/components/ui";
import { useDiagnostico, useEstadoFamilia } from "@/lib/armazenamento/hooks";
import { avaliarImovelSalvo } from "@/lib/dominio/imoveis";
import { formatarData, formatarMoedaInteira } from "@/lib/formatar";

const ATALHOS = [
  { href: "/imoveis", icone: "🏢", texto: "Imóveis salvos" },
  { href: "/busca", icone: "🔎", texto: "Buscar nos sites" },
  { href: "/guias", icone: "✅", texto: "Checklists" },
  { href: "/mapa", icone: "🗺️", texto: "Mapa" },
];

export default function Inicio() {
  const estado = useEstadoFamilia();
  const d = useDiagnostico(estado);
  const imoveis = useMemo(() => {
    if (!estado || !d) return { total: 0, cabem: 0 };
    const ativos = estado.imoveis.filter((i) => i.status !== "descartado");
    const cabem = ativos.filter(
      (i) => avaliarImovelSalvo(i, d, estado.preferencias).avaliacao?.cor === "verde",
    ).length;
    return { total: ativos.length, cabem };
  }, [estado, d]);

  if (!estado || !d) {
    return (
      <>
        <h1 className="mb-4 text-3xl font-bold">apts</h1>
        <Carregando />
      </>
    );
  }

  const proximo = d.bloqueios[0];

  return (
    <>
      <h1 className="mb-1 text-3xl font-bold">apts</h1>
      <p className="mb-4 text-lg text-gray-700">Nossa casa própria, passo a passo.</p>
      <AvisoCalculo />
      <CartaoSemaforo diagnostico={d} />

      <Cartao titulo="Resumo">
        <dl>
          <Valor
            rotulo={d.melhor ? `Preço máximo hoje (${d.melhor.nome})` : "Preço máximo hoje"}
            valor={formatarMoedaInteira(d.melhor?.resultado.precoMaximo.SAC ?? 0)}
            destaque
          />
          {!d.melhor && d.potencial && (
            <Valor
              rotulo={`Depois de limpar o nome (${d.potencial.nome})`}
              valor={formatarMoedaInteira(d.potencial.resultado.precoMaximo.SAC)}
            />
          )}
          <Valor
            rotulo="Imóveis salvos que cabem no orçamento"
            valor={imoveis.total ? `${imoveis.cabem} de ${imoveis.total}` : "nenhum salvo"}
          />
          <Valor rotulo="Recusas registradas" valor={d.recusas.total} />
        </dl>
      </Cartao>

      {proximo && (
        <Cartao titulo="Próximo passo sugerido">
          <p className="text-lg font-semibold">{proximo.titulo}</p>
          <p className="mt-1 text-lg">{proximo.oQueFazer[0]}</p>
          <BotaoLink href="/diagnostico" variante="discreto" className="mt-1 px-0">
            Ver tudo o que fazer
          </BotaoLink>
        </Cartao>
      )}

      {d.mudancas[0] && (
        <Cartao titulo="Atenção à data">
          <p className="text-lg">
            <strong>{formatarData(d.mudancas[0].data)}:</strong> {d.mudancas[0].descricao}
          </p>
        </Cartao>
      )}

      <nav aria-label="Atalhos" className="mb-4 grid grid-cols-2 gap-3">
        {ATALHOS.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="flex min-h-20 flex-col items-center justify-center rounded-2xl border-2 border-gray-200 bg-white p-3 text-center text-lg font-semibold hover:border-blue-700"
          >
            <span aria-hidden="true" className="text-3xl">
              {a.icone}
            </span>
            {a.texto}
          </Link>
        ))}
      </nav>

      <div className="flex flex-col gap-2">
        <BotaoLink href="/simulador">Ver cenários de compra</BotaoLink>
        <BotaoLink href="/situacao" variante="secundario">
          Atualizar nossa situação
        </BotaoLink>
      </div>
    </>
  );
}
