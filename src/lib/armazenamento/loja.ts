/**
 * "Loja" dos dados da família no navegador (localStorage).
 *
 * Funciona com `useSyncExternalStore` do React: as telas assinam a loja e re-renderizam quando os
 * dados mudam (inclusive em outra aba). Toda alteração passa por `atualizarEstado`, que registra
 * no histórico quem mudou o quê e quando.
 *
 * Na Fase 3 (Supabase) um "sincronizador" é plugado aqui para também salvar no banco da família.
 */
import { dadosIniciais } from "@/lib/dominio/dados-iniciais";
import {
  estadoVazio,
  lerEstado,
  novoId,
  type EstadoFamilia,
  type RegistroHistorico,
} from "@/lib/dominio/esquemas";

export const CHAVE_ESTADO = "apts:estado:v1";
export const CHAVE_QUEM = "apts:quem";
const MAX_HISTORICO = 300;

type Ouvinte = () => void;
const ouvintes = new Set<Ouvinte>();

let cacheEstado: EstadoFamilia | undefined;
let cacheQuem: string | undefined;
let ultimoErro = "";

/** Função chamada a cada alteração (usada pela sincronização com o Supabase). */
let aoSalvar: ((estado: EstadoFamilia) => void) | null = null;

function navegadorDisponivel(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function gravar(estado: EstadoFamilia) {
  if (!navegadorDisponivel()) return;
  try {
    window.localStorage.setItem(CHAVE_ESTADO, JSON.stringify(estado));
    ultimoErro = "";
  } catch {
    ultimoErro =
      "Não foi possível salvar neste aparelho (memória cheia ou navegação anônima). Baixe uma cópia dos dados em Mais → Cópia de segurança.";
  }
}

function lerDoNavegador(): EstadoFamilia {
  if (!navegadorDisponivel()) return dadosIniciais();
  try {
    const bruto = window.localStorage.getItem(CHAVE_ESTADO);
    if (bruto) {
      const estado = lerEstado(JSON.parse(bruto));
      if (estado) return estado;
      // Dados inválidos: guarda uma cópia para não perder nada e recomeça com o exemplo.
      window.localStorage.setItem(`${CHAVE_ESTADO}:corrompido:${Date.now()}`, bruto);
      ultimoErro =
        "Os dados salvos estavam com problema. Uma cópia foi guardada e o exemplo foi carregado.";
    }
  } catch {
    ultimoErro = "Não foi possível ler os dados salvos neste aparelho.";
  }
  const inicial = dadosIniciais();
  gravar(inicial);
  return inicial;
}

function avisarOuvintes() {
  for (const ouvinte of ouvintes) ouvinte();
}

// ---- Leitura (para useSyncExternalStore) ----

export function obterEstado(): EstadoFamilia {
  if (cacheEstado === undefined) cacheEstado = lerDoNavegador();
  return cacheEstado;
}

/** No servidor (e na 1ª renderização) ainda não há dados: as telas mostram "Carregando". */
export function obterEstadoServidor(): null {
  return null;
}

export function obterQuem(): string {
  if (cacheQuem === undefined) {
    cacheQuem = navegadorDisponivel() ? (window.localStorage.getItem(CHAVE_QUEM) ?? "") : "";
  }
  return cacheQuem;
}

export function obterErro(): string {
  return ultimoErro;
}

export function assinar(ouvinte: Ouvinte): () => void {
  ouvintes.add(ouvinte);
  const aoMudarOutraAba = (evento: StorageEvent) => {
    if (evento.key === CHAVE_ESTADO) cacheEstado = undefined;
    if (evento.key === CHAVE_QUEM) cacheQuem = undefined;
    if (evento.key === CHAVE_ESTADO || evento.key === CHAVE_QUEM) ouvinte();
  };
  window.addEventListener("storage", aoMudarOutraAba);
  return () => {
    ouvintes.delete(ouvinte);
    window.removeEventListener("storage", aoMudarOutraAba);
  };
}

// ---- Escrita ----

/** Substitui o estado inteiro (sem registrar histórico). */
export function substituirEstado(novo: EstadoFamilia, opcoes: { sincronizar?: boolean } = {}) {
  cacheEstado = novo;
  gravar(novo);
  if (opcoes.sincronizar !== false) aoSalvar?.(novo);
  avisarOuvintes();
}

/** Aplica uma alteração e registra no histórico. Ex.: atualizarEstado("Mudou o salário da Mãe", ...) */
export function atualizarEstado(descricao: string, mudar: (atual: EstadoFamilia) => EstadoFamilia) {
  const atual = obterEstado();
  const novo = mudar(atual);
  const registro: RegistroHistorico = {
    id: novoId(),
    quando: new Date().toISOString(),
    quem: obterQuem() || "Alguém",
    descricao,
  };
  substituirEstado({ ...novo, historico: [registro, ...novo.historico].slice(0, MAX_HISTORICO) });
}

export function definirQuem(nome: string) {
  cacheQuem = nome.trim();
  if (navegadorDisponivel()) window.localStorage.setItem(CHAVE_QUEM, cacheQuem);
  avisarOuvintes();
}

export function recomecarDoZero() {
  substituirEstado({ ...estadoVazio(), historico: [] });
  atualizarEstado("Apagou todos os dados e começou do zero", (e) => e);
}

export function recarregarExemplo() {
  substituirEstado(dadosIniciais());
}

export function definirSincronizador(funcao: ((estado: EstadoFamilia) => void) | null) {
  aoSalvar = funcao;
}

/** Só para testes: esquece o que está em memória. */
export function _limparCache() {
  cacheEstado = undefined;
  cacheQuem = undefined;
}
