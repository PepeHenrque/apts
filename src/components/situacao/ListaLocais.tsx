"use client";

import { CampoTexto } from "@/components/campos";
import { Botao } from "@/components/ui";
import { novoId, type Local } from "@/lib/dominio/esquemas";

/** Lista editável de lugares (bairros desejados, pontos importantes). */
export function ListaLocais({
  titulo,
  ajuda,
  rotuloNome,
  locais,
  aoMudar,
  comEndereco = true,
}: {
  titulo: string;
  ajuda?: string;
  rotuloNome: string;
  locais: Local[];
  aoMudar: (locais: Local[]) => void;
  comEndereco?: boolean;
}) {
  const mudar = (id: string, dados: Partial<Local>) =>
    aoMudar(
      locais.map((l) =>
        l.id === id
          ? {
              ...l,
              ...dados,
              lat: dados.endereco !== undefined ? null : l.lat,
              lon: dados.endereco !== undefined ? null : l.lon,
            }
          : l,
      ),
    );
  return (
    <fieldset className="mb-4">
      <legend className="font-semibold">{titulo}</legend>
      {ajuda && <p className="mb-2 text-texto-2">{ajuda}</p>}
      {locais.map((l, i) => (
        <div key={l.id} className="mb-3 rounded-md border border-borda p-3">
          <CampoTexto
            rotulo={`${rotuloNome} ${i + 1}`}
            valor={l.nome}
            aoMudar={(nome) => mudar(l.id, { nome })}
          />
          {comEndereco && (
            <CampoTexto
              rotulo="Endereço (rua, número, bairro, cidade)"
              valor={l.endereco}
              aoMudar={(endereco) => mudar(l.id, { endereco })}
            />
          )}
          <Botao variante="perigo" onClick={() => aoMudar(locais.filter((x) => x.id !== l.id))}>
            Remover
          </Botao>
        </div>
      ))}
      <Botao
        variante="secundario"
        onClick={() =>
          aoMudar([...locais, { id: novoId(), nome: "", endereco: "", lat: null, lon: null }])
        }
      >
        Adicionar
      </Botao>
    </fieldset>
  );
}
