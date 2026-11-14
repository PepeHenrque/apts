"use client";

import { ChevronDown, CircleHelp } from "lucide-react";
import { useSyncExternalStore, type ReactNode } from "react";

const PREFIXO = "apts:ajuda:";
const ouvintes = new Set<() => void>();

function assinar(o: () => void) {
  ouvintes.add(o);
  return () => ouvintes.delete(o);
}

function recolhida(id: string): boolean {
  try {
    return window.localStorage.getItem(PREFIXO + id) === "recolhida";
  } catch {
    return false;
  }
}

function alternar(id: string) {
  try {
    if (recolhida(id)) window.localStorage.removeItem(PREFIXO + id);
    else window.localStorage.setItem(PREFIXO + id, "recolhida");
  } catch {
    // sem armazenamento: ignora
  }
  for (const o of ouvintes) o();
}

/** Texto curto de ajuda no topo da tela. Pode ser recolhido; o app lembra a escolha. */
export function AjudaDaTela({ id, children }: { id: string; children: ReactNode }) {
  const fechada = useSyncExternalStore(
    assinar,
    () => recolhida(id),
    () => false,
  );
  const idConteudo = `ajuda-${id}`;
  return (
    <div className="mt-3 rounded-md border border-borda bg-superficie">
      <button
        type="button"
        aria-expanded={!fechada}
        aria-controls={idConteudo}
        onClick={() => alternar(id)}
        className="flex min-h-11 w-full items-center gap-2 px-3.5 text-left text-texto-2 lg:min-h-10"
      >
        <CircleHelp size={18} strokeWidth={1.75} aria-hidden="true" className="text-primaria" />
        <span className="flex-1 font-medium">
          {fechada ? "Mostrar ajuda desta tela" : "Como funciona esta tela"}
        </span>
        <ChevronDown
          size={18}
          strokeWidth={1.75}
          aria-hidden="true"
          className={`transition-transform ${fechada ? "" : "rotate-180"}`}
        />
      </button>
      {!fechada && (
        <div id={idConteudo} className="border-t border-borda px-3.5 py-3 text-texto-2">
          {children}
        </div>
      )}
    </div>
  );
}
