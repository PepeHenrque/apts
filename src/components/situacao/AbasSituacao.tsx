"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ABAS = [
  { href: "/situacao", rotulo: "Pessoas" },
  { href: "/situacao/recusas", rotulo: "Recusas" },
  { href: "/situacao/dinheiro", rotulo: "Dinheiro" },
  { href: "/situacao/preferencias", rotulo: "Imóvel desejado" },
  { href: "/situacao/historico", rotulo: "Histórico" },
];

export function AbasSituacao() {
  const caminho = usePathname().replace(/(.)\/$/, "$1");
  return (
    <nav
      aria-label="Partes da situação"
      className="mb-6 -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0"
    >
      <ul className="flex gap-1 border-b border-borda">
        {ABAS.map((aba) => {
          const ativa = caminho === aba.href;
          return (
            <li key={aba.href}>
              <Link
                href={aba.href}
                aria-current={ativa ? "page" : undefined}
                className={`-mb-px inline-flex min-h-11 items-center border-b-2 px-3 whitespace-nowrap ${
                  ativa
                    ? "border-primaria font-medium text-primaria"
                    : "border-transparent text-texto-2 hover:text-texto"
                }`}
              >
                {aba.rotulo}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
