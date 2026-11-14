import type { NextConfig } from "next";

// O app guarda os dados no navegador (e depois no Supabase pelo próprio navegador), então quase
// todas as telas são componentes de cliente. Por isso não usamos `cacheComponents` (mais simples
// e compatível com a exportação estática usada no app de Windows).
//
// EXPORTAR_ESTATICO=1 gera um site estático em out/ (usado pelo app de Windows/Tauri).
const exportarEstatico = process.env.EXPORTAR_ESTATICO === "1";

const nextConfig: NextConfig = {
  ...(exportarEstatico ? { output: "export" as const, images: { unoptimized: true } } : {}),
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  ...(exportarEstatico
    ? {}
    : {
        async headers() {
          return [
            {
              source: "/(.*)",
              headers: [
                { key: "X-Content-Type-Options", value: "nosniff" },
                { key: "X-Frame-Options", value: "DENY" },
                { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
                { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
              ],
            },
            {
              source: "/sw.js",
              headers: [
                { key: "Content-Type", value: "application/javascript; charset=utf-8" },
                { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
              ],
            },
          ];
        },
      }),
};

export default nextConfig;
