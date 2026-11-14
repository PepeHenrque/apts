"use client";

import { useMemo, useState } from "react";
import { CartaoCenario, TabelaParcelas } from "@/components/calculo";
import { CampoData, CampoMarcar, CampoNumero, CampoSelecao } from "@/components/campos";
import { Aviso, AvisoCalculo, Botao, Carregando, EstadoVazio, TituloPagina } from "@/components/ui";
import { useEstadoFamilia } from "@/lib/armazenamento/hooks";
import { hoje, lerDataIso } from "@/lib/datas";
import { gerarCenarios, melhorCenario } from "@/lib/dominio/cenarios";
import {
  NOMES_SITUACAO,
  type EstadoFamilia,
  type SituacaoEmpregoPessoa,
} from "@/lib/dominio/esquemas";
import { formatarData } from "@/lib/formatar";

interface Ajuste {
  situacao?: SituacaoEmpregoPessoa;
  salario?: number;
  nomeLimpo?: boolean;
}

/** Aplica as mudanças do "e se…" numa cópia dos dados (os dados salvos não mudam). */
function aplicarAjustes(estado: EstadoFamilia, ajustes: Record<string, Ajuste>): EstadoFamilia {
  return {
    ...estado,
    pessoas: estado.pessoas.map((p) => {
      const a = ajustes[p.id];
      if (!a) return p;
      return {
        ...p,
        emprego: {
          ...p.emprego,
          situacao: a.situacao ?? p.emprego.situacao,
          salarioBruto: a.salario ?? p.emprego.salarioBruto,
          // No "e se" um emprego novo não tem data de fim.
          dataFimPrevista: a.situacao ? "" : p.emprego.dataFimPrevista,
        },
        cpf: a.nomeLimpo ? { negativado: false, dividas: [] } : p.cpf,
      };
    }),
  };
}

export default function PaginaSimulador() {
  const estado = useEstadoFamilia();
  const [ajustes, setAjustes] = useState<Record<string, Ajuste>>({});
  const [dataSimulacao, setDataSimulacao] = useState("");
  const [parcelasDe, setParcelasDe] = useState<string | null>(null);

  const calculo = useMemo(() => {
    if (!estado) return null;
    const data = lerDataIso(dataSimulacao) ?? hoje();
    const cenarios = gerarCenarios(aplicarAjustes(estado, ajustes), data);
    return { cenarios, melhor: melhorCenario(cenarios) };
  }, [estado, ajustes, dataSimulacao]);

  if (!estado || !calculo) return <Carregando />;

  const compradores = estado.pessoas.filter((p) => p.podeSerComprador);
  const temAjustes = Object.keys(ajustes).length > 0 || dataSimulacao !== "";
  const mudar = (id: string, dados: Ajuste) =>
    setAjustes((atual) => ({ ...atual, [id]: { ...atual[id], ...dados } }));
  const cenarioParcelas = calculo.cenarios.find((c) => c.id === parcelasDe) ?? null;

  const formulario = (
    <>
      <CampoData
        rotulo="Simular na data"
        ajuda="Deixe vazio para hoje. Ex.: depois do fim de um contrato."
        valor={dataSimulacao}
        aoMudar={setDataSimulacao}
      />
      {compradores.map((p) => {
        const a = ajustes[p.id] ?? {};
        return (
          <fieldset key={p.id} className="mb-3 rounded-md border border-borda bg-white p-3">
            <legend className="px-1 font-semibold">{p.nome}</legend>
            <CampoSelecao
              rotulo="Trabalho"
              valor={a.situacao ?? p.emprego.situacao}
              opcoes={NOMES_SITUACAO}
              aoMudar={(situacao) => mudar(p.id, { situacao })}
            />
            <CampoNumero
              rotulo="Salário bruto"
              moeda
              valor={a.salario ?? p.emprego.salarioBruto}
              aoMudar={(salario) => mudar(p.id, { salario })}
            />
            {p.cpf.negativado && (
              <CampoMarcar
                rotulo="E se limpar o nome?"
                marcado={a.nomeLimpo ?? false}
                aoMudar={(nomeLimpo) => mudar(p.id, { nomeLimpo })}
              />
            )}
          </fieldset>
        );
      })}
      {temAjustes && (
        <Botao
          variante="secundario"
          onClick={() => {
            setAjustes({});
            setDataSimulacao("");
          }}
        >
          Voltar para a situação real
        </Botao>
      )}
    </>
  );

  return (
    <>
      <TituloPagina
        idAjuda="simulador"
        ajuda={
          'Cada cartão é uma combinação de compradores. O preço máximo considera a parcela (até 30% da renda), o prazo pela idade do mais velho, o subsídio, o FGTS e o dinheiro guardado. Use "E se…?" para testar mudanças sem salvar.'
        }
        subtitulo="Cada combinação de compradores muda o prazo, a parcela e o preço máximo."
      >
        Simulador
      </TituloPagina>
      <AvisoCalculo />

      <div className="lg:grid lg:grid-cols-[minmax(0,21rem)_minmax(0,1fr)] lg:items-start lg:gap-8">
        <div className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto">
          <details
            className="mb-4 rounded-md border border-borda bg-superficie p-4 lg:hidden"
            open={temAjustes}
          >
            <summary className="min-h-11 cursor-pointer font-semibold text-primaria">
              E se…? Testar mudanças sem salvar
            </summary>
            <div className="mt-3">{formulario}</div>
          </details>
          <section
            aria-labelledby="titulo-e-se"
            className="mb-4 hidden rounded-md border border-borda bg-superficie p-5 shadow-sutil lg:block"
          >
            <h2 id="titulo-e-se" className="text-lg font-semibold">
              E se…?
            </h2>
            <p className="mb-4 text-sm text-texto-2">Teste mudanças sem alterar os dados salvos.</p>
            {formulario}
          </section>
        </div>
        <div>
          {temAjustes && (
            <Aviso tipo="info" titulo="Você está vendo uma simulação “e se…”.">
              {dataSimulacao && `Data simulada: ${formatarData(dataSimulacao)}. `}Os dados salvos
              não foram alterados.
            </Aviso>
          )}

          {compradores.length === 0 ? (
            <EstadoVazio titulo="Ninguém marcado como possível comprador">
              Em Situação → Pessoas, marque quem pode ser comprador.
            </EstadoVazio>
          ) : (
            <>
              {!calculo.melhor && (
                <Aviso tipo="perigo" titulo="Nenhum cenário é aprovável com estes dados.">
                  Veja abaixo o motivo de cada um e o valor possível se os bloqueios forem
                  resolvidos.
                </Aviso>
              )}
              {calculo.cenarios.map((c) => (
                <div key={c.id}>
                  <CartaoCenario
                    cenario={c}
                    ehMelhor={c.id === calculo.melhor?.id}
                    aoVerParcelas={() => setParcelasDe(parcelasDe === c.id ? null : c.id)}
                  />
                  {cenarioParcelas?.id === c.id && <TabelaParcelas cenario={cenarioParcelas} />}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </>
  );
}
