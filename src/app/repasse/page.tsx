"use client";

import { useState } from "react";
import { CampoNumero } from "@/components/campos";
import { ListaVerificacao } from "@/components/ListaVerificacao";
import { CHECKLIST_REPASSE } from "@/lib/dominio/checklists";
import { Aviso, AvisoCalculo, Cartao, Carregando, TituloPagina, Valor } from "@/components/ui";
import { useDiagnostico, useEstadoFamilia } from "@/lib/armazenamento/hooks";
import {
  custoCompraFinanciada,
  custoRepasse,
  type DadosRepasse,
} from "@/lib/financiamento/orcamento";
import { formatarMoedaInteira } from "@/lib/formatar";

export default function PaginaRepasse() {
  const estado = useEstadoFamilia();
  const diagnostico = useDiagnostico(estado);
  const [dados, setDados] = useState<DadosRepasse>({
    agio: 30000,
    saldoDevedor: 100000,
    parcelaAtual: 900,
    parcelasRestantes: 240,
    custosTransferencia: 5000,
  });
  if (!estado || !diagnostico) return <Carregando />;

  const repasse = custoRepasse(dados);
  const referencia = diagnostico.melhor ?? diagnostico.potencial;
  const compra = referencia
    ? custoCompraFinanciada(repasse.valorEquivalente, referencia.resultado)
    : null;
  const mudar = (d: Partial<DadosRepasse>) => setDados({ ...dados, ...d });

  return (
    <>
      <TituloPagina
        idAjuda="repasse"
        ajuda="Repasse é assumir o financiamento de outra pessoa. Aqui dá para comparar o custo com comprar outro imóvel financiado e conferir os cuidados."
        subtitulo="Comprar um imóvel que ainda está sendo pago por outra pessoa."
      >
        Repasse
      </TituloPagina>

      <Cartao titulo="O que é repasse?">
        <p className="">
          É quando alguém que está pagando um financiamento “passa” o imóvel para você. Você paga ao
          vendedor um valor pelo que ele já pagou (o <strong>ágio</strong>) e assume as parcelas que
          faltam.
        </p>
        <Aviso tipo="perigo" titulo="Cuidado com o “contrato de gaveta”">
          Se o financiamento continuar no nome do vendedor (sem transferência no banco), o imóvel
          não é seu de verdade: se ele morrer, tiver dívidas ou agir de má-fé, vocês podem perder o
          imóvel e o dinheiro.
        </Aviso>
        <p className="">
          O caminho seguro é a <strong>transferência formal</strong> do financiamento no banco. Para
          isso o banco <strong>analisa o crédito de quem compra</strong> — ou seja, nome sujo também
          bloqueia o repasse.
        </p>
      </Cartao>

      <Cartao titulo="Simular um repasse">
        <AvisoCalculo />
        <CampoNumero
          rotulo="Ágio pedido pelo vendedor"
          moeda
          valor={dados.agio}
          aoMudar={(agio) => mudar({ agio })}
        />
        <CampoNumero
          rotulo="Saldo devedor (quanto falta pagar ao banco)"
          moeda
          valor={dados.saldoDevedor}
          aoMudar={(saldoDevedor) => mudar({ saldoDevedor })}
        />
        <CampoNumero
          rotulo="Parcela atual"
          moeda
          valor={dados.parcelaAtual}
          aoMudar={(parcelaAtual) => mudar({ parcelaAtual })}
        />
        <CampoNumero
          rotulo="Parcelas que faltam"
          valor={dados.parcelasRestantes}
          aoMudar={(v) => mudar({ parcelasRestantes: Math.round(v) })}
        />
        <CampoNumero
          rotulo="Custos de transferência (cartório, ITBI, taxa do banco)"
          moeda
          valor={dados.custosTransferencia}
          aoMudar={(custosTransferencia) => mudar({ custosTransferencia })}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-md border border-borda p-3">
            <h3 className="font-semibold">Repasse</h3>
            <dl>
              <Valor rotulo="Pagar agora" valor={formatarMoedaInteira(repasse.desembolsoInicial)} />
              <Valor
                rotulo="Parcelas (total)"
                valor={formatarMoedaInteira(repasse.totalParcelas)}
              />
              <Valor
                rotulo="Custo total"
                valor={formatarMoedaInteira(repasse.custoTotal)}
                destaque
              />
            </dl>
          </div>
          <div className="rounded-md border border-borda p-3">
            <h3 className="font-semibold">
              Comprar outro de {formatarMoedaInteira(repasse.valorEquivalente)} financiado
            </h3>
            {compra ? (
              <dl>
                <Valor rotulo="Entrada" valor={formatarMoedaInteira(compra.entrada)} />
                <Valor
                  rotulo="Parcelas (total)"
                  valor={formatarMoedaInteira(compra.totalParcelas)}
                />
                <Valor
                  rotulo="Custo total"
                  valor={formatarMoedaInteira(compra.custoTotal)}
                  destaque
                />
              </dl>
            ) : (
              <p>Cadastre um comprador com renda para comparar.</p>
            )}
          </div>
        </div>
        {referencia && (
          <p className="mt-2 text-texto-2">
            Comparação usando o cenário “{referencia.nome}”
            {diagnostico.melhor ? "" : " (depois de limpar o nome)"}. O financiamento novo pode
            exigir entrada maior do que vocês têm.
          </p>
        )}
      </Cartao>

      <Cartao titulo="Checklist de segurança do repasse">
        <ListaVerificacao prefixo="repasse" itens={CHECKLIST_REPASSE} />
      </Cartao>
    </>
  );
}
