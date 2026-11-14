import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AvisoEstimativa } from "@/components/AvisoEstimativa";
import { AvisosGlobais } from "@/components/AvisosGlobais";
import { Feedback } from "@/components/Feedback";
import { BarraLateral, NavegacaoInferior } from "@/components/NavegacaoInferior";
import { RegistrarServiceWorker } from "@/components/Pwa";
import { BotaoAjuda, Tour } from "@/components/Tour";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: { default: "apts — nossa casa própria", template: "%s — apts" },
  applicationName: "apts",
  appleWebApp: { capable: true, title: "apts", statusBarStyle: "default" },
  description:
    "Quanto a família consegue financiar pela Caixa (Minha Casa Minha Vida), o que está impedindo a aprovação e os imóveis que cabem no orçamento.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b5563",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full`}>
      <body className="min-h-full">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[2000] focus:rounded-md focus:bg-superficie focus:p-3"
        >
          Pular para o conteúdo
        </a>
        <BarraLateral />
        <div className="lg:pl-60">
          <main
            id="conteudo"
            className="mx-auto w-full max-w-[1120px] px-4 pt-5 pb-40 sm:px-6 lg:px-10 lg:pt-9 lg:pb-20"
          >
            <AvisosGlobais />
            {children}
          </main>
        </div>
        <div className="fixed inset-x-0 bottom-0 z-[1100] lg:left-60">
          <AvisoEstimativa />
          <NavegacaoInferior />
        </div>
        <BotaoAjuda />
        <Tour />
        <Feedback />
        <RegistrarServiceWorker />
      </body>
    </html>
  );
}
