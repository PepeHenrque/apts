"use client";

import { CircleHelp, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Botao } from "@/components/ui";

/** Passos do tour: cada um destaca o item do menu da área (data-tour = href). */
export const PASSOS_TOUR = [
  {
    href: "/",
    titulo: "Bem-vindos",
    texto:
      "Este app mostra até quanto vocês podem pagar num imóvel pela Caixa, o que está impedindo a aprovação e quais imóveis cabem no orçamento.",
  },
  {
    href: "/situacao",
    titulo: "Nossa situação",
    texto:
      "Comece aqui: quem vai comprar, quanto ganha, se tem nome sujo e quanto dinheiro já está guardado. Tudo pode ser mudado depois.",
  },
  {
    href: "/diagnostico",
    titulo: "Diagnóstico",
    texto:
      "Mostra por que o banco está negando e o que fazer, do problema mais grave ao mais leve.",
  },
  {
    href: "/simulador",
    titulo: "Simulador",
    texto:
      "Compara quem pode comprar junto com quem e mostra o preço máximo e a parcela de cada combinação.",
  },
  {
    href: "/busca",
    titulo: "Buscar nos sites",
    texto: "Abre os sites de imóveis já filtrados pelo preço que cabe no orçamento.",
  },
  {
    href: "/imoveis",
    titulo: "Imóveis salvos",
    texto:
      "Guarde os anúncios que gostaram. O app diz na hora se cabe no orçamento e a que distância fica.",
  },
  {
    href: "/guias",
    titulo: "Checklists",
    texto:
      "Documentos para a Caixa, o que conferir no imóvel e o passo a passo para limpar o nome.",
  },
] as const;

const CHAVE = "apts:tour:v1";
const ouvintes = new Set<() => void>();
let abertoNestaSessao: boolean | null = null;

function assinar(o: () => void) {
  ouvintes.add(o);
  return () => ouvintes.delete(o);
}
function avisarOuvintes() {
  for (const o of ouvintes) o();
}
function estaAberto(): boolean {
  if (abertoNestaSessao !== null) return abertoNestaSessao;
  try {
    return window.localStorage.getItem(CHAVE) !== "visto";
  } catch {
    return false;
  }
}

/** Abre o tour (usado pelo botão de ajuda e pela página "Como usar"). */
export function abrirTour() {
  abertoNestaSessao = true;
  avisarOuvintes();
}
function fecharTour(lembrar: boolean) {
  abertoNestaSessao = false;
  if (lembrar) {
    try {
      window.localStorage.setItem(CHAVE, "visto");
    } catch {
      // sem armazenamento
    }
  }
  avisarOuvintes();
}

/** Elemento visível do menu para a área (barra lateral, barra inferior ou "Mais"). */
function alvoDoPasso(href: string): Element | null {
  const candidatos = [
    ...document.querySelectorAll(`[data-tour="${href}"]`),
    ...document.querySelectorAll('[data-tour="/mais"]'),
  ];
  return candidatos.find((el) => (el as HTMLElement).offsetParent !== null) ?? null;
}

export function Tour() {
  const aberto = useSyncExternalStore(assinar, estaAberto, () => false);
  const [passo, setPasso] = useState(0);
  const atual = PASSOS_TOUR[passo] ?? PASSOS_TOUR[0];
  const ultimo = passo === PASSOS_TOUR.length - 1;

  // Destaca o item do menu da área do passo atual.
  useEffect(() => {
    if (!aberto) return;
    const alvo = alvoDoPasso(atual.href);
    alvo?.setAttribute("data-destaque", "");
    return () => alvo?.removeAttribute("data-destaque");
  }, [aberto, atual.href]);

  if (!aberto) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="tour-titulo"
      aria-describedby="tour-texto"
      data-testid="tour"
      className="fixed inset-x-3 bottom-40 z-[1400] mx-auto max-w-md rounded-md border border-borda bg-superficie p-5 shadow-lg lg:right-8 lg:bottom-8 lg:left-auto lg:mx-0 lg:w-[26rem]"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-texto-3">
          Passo {passo + 1} de {PASSOS_TOUR.length}
        </p>
        <button
          type="button"
          onClick={() => fecharTour(false)}
          aria-label="Pular o tour"
          className="-mt-1 -mr-1 inline-flex h-9 w-9 items-center justify-center rounded-sm text-texto-2 hover:bg-fundo"
        >
          <X size={18} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </div>
      <h2 id="tour-titulo" className="mt-1 text-lg font-semibold">
        {atual.titulo}
      </h2>
      <p id="tour-texto" className="mt-1 text-texto-2">
        {atual.texto}
      </p>
      {atual.href !== "/" && (
        <Link
          href={atual.href}
          className="mt-2 inline-block font-medium text-primaria hover:underline"
        >
          Abrir {atual.titulo}
        </Link>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Botao variante="secundario" disabled={passo === 0} onClick={() => setPasso(passo - 1)}>
          Voltar
        </Botao>
        {ultimo ? (
          <Botao onClick={() => fecharTour(true)}>Concluir</Botao>
        ) : (
          <Botao onClick={() => setPasso(passo + 1)}>Próximo</Botao>
        )}
        <Botao variante="discreto" className="ml-auto" onClick={() => fecharTour(true)}>
          Não mostrar de novo
        </Botao>
      </div>
      <Botao variante="discreto" className="mt-1 text-sm" onClick={() => fecharTour(false)}>
        Pular por agora
      </Botao>
    </div>
  );
}

/** Botão fixo de ajuda: reabre o tour a qualquer momento. */
export function BotaoAjuda() {
  return (
    <button
      type="button"
      onClick={() => abrirTour()}
      aria-label="Ajuda: rever o tour do app"
      className="fixed right-4 bottom-32 z-[1050] inline-flex h-12 w-12 items-center justify-center rounded-full border border-borda bg-superficie text-primaria shadow-md hover:bg-fundo lg:right-8 lg:bottom-14 lg:h-11 lg:w-11"
    >
      <CircleHelp size={22} strokeWidth={1.75} aria-hidden="true" />
    </button>
  );
}
