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
  const caminho = usePathname();
  return (
    <nav aria-label="Partes da situação" className="mb-5 -mx-4 overflow-x-auto px-4">
      <ul className="flex gap-2">
        {ABAS.map((aba) => {
          const ativa = caminho === aba.href;
          return (
            <li key={aba.href}>
              <Link
                href={aba.href}
                aria-current={ativa ? "page" : undefined}
                className={`inline-flex min-h-12 items-center rounded-full border-2 px-4 font-semibold whitespace-nowrap ${
                  ativa
                    ? "border-blue-700 bg-blue-700 text-white"
                    : "border-gray-300 bg-white text-gray-900"
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
