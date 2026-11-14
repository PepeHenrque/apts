"use client";

import { useState } from "react";
import { FormPessoa } from "@/components/situacao/FormPessoa";
import { Botao, Cartao, Carregando, EstadoVazio, Selo, confirmar } from "@/components/ui";
import { useEstadoFamilia } from "@/lib/armazenamento/hooks";
import { atualizarEstado } from "@/lib/armazenamento/loja";
import { hoje } from "@/lib/datas";
import { rendaNaData, situacaoCpfNaData } from "@/lib/dominio/cenarios";
import { NOMES_SITUACAO, pessoaEmBranco, type Pessoa } from "@/lib/dominio/esquemas";
import { descreverMudancasPessoa } from "@/lib/dominio/historico";
import { idadeEmAnos } from "@/lib/financiamento/basico";
import { formatarData, formatarMoeda } from "@/lib/formatar";

function SeloCpf({ pessoa }: { pessoa: Pessoa }) {
  const situacao = situacaoCpfNaData(pessoa, hoje());
  if (situacao === "limpo") return <Selo cor="verde">Nome limpo</Selo>;
  if (situacao === "aguardando-score") return <Selo cor="amarelo">Aguardando score</Selo>;
  return <Selo cor="vermelho">Nome sujo</Selo>;
}

function ResumoPessoa({ pessoa }: { pessoa: Pessoa }) {
  const data = hoje();
  const renda = rendaNaData(pessoa, data);
  const { emprego } = pessoa;
  return (
    <div className="space-y-2">
      <p className="text-lg">
        {idadeEmAnos(pessoa.dataNascimento, data)} anos · {NOMES_SITUACAO[emprego.situacao]}
        {emprego.situacao !== "desempregado" && emprego.salarioBruto > 0 && (
          <> · {formatarMoeda(emprego.salarioBruto)}/mês</>
        )}
      </p>
      <div className="flex flex-wrap gap-2">
        <SeloCpf pessoa={pessoa} />
        {pessoa.podeSerComprador ? (
          <Selo cor="azul">Pode comprar</Selo>
        ) : (
          <Selo cor="cinza">Não compra</Selo>
        )}
        {!pessoa.vaiMorar && <Selo cor="cinza">Não vai morar</Selo>}
        {renda.naoComprovada > 0 && <Selo cor="amarelo">Renda não comprovada</Selo>}
        {pessoa.temImovel && <Selo cor="vermelho">Já tem imóvel</Selo>}
      </div>
      {emprego.dataFimPrevista && emprego.situacao !== "desempregado" && (
        <p className="text-gray-800">Contrato até {formatarData(emprego.dataFimPrevista)}.</p>
      )}
    </div>
  );
}

export default function PaginaPessoas() {
  const estado = useEstadoFamilia();
  const [editando, setEditando] = useState<{ pessoa: Pessoa; nova: boolean } | null>(null);

  if (!estado) return <Carregando />;

  if (editando) {
    const antes = estado.pessoas.find((p) => p.id === editando.pessoa.id) ?? null;
    return (
      <>
        <h2 className="mb-3 text-2xl font-bold">
          {editando.nova ? "Nova pessoa" : `Editar ${editando.pessoa.nome}`}
        </h2>
        <FormPessoa
          inicial={editando.pessoa}
          aoCancelar={() => setEditando(null)}
          aoSalvar={(pessoa) => {
            atualizarEstado(descreverMudancasPessoa(antes, pessoa), (e) => ({
              ...e,
              pessoas: antes
                ? e.pessoas.map((x) => (x.id === pessoa.id ? pessoa : x))
                : [...e.pessoas, pessoa],
            }));
            setEditando(null);
          }}
        />
      </>
    );
  }

  return (
    <>
      {estado.pessoas.length === 0 && (
        <EstadoVazio titulo="Nenhuma pessoa cadastrada">
          Adicione quem vai morar no imóvel e quem pode ser comprador.
        </EstadoVazio>
      )}
      {estado.pessoas.map((pessoa) => (
        <Cartao
          key={pessoa.id}
          titulo={pessoa.nome}
          acoes={
            <div className="flex gap-2">
              <Botao variante="secundario" onClick={() => setEditando({ pessoa, nova: false })}>
                Editar
              </Botao>
              <Botao
                variante="perigo"
                aria-label={`Remover ${pessoa.nome}`}
                onClick={() => {
                  if (!confirmar(`Remover ${pessoa.nome}?`)) return;
                  atualizarEstado(`Removeu ${pessoa.nome}`, (e) => ({
                    ...e,
                    pessoas: e.pessoas.filter((x) => x.id !== pessoa.id),
                  }));
                }}
              >
                Remover
              </Botao>
            </div>
          }
        >
          <ResumoPessoa pessoa={pessoa} />
        </Cartao>
      ))}
      <Botao
        className="mt-2 w-full"
        onClick={() => setEditando({ pessoa: pessoaEmBranco(), nova: true })}
      >
        + Adicionar pessoa
      </Botao>
    </>
  );
}
