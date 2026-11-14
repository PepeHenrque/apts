"use client";
import { MapPin } from "lucide-react";

import { useState } from "react";
import { Botao } from "@/components/ui";
import type { Coordenadas } from "@/lib/geo/distancia";
import { geocodificar } from "@/lib/geo/geocodificar";

/** Botão "Localizar no mapa": busca as coordenadas de um endereço e devolve para quem chamou. */
export function BotaoLocalizar({
  endereco,
  aoEncontrar,
  rotulo = "Localizar no mapa",
}: {
  endereco: string;
  aoEncontrar: (c: Coordenadas) => void;
  rotulo?: string;
}) {
  const [estado, setEstado] = useState<"parado" | "buscando" | "erro" | "nao-achou">("parado");
  const [mensagem, setMensagem] = useState("");

  return (
    <div className="mt-2">
      <Botao
        variante="secundario"
        icone={MapPin}
        disabled={estado === "buscando" || endereco.trim().length < 3}
        onClick={async () => {
          setEstado("buscando");
          try {
            const c = await geocodificar(endereco);
            if (c) {
              setEstado("parado");
              aoEncontrar(c);
            } else {
              setEstado("nao-achou");
              setMensagem("Endereço não encontrado. Tente com rua, bairro e cidade.");
            }
          } catch (e) {
            setEstado("erro");
            setMensagem(e instanceof Error ? e.message : "Não foi possível localizar agora.");
          }
        }}
      >
        {estado === "buscando" ? "Localizando…" : rotulo}
      </Botao>
      {(estado === "erro" || estado === "nao-achou") && (
        <p role="alert" className="mt-1 font-semibold text-erro">
          {mensagem}
        </p>
      )}
    </div>
  );
}
