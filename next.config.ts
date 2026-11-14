import type { NextConfig } from "next";

// O app guarda os dados no navegador (e depois no Supabase pelo próprio navegador), então quase
// todas as telas são componentes de cliente. Por isso não usamos `cacheComponents` (mais simples
// e compatível com a exportação estática usada no app de Windows).
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
