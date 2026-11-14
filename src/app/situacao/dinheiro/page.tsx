"use client";

import { useState } from "react";
import { CampoNumero } from "@/components/campos";
import { Aviso, AvisoCalculo, Botao, Cartao, Carregando, Valor } from "@/components/ui";
import { useDiagnostico, useEstadoFamilia } from "@/lib/armazenamento/hooks";
import { atualizarEstado } from "@/lib/armazenamento/loja";
import type { Dinheiro } from "@/lib/dominio/esquemas";
import { mesesParaJuntar } from "@/lib/financiamento/basico";
import { avaliarImovel } from "@/lib/financiamento/orcamento";
import { formatarMoedaInteira, formatarPrazo } from "@/lib/formatar";

function FormDinheiro({ inicial }: { inicial: Dinheiro }) {
  const [d, setD] = useState(inicial);
  const [salvo, setSalvo] = useState(false);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        atualizarEstado("Atualizou o dinheiro disponível", (estado) => ({
          ...estado,
          dinheiro: d,
        }));
        setSalvo(true);
      }}
    >
      <Cartao titulo="Dinheiro disponível">
        <CampoNumero
          rotulo="Dinheiro guardado para a entrada"
          moeda
          valor={d.entrada}
          aoMudar={(entrada) => {
            setSalvo(false);
            setD({ ...d, entrada });
          }}
        />
        <CampoNumero
          rotulo="Quanto conseguem guardar por mês"
          moeda
          valor={d.guardaPorMes}
          aoMudar={(guardaPorMes) => {
            setSalvo(false);
            setD({ ...d, guardaPorMes });
          }}
        />
        <CampoNumero
          rotulo="Outros recursos (ajuda de parente, venda de algo…)"
          moeda
          valor={d.outrosRecursos}
          aoMudar={(outrosRecursos) => {
            setSalvo(false);
            setD({ ...d, outrosRecursos });
          }}
        />
        <Botao type="submit" className="w-full">
          Salvar
        </Botao>
        {salvo && (
          <p role="status" className="mt-2 font-semibold text-ok">
            Dinheiro disponível salvo.
          </p>
        )}
      </Cartao>
    </form>
  );
}

export default function PaginaDinheiro() {
  const estado = useEstadoFamilia();
  const diagnostico = useDiagnostico(estado);
  if (!estado || !diagnostico) return <Carregando />;

  const referencia = diagnostico.melhor ?? diagnostico.potencial;
  const alvo = diagnostico.precoAlvo;
  const avaliacao = referencia && alvo ? avaliarImovel(alvo, referencia.resultado) : null;
  const meses = avaliacao
    ? mesesParaJuntar(avaliacao.faltaEntrada, estado.dinheiro.guardaPorMes)
    : null;

  return (
    <>
      <FormDinheiro key={JSON.stringify(estado.dinheiro)} inicial={estado.dinheiro} />
      {avaliacao && alvo && (
        <Cartao titulo="Quanto falta para a entrada">
          <AvisoCalculo />
          <dl>
            <Valor
              rotulo="Imóvel de referência"
              ajuda="Média dos imóveis salvos ou da última recusa"
              valor={formatarMoedaInteira(alvo)}
            />
            <Valor
              rotulo="Entrada necessária (depois de subsídio e FGTS)"
              valor={formatarMoedaInteira(avaliacao.entradaNecessaria)}
            />
            <Valor
              rotulo="Vocês têm"
              valor={formatarMoedaInteira(estado.dinheiro.entrada + estado.dinheiro.outrosRecursos)}
            />
            <Valor rotulo="Falta" valor={formatarMoedaInteira(avaliacao.faltaEntrada)} destaque />
          </dl>
          {avaliacao.faltaEntrada > 0 && (
            <Aviso tipo={meses === null ? "alerta" : "info"}>
              {meses === null
                ? "Cadastre quanto conseguem guardar por mês para ver em quanto tempo chegam lá."
                : `Guardando ${formatarMoedaInteira(estado.dinheiro.guardaPorMes)} por mês, levaria cerca de ${formatarPrazo(meses)}.`}
            </Aviso>
          )}
          {!diagnostico.melhor && (
            <p className="text-texto-2">
              Calculado com o cenário que fica possível depois de limpar o nome ({referencia?.nome}
              ).
            </p>
          )}
        </Cartao>
      )}
    </>
  );
}
