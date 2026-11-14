import type { Metadata } from "next";
import { AbasSituacao } from "@/components/situacao/AbasSituacao";
import { TituloPagina } from "@/components/ui";

export const metadata: Metadata = { title: "Nossa situação" };

export default function LayoutSituacao({ children }: LayoutProps<"/situacao">) {
  return (
    <>
      <TituloPagina
        idAjuda="situacao"
        ajuda="Cadastrem aqui as pessoas da família, as recusas que já tiveram, o dinheiro guardado e o tipo de imóvel que procuram. Todos os cálculos do app usam estas informações."
        subtitulo="Tudo aqui pode ser mudado a qualquer momento. Os cálculos se atualizam na hora."
      >
        Nossa situação
      </TituloPagina>
      <AbasSituacao />
      {children}
    </>
  );
}
