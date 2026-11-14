/** Itens de navegação (barra lateral no computador, barra inferior no celular). */
import {
  Activity,
  BookOpen,
  Building2,
  Calculator,
  ClipboardList,
  Home,
  Landmark,
  ListChecks,
  Map,
  Menu,
  Radar,
  Repeat,
  Search,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface ItemNavegacao {
  href: string;
  rotulo: string;
  icone: LucideIcon;
}

export const NAVEGACAO_LATERAL: { grupo: string; itens: ItemNavegacao[] }[] = [
  {
    grupo: "Principal",
    itens: [
      { href: "/", rotulo: "Início", icone: Home },
      { href: "/situacao", rotulo: "Nossa situação", icone: ClipboardList },
      { href: "/diagnostico", rotulo: "Diagnóstico", icone: Activity },
      { href: "/simulador", rotulo: "Simulador", icone: Calculator },
    ],
  },
  {
    grupo: "Imóveis",
    itens: [
      { href: "/imoveis", rotulo: "Imóveis salvos", icone: Building2 },
      { href: "/encontrados", rotulo: "Encontrados", icone: Radar },
      { href: "/busca", rotulo: "Buscar nos sites", icone: Search },
      { href: "/mapa", rotulo: "Mapa", icone: Map },
    ],
  },
  {
    grupo: "Apoio",
    itens: [
      { href: "/guias", rotulo: "Checklists", icone: ListChecks },
      { href: "/repasse", rotulo: "Repasse", icone: Repeat },
      { href: "/emprestimo", rotulo: "Empréstimo", icone: Landmark },
      { href: "/familia", rotulo: "Família e login", icone: Users },
      { href: "/como-usar", rotulo: "Como usar", icone: BookOpen },
    ],
  },
];

export const NAVEGACAO_INFERIOR: ItemNavegacao[] = [
  { href: "/", rotulo: "Início", icone: Home },
  { href: "/situacao", rotulo: "Situação", icone: ClipboardList },
  { href: "/simulador", rotulo: "Simulador", icone: Calculator },
  { href: "/imoveis", rotulo: "Imóveis", icone: Building2 },
  { href: "/mais", rotulo: "Mais", icone: Menu },
];

/** Item ativo? (No app de Windows as rotas terminam com "/".) */
export function estaAtivo(caminhoBruto: string, href: string): boolean {
  const caminho = caminhoBruto.length > 1 ? caminhoBruto.replace(/\/$/, "") : caminhoBruto;
  return href === "/" ? caminho === "/" : caminho === href || caminho.startsWith(`${href}/`);
}
