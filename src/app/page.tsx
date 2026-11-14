"use client";

import { Building2, ChevronRight, ListChecks, Map, Search } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { CartaoSemaforo } from "@/components/calculo";
import {
  AvisoCalculo,
  BotaoLink,
  Cartao,
  Carregando,
  NumeroDestaque,
  TituloPagina,
  Valor,
} from "@/components/ui";
import { useDiagnostico, useEstadoFamilia } from "@/lib/armazenamento/hooks";
import { avaliarImovelSalvo } from "@/lib/dominio/imoveis";
import { formatarData, formatarMoedaInteira } from "@/lib/formatar";

const ATALHOS = [
  { href: "/imoveis", icone: Building2, texto: "Imóveis salvos" },
  { href: "/busca", icone: Search, texto: "Buscar nos sites" },
  { href: "/guias", icone: ListChecks, texto: "Checklists" },
  { href: "/mapa", icone: Map, texto: "Mapa" },
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

  const cabecalho = (
    <TituloPagina subtitulo="Até quanto vocês podem pagar e o que falta para o banco aprovar.">
      Início
    </TituloPagina>
  );

  if (!estado || !d) {
    return (
      <>
        {cabecalho}
        <Carregando />
      </>
    );
  }

  const proximo = d.bloqueios[0];

  return (
    <>
      {cabecalho}
      <AvisoCalculo />
      <div className="grid gap-x-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div>
          <CartaoSemaforo diagnostico={d} />
          <Cartao titulo="Quanto dá para comprar hoje">
            <NumeroDestaque
              rotulo={d.melhor ? `Preço máximo — ${d.melhor.nome}` : "Preço máximo"}
              valor={formatarMoedaInteira(d.melhor?.resultado.precoMaximo.SAC ?? 0)}
              detalhe={
                !d.melhor && d.potencial
                  ? `Depois de limpar o nome (${d.potencial.nome}): ${formatarMoedaInteira(d.potencial.resultado.precoMaximo.SAC)}`
                  : undefined
              }
            />
            <dl className="mt-4">
              <Valor
                rotulo="Imóveis salvos que cabem no orçamento"
                valor={imoveis.total ? `${imoveis.cabem} de ${imoveis.total}` : "nenhum salvo"}
              />
              <Valor rotulo="Recusas registradas" valor={d.recusas.total} />
            </dl>
            <BotaoLink href="/simulador" variante="discreto" className="mt-2">
              Ver todos os cenários
            </BotaoLink>
          </Cartao>
        </div>

        <div>
          {proximo && (
            <Cartao titulo="Próximo passo">
              <p className="font-medium">{proximo.titulo}</p>
              <p className="mt-1 text-texto-2">{proximo.oQueFazer[0]}</p>
              <BotaoLink href="/diagnostico" variante="discreto" className="mt-2">
                Ver o diagnóstico completo
              </BotaoLink>
            </Cartao>
          )}

          {d.mudancas[0] && (
            <Cartao titulo="Data importante">
              <p>
                <span className="numeros font-medium">{formatarData(d.mudancas[0].data)}</span> —{" "}
                {d.mudancas[0].descricao}
              </p>
            </Cartao>
          )}

          <nav aria-label="Atalhos" className="mb-4">
            <ul className="divide-y divide-borda rounded-md border border-borda bg-superficie">
              {ATALHOS.map(({ href, icone: Icone, texto }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="flex min-h-12 items-center gap-3 px-4 hover:bg-fundo"
                  >
                    <Icone
                      size={18}
                      strokeWidth={1.75}
                      aria-hidden="true"
                      className="text-primaria"
                    />
                    <span className="flex-1">{texto}</span>
                    <ChevronRight
                      size={18}
                      strokeWidth={1.75}
                      aria-hidden="true"
                      className="text-texto-3"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <BotaoLink href="/situacao" variante="secundario" className="w-full">
            Atualizar nossa situação
          </BotaoLink>
        </div>
      </div>
    </>
  );
}
