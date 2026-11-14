"use client";

import { CartaoSemaforo } from "@/components/calculo";
import { AvisoCalculo, BotaoLink, Cartao, Carregando, Valor } from "@/components/ui";
import { useDiagnostico, useEstadoFamilia } from "@/lib/armazenamento/hooks";
import { formatarMoedaInteira } from "@/lib/formatar";

export default function Inicio() {
  const estado = useEstadoFamilia();
  const d = useDiagnostico(estado);

  return (
    <>
      <h1 className="mb-4 text-3xl font-bold">apts</h1>
      {!estado || !d ? (
        <Carregando />
      ) : (
        <>
          <AvisoCalculo />
          <CartaoSemaforo diagnostico={d} />
          <Cartao titulo="Quanto dá para comprar hoje">
            <dl>
              <Valor
                rotulo={d.melhor ? `Preço máximo (${d.melhor.nome})` : "Preço máximo hoje"}
                valor={formatarMoedaInteira(d.melhor?.resultado.precoMaximo.SAC ?? 0)}
                destaque
              />
              {!d.melhor && d.potencial && (
                <Valor
                  rotulo={`Depois de limpar o nome (${d.potencial.nome})`}
                  valor={formatarMoedaInteira(d.potencial.resultado.precoMaximo.SAC)}
                />
              )}
            </dl>
          </Cartao>
          {d.bloqueios[0] && (
            <Cartao titulo="Próximo passo sugerido">
              <p className="text-lg font-semibold">{d.bloqueios[0].titulo}</p>
              <p className="mt-1 text-lg">{d.bloqueios[0].oQueFazer[0]}</p>
            </Cartao>
          )}
          <div className="flex flex-col gap-2">
            <BotaoLink href="/diagnostico">Por que estão negando?</BotaoLink>
            <BotaoLink href="/simulador" variante="secundario">
              Ver cenários de compra
            </BotaoLink>
            <BotaoLink href="/situacao" variante="secundario">
              Atualizar nossa situação
            </BotaoLink>
          </div>
        </>
      )}
    </>
  );
}
