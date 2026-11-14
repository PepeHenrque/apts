"use client";

import { useState, type ReactNode } from "react";
import {
  CampoAreaTexto,
  CampoMarcar,
  CampoNumero,
  CampoSelecao,
  CampoTexto,
  errosPorCampo,
} from "@/components/campos";
import { Aviso, Botao, Cartao } from "@/components/ui";
import {
  esquemaImovel,
  NOMES_SIM_NAO_NAO_SEI,
  NOMES_STATUS_IMOVEL,
  NOMES_TIPO_IMOVEL,
  type Imovel,
} from "@/lib/dominio/esquemas";
import { extrairDoTexto } from "@/lib/dominio/imoveis";

export function FormImovel({
  inicial,
  aoSalvar,
  aoCancelar,
  previa,
  extraTexto,
}: {
  inicial: Imovel;
  aoSalvar: (i: Imovel) => void;
  aoCancelar: () => void;
  /** Mostra a prévia "cabe no orçamento?" para o preço digitado. */
  previa?: (preco: number) => ReactNode;
  /** Espaço para botões extras perto do texto colado (ex.: "Preencher com IA"). */
  extraTexto?: (texto: string, aplicar: (dados: Partial<Imovel>) => void) => ReactNode;
}) {
  const [im, setIm] = useState(inicial);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [texto, setTexto] = useState("");
  const [aviso, setAviso] = useState("");
  const mudar = (dados: Partial<Imovel>) => setIm((x) => ({ ...x, ...dados }));
  const mudarEndereco = (dados: Partial<Imovel>) => mudar({ ...dados, lat: null, lon: null });
  const aplicar = (dados: Partial<Imovel>) => {
    mudar(dados);
    setAviso(
      Object.keys(dados).length
        ? "Campos preenchidos a partir do texto. Confira tudo antes de salvar."
        : "Não encontramos números no texto. Preencha manualmente.",
    );
  };

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const resultado = esquemaImovel.safeParse(im);
        if (!resultado.success) return setErros(errosPorCampo(resultado.error));
        aoSalvar(resultado.data);
      }}
    >
      {Object.keys(erros).length > 0 && (
        <Aviso tipo="perigo" titulo="Confira os campos marcados." />
      )}

      <Cartao titulo="Colar anúncio (opcional)">
        <CampoAreaTexto
          rotulo="Cole aqui o texto do anúncio"
          ajuda="Copie o texto do OLX, Facebook etc. e cole aqui."
          linhas={4}
          valor={texto}
          aoMudar={setTexto}
        />
        <div className="flex flex-wrap gap-2">
          <Botao
            variante="secundario"
            disabled={!texto.trim()}
            onClick={() => {
              const d = extrairDoTexto(texto);
              aplicar({
                ...d,
                link: d.link ?? im.link,
                observacoes: im.observacoes || texto.slice(0, 500),
              });
            }}
          >
            Preencher a partir do texto
          </Botao>
          {extraTexto?.(texto, aplicar)}
        </div>
        {aviso && (
          <p role="status" className="mt-2 font-semibold text-blue-900">
            {aviso}
          </p>
        )}
      </Cartao>

      <Cartao titulo="Dados do imóvel">
        <CampoTexto
          rotulo="Nome do imóvel"
          ajuda="Ex.: Apto 2 quartos no Centro"
          valor={im.titulo}
          aoMudar={(titulo) => mudar({ titulo })}
          erro={erros.titulo}
        />
        <CampoTexto
          rotulo="Link do anúncio"
          tipo="url"
          valor={im.link}
          aoMudar={(link) => mudar({ link })}
        />
        <CampoNumero
          rotulo="Preço"
          moeda
          valor={im.preco}
          aoMudar={(preco) => mudar({ preco })}
          erro={erros.preco}
        />
        {previa && im.preco > 0 && previa(im.preco)}
        <CampoSelecao
          rotulo="Tipo"
          valor={im.tipo}
          opcoes={NOMES_TIPO_IMOVEL}
          aoMudar={(tipo) => mudar({ tipo })}
        />
        <div className="grid grid-cols-2 gap-x-3">
          <CampoNumero
            rotulo="Quartos"
            valor={im.quartos}
            aoMudar={(v) => mudar({ quartos: Math.round(v) })}
          />
          <CampoNumero
            rotulo="Banheiros"
            valor={im.banheiros}
            aoMudar={(v) => mudar({ banheiros: Math.round(v) })}
          />
          <CampoNumero
            rotulo="Vagas"
            valor={im.vagas}
            aoMudar={(v) => mudar({ vagas: Math.round(v) })}
          />
          <CampoNumero
            rotulo="Área"
            sufixo="m²"
            valor={im.area}
            aoMudar={(area) => mudar({ area })}
          />
        </div>
        <CampoNumero
          rotulo="Condomínio por mês"
          moeda
          valor={im.condominio}
          aoMudar={(condominio) => mudar({ condominio })}
        />
        <CampoNumero
          rotulo="IPTU por ano"
          moeda
          valor={im.iptu}
          aoMudar={(iptu) => mudar({ iptu })}
        />
        <CampoSelecao
          rotulo="Aceita financiamento?"
          valor={im.aceitaFinanciamento}
          opcoes={NOMES_SIM_NAO_NAO_SEI}
          aoMudar={(aceitaFinanciamento) => mudar({ aceitaFinanciamento })}
        />
        <CampoSelecao
          rotulo="Situação"
          valor={im.status}
          opcoes={NOMES_STATUS_IMOVEL}
          aoMudar={(status) => mudar({ status })}
        />
      </Cartao>

      <Cartao titulo="Endereço">
        <CampoTexto
          rotulo="Rua e número"
          valor={im.endereco}
          aoMudar={(endereco) => mudarEndereco({ endereco })}
        />
        <CampoTexto
          rotulo="Bairro"
          valor={im.bairro}
          aoMudar={(bairro) => mudarEndereco({ bairro })}
        />
        <CampoTexto
          rotulo="Cidade"
          valor={im.cidade}
          aoMudar={(cidade) => mudarEndereco({ cidade })}
        />
      </Cartao>

      <Cartao titulo="Repasse">
        <CampoMarcar
          rotulo="É repasse (assumir o financiamento de alguém)"
          marcado={im.ehRepasse}
          aoMudar={(ehRepasse) => mudar({ ehRepasse })}
        />
        {im.ehRepasse && (
          <>
            <CampoNumero
              rotulo="Ágio pedido"
              moeda
              valor={im.repasse.agio}
              aoMudar={(agio) => mudar({ repasse: { ...im.repasse, agio } })}
            />
            <CampoNumero
              rotulo="Saldo devedor"
              moeda
              valor={im.repasse.saldoDevedor}
              aoMudar={(saldoDevedor) => mudar({ repasse: { ...im.repasse, saldoDevedor } })}
            />
            <CampoNumero
              rotulo="Parcela atual"
              moeda
              valor={im.repasse.parcela}
              aoMudar={(parcela) => mudar({ repasse: { ...im.repasse, parcela } })}
            />
            <CampoNumero
              rotulo="Parcelas que faltam"
              valor={im.repasse.parcelasRestantes}
              aoMudar={(v) =>
                mudar({ repasse: { ...im.repasse, parcelasRestantes: Math.round(v) } })
              }
            />
            <CampoTexto
              rotulo="Banco do financiamento"
              valor={im.repasse.banco}
              aoMudar={(banco) => mudar({ repasse: { ...im.repasse, banco } })}
            />
          </>
        )}
      </Cartao>

      <Cartao titulo="Anotações">
        <CampoAreaTexto
          rotulo="Observações"
          valor={im.observacoes}
          aoMudar={(observacoes) => mudar({ observacoes })}
        />
        <CampoAreaTexto
          rotulo="Links de fotos (um por linha)"
          valor={im.fotos.join("\n")}
          aoMudar={(v) =>
            mudar({
              fotos: v
                .split("\n")
                .map((l) => l.trim())
                .filter(Boolean),
            })
          }
        />
      </Cartao>

      <div className="sticky bottom-36 z-10 flex gap-2 rounded-2xl bg-gray-50/95 py-3">
        <Botao type="submit" className="flex-1">
          Salvar imóvel
        </Botao>
        <Botao variante="secundario" onClick={aoCancelar}>
          Cancelar
        </Botao>
      </div>
    </form>
  );
}
