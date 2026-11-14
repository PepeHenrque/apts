"use client";

import { useState } from "react";
import {
  CampoData,
  CampoMarcar,
  CampoNumero,
  CampoSelecao,
  CampoTexto,
  errosPorCampo,
} from "@/components/campos";
import { Aviso, Botao, Cartao } from "@/components/ui";
import { hoje } from "@/lib/datas";
import {
  esquemaPessoa,
  NOMES_SITUACAO,
  NOMES_STATUS_DIVIDA,
  novoId,
  type Pessoa,
} from "@/lib/dominio/esquemas";
import { idadeEmAnos } from "@/lib/financiamento/basico";
import { REGRAS } from "@/config/regras-mcmv";

export function FormPessoa({
  inicial,
  aoSalvar,
  aoCancelar,
}: {
  inicial: Pessoa;
  aoSalvar: (p: Pessoa) => void;
  aoCancelar: () => void;
}) {
  const [p, setP] = useState<Pessoa>(inicial);
  const [erros, setErros] = useState<Record<string, string>>({});

  const mudarEmprego = (dados: Partial<Pessoa["emprego"]>) =>
    setP((x) => ({ ...x, emprego: { ...x.emprego, ...dados } }));
  const mudarDivida = (id: string, dados: Partial<Pessoa["cpf"]["dividas"][number]>) =>
    setP((x) => ({
      ...x,
      cpf: { ...x.cpf, dividas: x.cpf.dividas.map((d) => (d.id === id ? { ...d, ...dados } : d)) },
    }));
  const mudarCompromisso = (id: string, dados: Partial<Pessoa["compromissos"][number]>) =>
    setP((x) => ({
      ...x,
      compromissos: x.compromissos.map((c) => (c.id === id ? { ...c, ...dados } : c)),
    }));

  function salvar() {
    const resultado = esquemaPessoa.safeParse(p);
    if (!resultado.success) {
      setErros(errosPorCampo(resultado.error));
      return;
    }
    setErros({});
    aoSalvar(resultado.data);
  }

  const idade = idadeEmAnos(p.dataNascimento, hoje());
  const temErros = Object.keys(erros).length > 0;
  const semRenda = p.emprego.situacao === "desempregado";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        salvar();
      }}
      noValidate
    >
      {temErros && <Aviso tipo="perigo" titulo="Confira os campos marcados em vermelho." />}

      <Cartao titulo="Dados básicos">
        <CampoTexto
          rotulo="Nome"
          valor={p.nome}
          aoMudar={(nome) => setP({ ...p, nome })}
          erro={erros.nome}
        />
        <CampoData
          rotulo="Data de nascimento"
          ajuda={idade > 0 ? `Idade: ${idade} anos` : undefined}
          valor={p.dataNascimento}
          aoMudar={(dataNascimento) => setP({ ...p, dataNascimento })}
          erro={erros.dataNascimento}
        />
        <CampoMarcar
          rotulo="Vai morar no imóvel"
          ajuda="A renda de quem vai morar conta para a faixa do Minha Casa Minha Vida."
          marcado={p.vaiMorar}
          aoMudar={(vaiMorar) => setP({ ...p, vaiMorar })}
        />
        <CampoMarcar
          rotulo="Pode ser comprador(a)"
          ajuda="Quem pode assinar o financiamento (sozinho ou junto com outros)."
          marcado={p.podeSerComprador}
          aoMudar={(podeSerComprador) => setP({ ...p, podeSerComprador })}
        />
      </Cartao>

      <Cartao titulo="Trabalho e renda">
        <CampoSelecao
          rotulo="Situação de trabalho"
          valor={p.emprego.situacao}
          opcoes={NOMES_SITUACAO}
          aoMudar={(situacao) => mudarEmprego({ situacao })}
        />
        {!semRenda && (
          <>
            <CampoTexto
              rotulo="Empresa ou ocupação"
              valor={p.emprego.ocupacao}
              aoMudar={(ocupacao) => mudarEmprego({ ocupacao })}
            />
            <CampoNumero
              rotulo="Salário bruto por mês"
              ajuda="O valor antes dos descontos (o que aparece no holerite como salário)."
              moeda
              valor={p.emprego.salarioBruto}
              aoMudar={(salarioBruto) => mudarEmprego({ salarioBruto })}
              erro={erros["emprego.salarioBruto"]}
            />
            <CampoData
              rotulo="Começou em (opcional)"
              valor={p.emprego.dataInicio}
              aoMudar={(dataInicio) => mudarEmprego({ dataInicio })}
              erro={erros["emprego.dataInicio"]}
            />
            <CampoData
              rotulo="Data prevista de fim (se for contrato com prazo)"
              ajuda="Ex.: fim do contrato de jovem aprendiz. O app avisa e recalcula a partir dessa data."
              valor={p.emprego.dataFimPrevista}
              aoMudar={(dataFimPrevista) => mudarEmprego({ dataFimPrevista })}
              erro={erros["emprego.dataFimPrevista"]}
            />
          </>
        )}
        {!REGRAS.situacoesRendaComprovada.includes(p.emprego.situacao) && !semRenda && (
          <Aviso tipo="alerta">
            Essa renda não é aceita pelo banco como comprovada. Ela conta para a faixa do MCMV, mas
            não para a parcela.
          </Aviso>
        )}
      </Cartao>

      <Cartao titulo="Nome (CPF)">
        <CampoMarcar
          rotulo="CPF negativado (nome sujo)"
          ajuda="Marque se há dívida registrada no SPC/Serasa, mesmo que já esteja negociando."
          marcado={p.cpf.negativado}
          aoMudar={(negativado) => setP({ ...p, cpf: { ...p.cpf, negativado } })}
        />
        {p.cpf.negativado && (
          <div>
            <h3 className="mb-2 font-semibold">Dívidas</h3>
            {p.cpf.dividas.length === 0 && (
              <p className="mb-3 text-texto-2">
                Cadastre as dívidas. Quando todas estiverem pagas, o app passa a mostrar “aguardando
                atualização do score”.
              </p>
            )}
            {p.cpf.dividas.map((d, i) => (
              <fieldset key={d.id} className="mb-4 rounded-md border border-borda p-3">
                <legend className="px-1 font-semibold">Dívida {i + 1}</legend>
                <CampoTexto
                  rotulo="Credor (para quem deve)"
                  valor={d.credor}
                  aoMudar={(credor) => mudarDivida(d.id, { credor })}
                  erro={erros[`cpf.dividas.${i}.credor`]}
                />
                <CampoNumero
                  rotulo="Valor"
                  moeda
                  valor={d.valor}
                  aoMudar={(valor) => mudarDivida(d.id, { valor })}
                />
                <CampoSelecao
                  rotulo="Situação"
                  valor={d.status}
                  opcoes={NOMES_STATUS_DIVIDA}
                  aoMudar={(status) => mudarDivida(d.id, { status })}
                />
                {d.status === "pago" && (
                  <CampoData
                    rotulo="Data do pagamento"
                    valor={d.dataPagamento}
                    aoMudar={(dataPagamento) => mudarDivida(d.id, { dataPagamento })}
                    erro={erros[`cpf.dividas.${i}.dataPagamento`]}
                  />
                )}
                <Botao
                  variante="perigo"
                  onClick={() =>
                    setP({
                      ...p,
                      cpf: { ...p.cpf, dividas: p.cpf.dividas.filter((x) => x.id !== d.id) },
                    })
                  }
                >
                  Remover dívida
                </Botao>
              </fieldset>
            ))}
            <Botao
              variante="secundario"
              onClick={() =>
                setP({
                  ...p,
                  cpf: {
                    ...p.cpf,
                    dividas: [
                      ...p.cpf.dividas,
                      { id: novoId(), credor: "", valor: 0, status: "aberto", dataPagamento: "" },
                    ],
                  },
                })
              }
            >
              Adicionar dívida
            </Botao>
          </div>
        )}
      </Cartao>

      <Cartao titulo="FGTS">
        <CampoNumero
          rotulo="Saldo do FGTS"
          ajuda="Veja no app FGTS (Caixa)."
          moeda
          valor={p.fgts.saldo}
          aoMudar={(saldo) => setP({ ...p, fgts: { ...p.fgts, saldo } })}
        />
        <CampoMarcar
          rotulo={`Tem ${REGRAS.fgtsAnosMinimos} anos ou mais de trabalho com FGTS (somando todos os empregos)`}
          ajuda="Só assim o FGTS pode ser usado na compra."
          marcado={p.fgts.tem3Anos}
          aoMudar={(tem3Anos) => setP({ ...p, fgts: { ...p.fgts, tem3Anos } })}
        />
      </Cartao>

      <Cartao titulo="Outras parcelas mensais">
        <p className="mb-3 text-texto-2">
          Empréstimos, cartão parcelado, consignado… Elas diminuem a parcela que o banco aceita.
        </p>
        {p.compromissos.map((c, i) => (
          <fieldset key={c.id} className="mb-4 rounded-md border border-borda p-3">
            <legend className="px-1 font-semibold">Parcela {i + 1}</legend>
            <CampoTexto
              rotulo="O que é"
              valor={c.descricao}
              aoMudar={(descricao) => mudarCompromisso(c.id, { descricao })}
              erro={erros[`compromissos.${i}.descricao`]}
            />
            <CampoNumero
              rotulo="Valor por mês"
              moeda
              valor={c.valorMensal}
              aoMudar={(valorMensal) => mudarCompromisso(c.id, { valorMensal })}
            />
            <Botao
              variante="perigo"
              onClick={() =>
                setP({ ...p, compromissos: p.compromissos.filter((x) => x.id !== c.id) })
              }
            >
              Remover parcela
            </Botao>
          </fieldset>
        ))}
        <Botao
          variante="secundario"
          onClick={() =>
            setP({
              ...p,
              compromissos: [...p.compromissos, { id: novoId(), descricao: "", valorMensal: 0 }],
            })
          }
        >
          Adicionar parcela mensal
        </Botao>
      </Cartao>

      <Cartao titulo="Imóvel">
        <CampoMarcar
          rotulo="Já tem imóvel no nome"
          ajuda="Quem já tem imóvel não pode usar o Minha Casa Minha Vida."
          marcado={p.temImovel}
          aoMudar={(temImovel) => setP({ ...p, temImovel })}
        />
      </Cartao>

      <div className="sticky bottom-36 z-10 flex gap-2 rounded-md bg-fundo/95 py-3">
        <Botao type="submit" className="flex-1">
          Salvar
        </Botao>
        <Botao variante="secundario" onClick={aoCancelar}>
          Cancelar
        </Botao>
      </div>
    </form>
  );
}
