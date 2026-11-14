import type { Metadata, Viewport } from "next";
import { AvisoEstimativa } from "@/components/AvisoEstimativa";
import "./globals.css";

export const metadata: Metadata = {
  title: "apts — nossa casa própria",
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
      <body className="flex min-h-full flex-col">
        <div className="flex-1">{children}</div>
        <AvisoEstimativa />
      </body>
    </html>
  );
}
