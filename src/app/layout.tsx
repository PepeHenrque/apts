import type { Metadata, Viewport } from "next";
import { AvisoEstimativa } from "@/components/AvisoEstimativa";
import { AvisosGlobais } from "@/components/AvisosGlobais";
import { NavegacaoInferior } from "@/components/NavegacaoInferior";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "apts — nossa casa própria", template: "%s — apts" },
  description:
    "Descubra quanto a família consegue financiar pela Caixa (Minha Casa Minha Vida), o que está bloqueando a aprovação e organize a busca de imóveis.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1d4ed8",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full bg-gray-50 text-gray-900">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[2000] focus:rounded-lg focus:bg-white focus:p-3"
        >
          Pular para o conteúdo
        </a>
        <main id="conteudo" className="mx-auto max-w-2xl px-4 pt-6 pb-44">
          <AvisosGlobais />
          {children}
        </main>
        <div className="fixed inset-x-0 bottom-0 z-[1100]">
          <AvisoEstimativa />
          <NavegacaoInferior />
        </div>
      </body>
    </html>
  );
}
