/**
 * Endereço das rotas de API. No site é o próprio domínio; no app de Windows (que não tem
 * servidor) as rotas de IA podem apontar para o site na Vercel via NEXT_PUBLIC_URL_API.
 */
export function urlApi(caminho: string): string {
  return `${process.env.NEXT_PUBLIC_URL_API ?? ""}${caminho}`;
}

/** Origens que podem chamar a API de fora do site (o app de Windows/Tauri). */
const ORIGENS_EXTRAS = ["tauri://localhost", "http://tauri.localhost", "https://tauri.localhost"];

/** Cabeçalhos CORS para respostas da API (só para as origens do app de Windows). */
export function cabecalhosCors(origem: string | null): Record<string, string> {
  if (!origem || !ORIGENS_EXTRAS.includes(origem)) return {};
  return {
    "Access-Control-Allow-Origin": origem,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}
