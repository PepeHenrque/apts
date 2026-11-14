"use client";

import { useState } from "react";
import { CampoNumero, CampoSelecao, CampoTexto, errosPorCampo } from "@/components/campos";
import { ListaLocais } from "@/components/situacao/ListaLocais";
import { Aviso, Botao, Cartao, Carregando } from "@/components/ui";
import { useEstadoFamilia } from "@/lib/armazenamento/hooks";
import { atualizarEstado } from "@/lib/armazenamento/loja";
import {
  esquemaPreferencias,
  NOMES_ACESSO,
  NOMES_CONDICAO,
  NOMES_SIM_NAO_TALVEZ,
  NOMES_TIPO_IMOVEL,
  type Preferencias,
} from "@/lib/dominio/esquemas";

function FormPreferencias({ inicial }: { inicial: Preferencias }) {
  const [p, setP] = useState(inicial);
  const [mensagem, setMensagem] = useState("");
  const [erros, setErros] = useState<Record<string, string>>({});
  const mudar = (dados: Partial<Preferencias>) => {
    setMensagem("");
    setP({ ...p, ...dados });
  };

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const resultado = esquemaPreferencias.safeParse({
          ...p,
          locaisDesejados: p.locaisDesejados.filter((l) => l.nome.trim()),
          pontosImportantes: p.pontosImportantes.filter((l) => l.nome.trim()),
        });
        if (!resultado.success) {
          setErros(errosPorCampo(resultado.error));
          return;
        }
        setErros({});
        atualizarEstado("Atualizou as preferências de imóvel", (estado) => ({
          ...estado,
          preferencias: resultado.data,
        }));
        setMensagem("Salvo!");
      }}
    >
      {Object.keys(erros).length > 0 && <Aviso tipo="perigo" titulo="Confira os campos." />}
      <Cartao titulo="Tipo de imóvel">
        <CampoSelecao
          rotulo="Tipo"
          valor={p.tipo}
          opcoes={NOMES_TIPO_IMOVEL}
          aoMudar={(tipo) => mudar({ tipo })}
        />
        <CampoSelecao
          rotulo="Novo ou usado"
          valor={p.condicao}
          opcoes={NOMES_CONDICAO}
          aoMudar={(condicao) => mudar({ condicao })}
        />
        <CampoNumero
          rotulo="Quartos (mínimo)"
          valor={p.quartosMin}
          aoMudar={(v) => mudar({ quartosMin: Math.round(v) })}
        />
        <CampoNumero
          rotulo="Banheiros (mínimo)"
          valor={p.banheirosMin}
          aoMudar={(v) => mudar({ banheirosMin: Math.round(v) })}
        />
        <CampoNumero
          rotulo="Vagas de garagem (mínimo)"
          valor={p.vagasMin}
          aoMudar={(v) => mudar({ vagasMin: Math.round(v) })}
        />
        <CampoNumero
          rotulo="Área mínima"
          sufixo="m²"
          valor={p.areaMin}
          aoMudar={(areaMin) => mudar({ areaMin })}
        />
        <CampoSelecao
          rotulo="Escadas"
          ajuda="Importante para quem tem dificuldade de subir escadas."
          valor={p.acesso}
          opcoes={NOMES_ACESSO}
          aoMudar={(acesso) => mudar({ acesso })}
        />
        <CampoNumero
          rotulo="Condomínio máximo por mês"
          moeda
          valor={p.condominioMax}
          aoMudar={(condominioMax) => mudar({ condominioMax })}
        />
      </Cartao>

      <Cartao titulo="Localização">
        <CampoTexto
          rotulo="Endereço da casa atual (ponto de referência)"
          ajuda="Usado para calcular a distância até cada imóvel."
          valor={p.casaAtual.endereco}
          aoMudar={(endereco) =>
            mudar({ casaAtual: { ...p.casaAtual, endereco, lat: null, lon: null } })
          }
        />
        <CampoTexto
          rotulo="Cidade principal (ex.: Campinas - SP)"
          ajuda="Usada para montar os links de busca."
          valor={p.cidadeUf}
          aoMudar={(cidadeUf) => mudar({ cidadeUf })}
        />
        <CampoNumero
          rotulo="Distância máxima da casa atual"
          sufixo="km"
          valor={p.distanciaMaxKm}
          aoMudar={(distanciaMaxKm) => mudar({ distanciaMaxKm })}
        />
        <ListaLocais
          titulo="Cidades e bairros desejados"
          rotuloNome="Bairro/cidade"
          locais={p.locaisDesejados}
          aoMudar={(locaisDesejados) => mudar({ locaisDesejados })}
        />
        <ListaLocais
          titulo="Lugares importantes (opcional)"
          ajuda="Trabalho, posto de saúde, casa de parente… O app mostra a distância de cada imóvel até eles."
          rotuloNome="Lugar"
          locais={p.pontosImportantes}
          aoMudar={(pontosImportantes) => mudar({ pontosImportantes })}
        />
      </Cartao>

      <Cartao titulo="Alternativas">
        <CampoSelecao
          rotulo="Aceitam repasse? (assumir financiamento de outra pessoa)"
          valor={p.aceitaRepasse}
          opcoes={NOMES_SIM_NAO_TALVEZ}
          aoMudar={(aceitaRepasse) => mudar({ aceitaRepasse })}
        />
        <CampoSelecao
          rotulo="Consideram empréstimo para a entrada?"
          valor={p.consideraEmprestimo}
          opcoes={NOMES_SIM_NAO_TALVEZ}
          aoMudar={(consideraEmprestimo) => mudar({ consideraEmprestimo })}
        />
      </Cartao>

      <div className="sticky bottom-36 z-10 rounded-2xl bg-gray-50/95 py-3">
        <Botao type="submit" className="w-full">
          Salvar preferências
        </Botao>
        {mensagem && (
          <p role="status" className="mt-2 text-center font-semibold text-green-800">
            {mensagem}
          </p>
        )}
      </div>
    </form>
  );
}

export default function PaginaPreferencias() {
  const estado = useEstadoFamilia();
  if (!estado) return <Carregando />;
  return (
    <FormPreferencias key={JSON.stringify(estado.preferencias)} inicial={estado.preferencias} />
  );
}
