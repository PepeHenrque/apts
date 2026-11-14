"use client";

import { useMemo, useState } from "react";
import { CampoNumero } from "@/components/campos";
import { Aviso, AvisoCalculo, Cartao, Carregando, TituloPagina, Valor } from "@/components/ui";
import { useDiagnostico, useEstadoFamilia } from "@/lib/armazenamento/hooks";
import { hoje } from "@/lib/datas";
import { gerarDiagnostico } from "@/lib/dominio/diagnostico";
import { mesesParaJuntar } from "@/lib/financiamento/basico";
import { avaliarImovel } from "@/lib/financiamento/orcamento";
import { parcelaEmprestimo } from "@/lib/financiamento/sistemas";
import { formatarMoeda, formatarMoedaInteira, formatarPrazo } from "@/lib/formatar";

export default function PaginaEmprestimo() {
  const estado = useEstadoFamilia();
  const antes = useDiagnostico(estado);
  const [valorDigitado, setValor] = useState<number | null>(null);
  const [taxaMensal, setTaxa] = useState(3.5);
  const [parcelas, setParcelas] = useState(24);

  const referenciaAntes = antes?.melhor ?? antes?.potencial ?? null;
  const faltaSugerida =
    referenciaAntes && antes?.precoAlvo
      ? Math.round(avaliarImovel(antes.precoAlvo, referenciaAntes.resultado).faltaEntrada)
      : 10000;
  const valor = valorDigitado ?? faltaSugerida;
  const parcela = parcelaEmprestimo(valor, taxaMensal / 100, parcelas);

  const depois = useMemo(
    () => (estado ? gerarDiagnostico(estado, hoje(), { compromissosExtras: parcela }) : null),
    [estado, parcela],
  );

  if (!estado || !antes || !depois) return <Carregando />;

  const refAntes = antes.melhor ?? antes.potencial;
  const refDepois = depois.melhor ?? depois.potencial;
  const totalPago = parcela * parcelas;
  const meses = mesesParaJuntar(valor, estado.dinheiro.guardaPorMes);

  return (
    <>
      <TituloPagina subtitulo="Pegar dinheiro emprestado para dar de entrada: veja o efeito antes de decidir.">
        Empréstimo para a entrada
      </TituloPagina>
      <AvisoCalculo />
      <Aviso tipo="alerta" titulo="Isto não é recomendação nem aconselhamento financeiro.">
        Não indicamos nenhuma instituição. Compare sempre o custo efetivo total (CET) informado pelo
        banco.
      </Aviso>

      <Cartao titulo="Simular o empréstimo">
        <CampoNumero
          rotulo="Valor do empréstimo"
          ajuda={
            antes.precoAlvo
              ? "Começa com o que falta de entrada para o imóvel de referência."
              : undefined
          }
          moeda
          valor={valor}
          aoMudar={(v) => setValor(v)}
        />
        <CampoNumero rotulo="Juros por mês" sufixo="%" valor={taxaMensal} aoMudar={setTaxa} />
        <CampoNumero
          rotulo="Número de parcelas"
          valor={parcelas}
          aoMudar={(v) => setParcelas(Math.max(1, Math.round(v)))}
        />
        <dl>
          <Valor rotulo="Parcela do empréstimo" valor={formatarMoeda(parcela)} destaque />
          <Valor rotulo="Total pago" valor={formatarMoedaInteira(totalPago)} />
          <Valor rotulo="Só de juros" valor={formatarMoedaInteira(totalPago - valor)} />
        </dl>
      </Cartao>

      <Cartao titulo="Efeito no financiamento">
        <p className="mb-3">
          A parcela do empréstimo é descontada da parcela que o banco aceita (30% da renda). Por
          isso o preço máximo do imóvel <strong>cai</strong>.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md border border-borda p-3">
            <h3 className="font-semibold">Sem empréstimo</h3>
            <p className="text-sm text-texto-2">{refAntes?.nome ?? "—"}</p>
            <p className="mt-2 text-xl font-semibold">
              {formatarMoedaInteira(refAntes?.resultado.precoMaximo.SAC ?? 0)}
            </p>
            <p>Parcela máx.: {formatarMoeda(refAntes?.resultado.parcelaMaxima ?? 0)}</p>
          </div>
          <div className="rounded-md border border-[#e2c47a] p-3">
            <h3 className="font-semibold">Com empréstimo</h3>
            <p className="text-sm text-texto-2">{refDepois?.nome ?? "—"}</p>
            <p className="mt-2 text-xl font-semibold">
              {formatarMoedaInteira(refDepois?.resultado.precoMaximo.SAC ?? 0)}
            </p>
            <p>Parcela máx.: {formatarMoeda(refDepois?.resultado.parcelaMaxima ?? 0)}</p>
          </div>
        </div>
        <p className="mt-2 text-texto-2">
          O preço “com empréstimo” não inclui o dinheiro emprestado: some o valor emprestado à
          entrada apenas se o banco aceitar essa origem do dinheiro.
        </p>
        {!antes.melhor && <p className="mt-1 text-texto-2">Valores considerando o nome limpo.</p>}
      </Cartao>

      <Cartao titulo="Comparar com guardar dinheiro">
        <p className="">
          {meses === null
            ? "Cadastre em Situação → Dinheiro quanto conseguem guardar por mês para comparar."
            : `Guardando ${formatarMoedaInteira(estado.dinheiro.guardaPorMes)} por mês, vocês juntariam ${formatarMoedaInteira(valor)} em cerca de ${formatarPrazo(meses)} — sem pagar ${formatarMoedaInteira(totalPago - valor)} de juros.`}
        </p>
      </Cartao>

      <Cartao titulo="Atenção">
        <ul className="list-disc space-y-2 pl-6">
          <li>
            Com nome sujo, empréstimos costumam ter juros muito altos — às vezes mais de 10% ao mês.
          </li>
          <li>Consignado de aposentado tem limite (margem) e compromete a renda por anos.</li>
          <li>O banco pode perguntar a origem do dinheiro da entrada.</li>
          <li>Nunca pague “taxa adiantada” para liberar empréstimo: é golpe.</li>
        </ul>
      </Cartao>
    </>
  );
}
