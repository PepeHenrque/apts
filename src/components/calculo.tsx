"use client";

import { useState } from "react";
import { Botao, Selo, Valor } from "@/components/ui";
import type { Cenario } from "@/lib/dominio/cenarios";
import type { Diagnostico } from "@/lib/dominio/diagnostico";
import type { ResultadoCenario } from "@/lib/financiamento/capacidade";
import { avaliarImovel } from "@/lib/financiamento/orcamento";
import { evolucaoParcelas, type Sistema } from "@/lib/financiamento/sistemas";
import {
  formatarMoeda,
  formatarMoedaInteira,
  formatarPercentual,
  formatarPrazo,
} from "@/lib/formatar";

const ESTILO_SEMAFORO = {
  pronto: { classe: "border-green-600 bg-green-50", icone: "🟢", cor: "text-green-900" },
  quase: { classe: "border-amber-500 bg-amber-50", icone: "🟡", cor: "text-amber-950" },
  "ainda-nao": { classe: "border-red-600 bg-red-50", icone: "🔴", cor: "text-red-900" },
} as const;

export function CartaoSemaforo({ diagnostico }: { diagnostico: Diagnostico }) {
  const estilo = ESTILO_SEMAFORO[diagnostico.semaforo];
  return (
    <section
      aria-label="Situação geral"
      data-testid="semaforo"
      className={`mb-4 rounded-2xl border-4 p-5 ${estilo.classe}`}
    >
      <p className={`text-3xl font-bold ${estilo.cor}`}>
        <span aria-hidden="true">{estilo.icone} </span>
        {diagnostico.tituloSemaforo}
      </p>
      <p className="mt-2 text-lg">{diagnostico.resumo}</p>
    </section>
  );
}

const TEXTO_LIMITE: Record<ResultadoCenario["limitadoPor"], string> = {
  parcela: "O limite vem da parcela: ela não pode passar de 30% da renda.",
  entrada:
    "O limite vem da entrada: o banco financia só parte do imóvel; o resto precisa vir de subsídio, FGTS ou dinheiro de vocês.",
  teto: "O limite é o valor máximo de imóvel permitido nesta faixa do programa.",
};

export function CartaoCenario({
  cenario,
  ehMelhor,
  aoVerParcelas,
}: {
  cenario: Cenario;
  ehMelhor: boolean;
  aoVerParcelas?: () => void;
}) {
  const r = cenario.resultado;
  return (
    <section
      data-testid="cenario"
      className={`mb-4 rounded-2xl border-2 bg-white p-4 ${ehMelhor ? "border-green-600 ring-2 ring-green-600" : r.viavel ? "border-gray-300" : "border-gray-200 opacity-95"}`}
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xl font-bold">{cenario.nome}</h3>
        {ehMelhor ? (
          <Selo cor="verde">Melhor opção hoje</Selo>
        ) : r.viavel ? (
          <Selo cor="azul">Possível</Selo>
        ) : (
          <Selo cor="vermelho">Não aprovável hoje</Selo>
        )}
      </div>

      <p className="text-lg">
        {r.viavel ? "Imóvel de até" : "Se resolver os bloqueios, imóvel de até"}
      </p>
      <p className="text-4xl font-bold" data-testid="preco-maximo">
        {formatarMoedaInteira(r.precoMaximo.SAC)}
      </p>
      <p className="text-gray-700">
        (tabela SAC; na Price: {formatarMoedaInteira(r.precoMaximo.PRICE)})
      </p>

      {r.impedimentos.length > 0 && (
        <ul className="mt-3 space-y-1 rounded-xl bg-red-50 p-3 text-red-950">
          {r.impedimentos.map((i, n) => (
            <li key={n}>⛔ {i.mensagem}</li>
          ))}
        </ul>
      )}
      {r.avisos.length > 0 && (
        <ul className="mt-3 space-y-1 rounded-xl bg-amber-50 p-3 text-amber-950">
          {r.avisos.map((a, n) => (
            <li key={n}>⚠️ {a}</li>
          ))}
        </ul>
      )}

      <details className="mt-3">
        <summary className="min-h-12 cursor-pointer py-2 text-lg font-semibold text-blue-800">
          Ver como foi calculado
        </summary>
        <dl className="mt-2">
          <Valor rotulo="Programa" valor={`${r.nomeFaixa} (${r.jurosDivulgados})`} />
          <Valor
            rotulo="Juros usados na conta"
            valor={`${formatarPercentual(r.jurosNominalAnual)} ao ano`}
          />
          <Valor
            rotulo="Renda comprovada dos compradores"
            valor={formatarMoeda(r.rendaComprovada)}
          />
          <Valor
            rotulo="Renda da família (define a faixa)"
            valor={formatarMoeda(r.rendaFamiliar)}
          />
          <Valor
            rotulo="Prazo máximo"
            ajuda="Pela idade do comprador mais velho (até 80 anos e 6 meses)"
            valor={formatarPrazo(r.prazoMeses)}
          />
          <Valor
            rotulo="Parcela máxima"
            ajuda={
              r.compromissos > 0
                ? `30% da renda menos ${formatarMoeda(r.compromissos)} de outras parcelas`
                : "30% da renda"
            }
            valor={formatarMoeda(r.parcelaMaxima)}
          />
          <Valor
            rotulo="Seguro obrigatório (MIP) por mês"
            ajuda="Cresce com a idade; já descontado da parcela"
            valor={`${formatarPercentual(r.condicoes.taxaMip, 3)} do saldo`}
          />
          <Valor rotulo="Banco financia (SAC)" valor={formatarMoedaInteira(r.financiavel.SAC)} />
          <Valor
            rotulo="Banco financia (Price)"
            valor={formatarMoedaInteira(r.financiavel.PRICE)}
          />
          <Valor rotulo="Subsídio estimado" valor={formatarMoedaInteira(r.subsidio)} />
          <Valor rotulo="FGTS que pode usar" valor={formatarMoedaInteira(r.fgts)} />
          <Valor rotulo="Dinheiro da família" valor={formatarMoedaInteira(r.recursosProprios)} />
          <Valor
            rotulo="Preço máximo (SAC)"
            valor={formatarMoedaInteira(r.precoMaximo.SAC)}
            destaque
          />
        </dl>
        <p className="mt-2 text-gray-800">{TEXTO_LIMITE[r.limitadoPor]}</p>
        <p className="mt-2 text-gray-700">
          SAC: a primeira parcela é a maior e elas vão diminuindo. Price: parcelas quase iguais,
          financia um pouco mais, mas paga mais juros no total.
        </p>
      </details>

      {aoVerParcelas && r.financiavel.SAC > 0 && (
        <Botao variante="secundario" className="mt-3 w-full" onClick={aoVerParcelas}>
          Ver parcelas mês a mês
        </Botao>
      )}
    </section>
  );
}

export function TabelaParcelas({ cenario }: { cenario: Cenario }) {
  const [sistema, setSistema] = useState<Sistema>("SAC");
  const r = cenario.resultado;
  const preco = r.precoMaximo[sistema];
  const financiado = avaliarImovel(preco, r, sistema).financiado;
  const ev = evolucaoParcelas(sistema, financiado, r.condicoes, 12);

  return (
    <section
      aria-labelledby="titulo-parcelas"
      className="mb-4 rounded-2xl border-2 border-blue-300 bg-white p-4"
    >
      <h3 id="titulo-parcelas" className="text-xl font-bold">
        Parcelas — {cenario.nome}
      </h3>
      <div role="radiogroup" aria-label="Sistema de amortização" className="my-3 flex gap-2">
        {(["SAC", "PRICE"] as const).map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={sistema === s}
            onClick={() => setSistema(s)}
            className={`min-h-12 flex-1 rounded-xl border-2 font-semibold ${sistema === s ? "border-blue-700 bg-blue-700 text-white" : "border-gray-300 bg-white"}`}
          >
            {s === "SAC" ? "SAC" : "Price"}
          </button>
        ))}
      </div>
      <p className="mb-2">
        Imóvel de {formatarMoedaInteira(preco)}, financiando {formatarMoedaInteira(financiado)} em{" "}
        {formatarPrazo(r.condicoes.prazoMeses)}.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-base">
          <caption className="sr-only">Primeiros 12 meses</caption>
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th scope="col" className="py-2 pr-2">
                Mês
              </th>
              <th scope="col" className="py-2 pr-2">
                Parcela
              </th>
              <th scope="col" className="py-2 pr-2">
                Juros
              </th>
              <th scope="col" className="py-2 pr-2">
                Seguro+taxa
              </th>
              <th scope="col" className="py-2">
                Saldo
              </th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {ev.linhas.map((l) => (
              <tr key={l.mes} className="border-b border-gray-100">
                <td className="py-1 pr-2">{l.mes}</td>
                <td className="py-1 pr-2 font-semibold">{formatarMoeda(l.parcela)}</td>
                <td className="py-1 pr-2">{formatarMoeda(l.juros)}</td>
                <td className="py-1 pr-2">{formatarMoeda(l.seguro + l.taxa)}</td>
                <td className="py-1">{formatarMoedaInteira(l.saldoDepois)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <dl className="mt-3">
        <Valor rotulo="Última parcela" valor={formatarMoeda(ev.ultimaParcela)} />
        <Valor rotulo="Total de juros" valor={formatarMoedaInteira(ev.totalJuros)} />
        <Valor rotulo="Total pago ao banco" valor={formatarMoedaInteira(ev.totalPago)} destaque />
      </dl>
    </section>
  );
}
