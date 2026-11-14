"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const ITENS_NAVEGACAO = [
  { href: "/", rotulo: "Início", icone: "🏠" },
  { href: "/situacao", rotulo: "Situação", icone: "👪" },
  { href: "/simulador", rotulo: "Simulador", icone: "🧮" },
  { href: "/imoveis", rotulo: "Imóveis", icone: "🏢" },
  { href: "/mais", rotulo: "Mais", icone: "☰" },
];

function estaAtivo(caminho: string, href: string): boolean {
  return href === "/" ? caminho === "/" : caminho === href || caminho.startsWith(`${href}/`);
}

export function NavegacaoInferior() {
  const caminho = usePathname();
  return (
    <nav aria-label="Navegação principal" className="border-t-2 border-gray-300 bg-white">
      <ul className="mx-auto flex max-w-2xl">
        {ITENS_NAVEGACAO.map((item) => {
          const ativo = estaAtivo(caminho, item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={ativo ? "page" : undefined}
                className={`flex min-h-16 flex-col items-center justify-center text-sm font-semibold ${
                  ativo ? "bg-blue-50 text-blue-800" : "text-gray-800"
                }`}
              >
                <span aria-hidden="true" className="text-2xl leading-none">
                  {item.icone}
                </span>
                {item.rotulo}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
