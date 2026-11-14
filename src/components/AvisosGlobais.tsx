"use client";

import { useState } from "react";
import { Aviso, Botao, confirmar } from "@/components/ui";
import { CampoTexto } from "@/components/campos";
import {
  useErroArmazenamento,
  useEstadoFamilia,
  useNuvem,
  useQuem,
} from "@/lib/armazenamento/hooks";
import { atualizarEstado, definirQuem, recomecarDoZero } from "@/lib/armazenamento/loja";

/** Avisos que aparecem no topo de todas as telas quando necessário. */
export function AvisosGlobais() {
  const estado = useEstadoFamilia();
  const quem = useQuem();
  const erro = useErroArmazenamento();
  // Assinar a nuvem aqui (layout) mantém a sincronização ligada em todas as telas.
  const nuvem = useNuvem();
  const [nome, setNome] = useState("");

  if (!estado) return null;

  return (
    <div>
      {erro && <Aviso tipo="perigo">{erro}</Aviso>}
      {(nuvem.tipo === "erro" || nuvem.tipo === "conflito") && nuvem.mensagem && (
        <Aviso tipo="alerta">{nuvem.mensagem}</Aviso>
      )}

      {estado.ehExemplo && (
        <Aviso tipo="alerta" titulo="Estes são dados de exemplo">
          <p>
            O app começou com a situação descrita pela família. Confira e ajuste tudo em{" "}
            <strong>Situação</strong> — os cálculos mudam na hora.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Botao
              variante="secundario"
              onClick={() =>
                atualizarEstado(
                  "Confirmou que vai usar os dados de exemplo como ponto de partida",
                  (e) => ({
                    ...e,
                    ehExemplo: false,
                  }),
                )
              }
            >
              Entendi, vou ajustar
            </Botao>
            <Botao
              variante="perigo"
              onClick={async () => {
                if (await confirmar("Apagar o exemplo e começar com tudo em branco?"))
                  recomecarDoZero();
              }}
            >
              Começar do zero
            </Botao>
          </div>
        </Aviso>
      )}

      {!quem && (
        <Aviso tipo="info" titulo="Quem está usando este aparelho?">
          <p>Usamos o nome só para o histórico (ex.: “Mãe mudou o salário em 14/11”).</p>
          <form
            className="mt-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (nome.trim()) definirQuem(nome);
            }}
          >
            <CampoTexto
              rotulo="Seu nome ou apelido"
              valor={nome}
              aoMudar={setNome}
              autoComplete="given-name"
            />
            <Botao type="submit">Salvar</Botao>
          </form>
        </Aviso>
      )}
    </div>
  );
}
