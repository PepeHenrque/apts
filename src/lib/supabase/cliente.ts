/**
 * Cliente Supabase do NAVEGADOR (chave pública "anon"/"publishable", protegida por RLS).
 * Se as variáveis não estiverem configuradas, retorna null e o app funciona só neste aparelho.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const CHAVE_PUBLICA = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

let cliente: SupabaseClient | null | undefined;

export function supabaseConfigurado(): boolean {
  return Boolean(URL_SUPABASE && CHAVE_PUBLICA);
}

export function obterSupabase(): SupabaseClient | null {
  if (cliente !== undefined) return cliente;
  if (typeof window === "undefined" || !supabaseConfigurado()) return null;
  cliente = createClient(URL_SUPABASE, CHAVE_PUBLICA, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      // "implicit" funciona mesmo se o link for aberto em outro aparelho/navegador.
      flowType: "implicit",
      storageKey: "apts:sessao",
    },
  });
  return cliente;
}
