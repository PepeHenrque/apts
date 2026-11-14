/**
 * Cliente Supabase do SERVIDOR, com a service key (ignora RLS). Use SÓ em rotas de API.
 * Nunca importe este arquivo em componentes de cliente: a chave não pode ir para o navegador.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cliente: SupabaseClient | null | undefined;

export function supabaseServidor(): SupabaseClient | null {
  if (typeof window !== "undefined") {
    throw new Error("supabaseServidor() só pode ser usado no servidor.");
  }
  if (cliente !== undefined) return cliente;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  cliente = url && chave ? createClient(url, chave, { auth: { persistSession: false } }) : null;
  return cliente;
}
