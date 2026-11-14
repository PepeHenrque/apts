import type { MetadataRoute } from "next";

export const dynamic = "force-static";

/** Manifesto do PWA: permite "instalar" o app no celular e no Windows (Chrome/Edge). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "apts — nossa casa própria",
    short_name: "apts",
    description:
      "Quanto a família consegue financiar pela Caixa (MCMV), o que bloqueia a aprovação e os imóveis que cabem no orçamento.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f9fafb",
    theme_color: "#1d4ed8",
    lang: "pt-BR",
    icons: [
      { src: "/icones/icone-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icones/icone-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icones/icone-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
