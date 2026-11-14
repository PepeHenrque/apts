"use client";

import { Aviso, Botao, BotaoLink } from "@/components/ui";

export default function Erro({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="py-8">
      <Aviso tipo="perigo" titulo="Algo deu errado nesta tela.">
        Seus dados continuam salvos. Tente de novo; se continuar, volte para o início.
      </Aviso>
      <div className="flex flex-col gap-2">
        <Botao onClick={reset}>Tentar de novo</Botao>
        <BotaoLink href="/" variante="secundario">
          Voltar ao início
        </BotaoLink>
      </div>
    </div>
  );
}
