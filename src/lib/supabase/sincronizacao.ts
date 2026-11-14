/**
 * Sessão (login) e sincronização dos dados da família com o Supabase.
 *
 * - Os dados continuam na loja local (localStorage); aqui só espelhamos no banco.
 * - Cada família tem UM documento JSON com versão. Ao salvar, enviamos a versão que temos;
 *   se outra pessoa salvou antes, o banco responde "conflito" e carregamos a versão mais nova.
 * - Mudanças de outros aparelhos chegam em tempo real (Supabase Realtime).
 */
import type { RealtimeChannel } from "@supabase/supabase-js";
import {
  CHAVE_ESTADO,
  definirQuem,
  definirSincronizador,
  obterEstado,
  obterQuem,
  substituirEstado,
} from "@/lib/armazenamento/loja";
import { lerEstado, type EstadoFamilia } from "@/lib/dominio/esquemas";
import { obterSupabase, supabaseConfigurado } from "@/lib/supabase/cliente";

export type TipoStatus =
  | "desligado" // Supabase não configurado: só neste aparelho
  | "carregando"
  | "sem-login"
  | "sem-familia"
  | "sincronizado"
  | "salvando"
  | "erro"
  | "conflito";

export interface StatusNuvem {
  tipo: TipoStatus;
  mensagem: string;
  usuario: { id: string; email: string } | null;
  familia: { id: string; nome: string } | null;
}

const INICIAL: StatusNuvem = {
  tipo: supabaseConfigurado() ? "carregando" : "desligado",
  mensagem: "",
  usuario: null,
  familia: null,
};

let status: StatusNuvem = INICIAL;
const ouvintes = new Set<() => void>();
let iniciado = false;
let versao = 0;
let canal: RealtimeChannel | null = null;
let temporizador: ReturnType<typeof setTimeout> | null = null;
let pendente: EstadoFamilia | null = null;

function definirStatus(parcial: Partial<StatusNuvem>) {
  status = { ...status, ...parcial };
  for (const o of ouvintes) o();
}

export function obterStatusNuvem(): StatusNuvem {
  return status;
}
export function obterStatusServidor(): StatusNuvem {
  return INICIAL;
}

export function assinarStatusNuvem(ouvinte: () => void): () => void {
  ouvintes.add(ouvinte);
  iniciar();
  return () => ouvintes.delete(ouvinte);
}

/** Liga a escuta de login/logout (uma vez). */
function iniciar() {
  if (iniciado) return;
  iniciado = true;
  const sb = obterSupabase();
  if (!sb) return;
  sb.auth.onAuthStateChange((_evento, sessao) => {
    const usuario = sessao?.user ? { id: sessao.user.id, email: sessao.user.email ?? "" } : null;
    const mudouUsuario = usuario?.id !== status.usuario?.id;
    definirStatus({ usuario });
    if (!usuario) {
      desconectar();
      definirStatus({ tipo: "sem-login", familia: null, mensagem: "" });
    } else if (mudouUsuario) {
      if (!obterQuem() && usuario.email) definirQuem(usuario.email.split("@")[0] ?? "");
      // Fora do callback para não travar o cliente de autenticação.
      setTimeout(() => void conectarFamilia(), 0);
    }
  });
  window.addEventListener("online", () => {
    if (pendente) void enviar(pendente);
  });
}

function desconectar() {
  definirSincronizador(null);
  if (canal) void obterSupabase()?.removeChannel(canal);
  canal = null;
  if (temporizador) clearTimeout(temporizador);
  pendente = null;
}

interface LinhaFamilia {
  id: string;
  nome: string;
  dados: unknown;
  versao: number;
}

function aplicarRemoto(linha: LinhaFamilia) {
  versao = linha.versao;
  const estado = lerEstado(linha.dados);
  if (estado && Array.isArray((linha.dados as { pessoas?: unknown }).pessoas)) {
    substituirEstado(estado, { sincronizar: false });
  } else {
    // Documento vazio ou inválido no banco: envia o que está neste aparelho.
    void enviar(obterEstado());
  }
}

/** Carrega a família do usuário logado e liga a sincronização. */
export async function conectarFamilia(): Promise<void> {
  const sb = obterSupabase();
  if (!sb || !status.usuario) return;
  definirStatus({ tipo: "carregando", mensagem: "" });
  const { data, error } = await sb
    .from("familias")
    .select("id, nome, dados, versao")
    .maybeSingle<LinhaFamilia>();
  if (error) {
    definirStatus({ tipo: "erro", mensagem: "Não foi possível carregar os dados da família." });
    return;
  }
  if (!data) {
    desconectar();
    definirStatus({ tipo: "sem-familia", familia: null });
    return;
  }
  aplicarRemoto(data);
  definirStatus({ tipo: "sincronizado", familia: { id: data.id, nome: data.nome }, mensagem: "" });
  definirSincronizador(agendarEnvio);

  if (canal) await sb.removeChannel(canal);
  canal = sb
    .channel(`familia-${data.id}`)
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "familias", filter: `id=eq.${data.id}` },
      (mudanca) => {
        const nova = mudanca.new as LinhaFamilia;
        if (nova.versao > versao) {
          aplicarRemoto(nova);
          definirStatus({ familia: { id: nova.id, nome: nova.nome } });
        }
      },
    )
    .subscribe();
}

function agendarEnvio(estado: EstadoFamilia) {
  pendente = estado;
  definirStatus({ tipo: "salvando", mensagem: "" });
  if (temporizador) clearTimeout(temporizador);
  temporizador = setTimeout(() => void enviar(estado), 800);
}

async function enviar(estado: EstadoFamilia) {
  const sb = obterSupabase();
  if (!sb) return;
  const { data, error } = await sb.rpc("salvar_dados", {
    novos_dados: estado,
    versao_esperada: versao,
  });
  if (error) {
    if (error.message.includes("conflito")) {
      pendente = null;
      await conectarFamilia();
      definirStatus({
        tipo: "conflito",
        mensagem:
          "Outra pessoa da família salvou ao mesmo tempo. Carregamos a versão mais nova — confira se a sua última alteração ficou e refaça se precisar.",
      });
    } else {
      definirStatus({
        tipo: "erro",
        mensagem:
          "Sem conexão com a nuvem. As alterações ficam neste aparelho e serão enviadas quando a internet voltar.",
      });
    }
    return;
  }
  if (pendente === estado) pendente = null;
  versao = data as number;
  definirStatus({ tipo: "sincronizado", mensagem: "" });
}

// ---- Ações da tela "Família" ----

export async function criarFamilia(nome: string): Promise<string | null> {
  const sb = obterSupabase();
  if (!sb) return "Supabase não configurado.";
  const { error } = await sb.rpc("criar_familia", {
    nome_familia: nome,
    dados_iniciais: obterEstado(),
  });
  if (error) return error.message;
  await conectarFamilia();
  return null;
}

export async function aceitarConvite(id: string): Promise<string | null> {
  const sb = obterSupabase();
  if (!sb) return "Supabase não configurado.";
  // Guarda uma cópia do que estava neste aparelho antes de trocar pelos dados da família.
  try {
    window.localStorage.setItem(`${CHAVE_ESTADO}:antes-de-entrar`, JSON.stringify(obterEstado()));
  } catch {
    // sem espaço: segue
  }
  const { error } = await sb.rpc("aceitar_convite", { convite: id });
  if (error) return error.message;
  await conectarFamilia();
  return null;
}

export async function sairDaFamilia(): Promise<string | null> {
  const sb = obterSupabase();
  if (!sb) return null;
  const { error } = await sb.rpc("sair_da_familia");
  if (error) return error.message;
  desconectar();
  definirStatus({ tipo: "sem-familia", familia: null });
  return null;
}

export async function sairDaConta(): Promise<void> {
  await obterSupabase()?.auth.signOut();
}
