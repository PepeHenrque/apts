"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { estaAtivo, NAVEGACAO_INFERIOR, NAVEGACAO_LATERAL } from "@/components/navegacao";

/** Barra inferior (celular). */
export function NavegacaoInferior() {
  const caminho = usePathname();
  return (
    <nav aria-label="Navegação principal" className="border-t border-borda bg-superficie lg:hidden">
      <ul className="mx-auto flex max-w-xl">
        {NAVEGACAO_INFERIOR.map(({ href, rotulo, icone: Icone }) => {
          const ativo = estaAtivo(caminho, href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={ativo ? "page" : undefined}
                data-tour={href}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[0.8rem] font-medium ${
                  ativo ? "text-primaria" : "text-texto-2"
                }`}
              >
                <Icone size={22} strokeWidth={ativo ? 2 : 1.75} aria-hidden="true" />
                {rotulo}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Barra lateral fixa (computador). */
export function BarraLateral() {
  const caminho = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 z-[1000] hidden w-60 flex-col border-r border-borda bg-superficie lg:flex">
      <Link href="/" className="flex items-baseline gap-2 px-5 pt-6 pb-5">
        <span className="text-xl font-semibold tracking-tight text-primaria">apts</span>
        <span className="text-sm text-texto-3">casa própria</span>
      </Link>
      <nav aria-label="Menu lateral" className="flex-1 overflow-y-auto px-3 pb-6">
        {NAVEGACAO_LATERAL.map((g) => (
          <div key={g.grupo} className="mb-5">
            <p className="px-2 pb-1.5 text-xs font-medium tracking-wide text-texto-3 uppercase">
              {g.grupo}
            </p>
            <ul className="space-y-0.5">
              {g.itens.map(({ href, rotulo, icone: Icone }) => {
                const ativo = estaAtivo(caminho, href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={ativo ? "page" : undefined}
                      data-tour={href}
                      className={`flex min-h-9 items-center gap-2.5 rounded-sm px-2 text-[0.95rem] ${
                        ativo
                          ? "bg-primaria-suave font-medium text-primaria-forte"
                          : "text-texto-2 hover:bg-fundo hover:text-texto"
                      }`}
                    >
                      <Icone size={18} strokeWidth={1.75} aria-hidden="true" />
                      {rotulo}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
