import type { Metadata } from "next";
import { AbasSituacao } from "@/components/situacao/AbasSituacao";
import { TituloPagina } from "@/components/ui";

export const metadata: Metadata = { title: "Nossa situação" };

export default function LayoutSituacao({ children }: LayoutProps<"/situacao">) {
  return (
    <>
      <TituloPagina subtitulo="Tudo aqui pode ser mudado a qualquer momento. Os cálculos se atualizam na hora.">
        Nossa situação
      </TituloPagina>
      <AbasSituacao />
      {children}
    </>
  );
}
