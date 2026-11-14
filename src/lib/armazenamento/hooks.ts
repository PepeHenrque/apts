"use client";

import { useMemo, useSyncExternalStore } from "react";
import { hoje } from "@/lib/datas";
import { gerarDiagnostico, type Diagnostico } from "@/lib/dominio/diagnostico";
import type { EstadoFamilia } from "@/lib/dominio/esquemas";
import {
  assinar,
  obterErro,
  obterEstado,
  obterEstadoServidor,
  obterQuem,
} from "@/lib/armazenamento/loja";
import {
  assinarStatusNuvem,
  obterStatusNuvem,
  obterStatusServidor,
  type StatusNuvem,
} from "@/lib/supabase/sincronizacao";

/** Dados da família. `null` enquanto carrega (primeira renderização). */
export function useEstadoFamilia(): EstadoFamilia | null {
  return useSyncExternalStore(assinar, obterEstado, obterEstadoServidor);
}

/** Nome de quem está usando este aparelho (para o histórico). */
export function useQuem(): string {
  return useSyncExternalStore(assinar, obterQuem, () => "");
}

/** Mensagem de erro de armazenamento (vazia se está tudo bem). */
export function useErroArmazenamento(): string {
  return useSyncExternalStore(assinar, obterErro, () => "");
}

/** Diagnóstico e cenários calculados a partir dos dados atuais (recalcula a cada mudança). */
export function useDiagnostico(estado: EstadoFamilia | null): Diagnostico | null {
  return useMemo(() => (estado ? gerarDiagnostico(estado, hoje()) : null), [estado]);
}

/** Situação do login e da sincronização com a família na nuvem. */
export function useNuvem(): StatusNuvem {
  return useSyncExternalStore(assinarStatusNuvem, obterStatusNuvem, obterStatusServidor);
}
