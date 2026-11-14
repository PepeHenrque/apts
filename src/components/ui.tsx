/**
 * Componentes base do design system (Button, Card, Badge, PageHeader, EmptyState…).
 * Visual sóbrio: uma cor principal, neutros, bordas finas, raio pequeno.
 * Tamanhos pensados para celular (alvo de toque ≥ 44px) e compactos no computador.
 */
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Info,
  Loader2,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { AjudaDaTela } from "@/components/AjudaDaTela";

/** Tamanho e traço únicos para todos os ícones do app. */
export const ICONE = { size: 18, strokeWidth: 1.75, "aria-hidden": true } as const;

type Variante = "primario" | "secundario" | "perigo" | "discreto";

const CLASSES_VARIANTE: Record<Variante, string> = {
  primario: "bg-primaria text-white border-primaria hover:bg-primaria-forte",
  secundario: "bg-superficie text-texto border-borda-forte hover:bg-fundo",
  perigo: "bg-superficie text-erro border-borda-forte hover:bg-erro-suave",
  discreto: "bg-transparent text-primaria border-transparent hover:underline underline-offset-4",
};

export function classesBotao(variante: Variante = "primario", extra = ""): string {
  return `inline-flex min-h-11 items-center justify-center gap-2 rounded-md border py-2 text-base font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 lg:min-h-10 ${variante === "discreto" ? "px-0" : "px-4"} ${CLASSES_VARIANTE[variante]} ${extra}`;
}

export function Botao({
  variante = "primario",
  className = "",
  type = "button",
  icone: Icone,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante; icone?: LucideIcon }) {
  return (
    <button type={type} className={classesBotao(variante, className)} {...props}>
      {Icone && <Icone {...ICONE} />}
      {children}
    </button>
  );
}
export const Button = Botao;

export function BotaoLink({
  href,
  variante = "primario",
  className = "",
  icone: Icone,
  children,
}: {
  href: string;
  variante?: Variante;
  className?: string;
  icone?: LucideIcon;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={classesBotao(variante, className)}>
      {Icone && <Icone {...ICONE} />}
      {children}
    </Link>
  );
}

/** Link para fora do app (abre em nova aba, com ícone discreto). */
export function LinkExterno({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 font-medium text-primaria underline-offset-4 hover:underline ${className}`}
    >
      {children}
      <ExternalLink size={14} strokeWidth={1.75} aria-hidden="true" />
      <span className="sr-only"> (abre em nova aba)</span>
    </a>
  );
}

/** Cabeçalho da tela: um título, subtítulo curto, ações e ajuda recolhível. */
export function TituloPagina({
  children,
  subtitulo,
  acoes,
  ajuda,
  idAjuda,
}: {
  children: ReactNode;
  subtitulo?: ReactNode;
  acoes?: ReactNode;
  /** Texto de ajuda da tela (pode ser recolhido; o app lembra). */
  ajuda?: ReactNode;
  idAjuda?: string;
}) {
  return (
    <header className="mb-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight lg:text-[1.75rem]">{children}</h1>
          {subtitulo && <p className="mt-1 text-texto-2">{subtitulo}</p>}
        </div>
        {acoes && <div className="flex flex-wrap gap-2">{acoes}</div>}
      </div>
      {ajuda && idAjuda && <AjudaDaTela id={idAjuda}>{ajuda}</AjudaDaTela>}
    </header>
  );
}
export const PageHeader = TituloPagina;

export function Cartao({
  titulo,
  children,
  className = "",
  acoes,
  descricao,
}: {
  titulo?: ReactNode;
  children: ReactNode;
  className?: string;
  acoes?: ReactNode;
  descricao?: ReactNode;
}) {
  return (
    <section
      className={`mb-4 rounded-md border border-borda bg-superficie p-4 shadow-sutil lg:p-5 ${className}`}
    >
      {(titulo || acoes) && (
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div>
            {titulo && <h2 className="text-lg font-semibold">{titulo}</h2>}
            {descricao && <p className="mt-0.5 text-texto-2">{descricao}</p>}
          </div>
          {acoes}
        </div>
      )}
      {children}
    </section>
  );
}
export const Card = Cartao;

type TipoAviso = "info" | "alerta" | "perigo" | "sucesso";
const ESTILO_AVISO: Record<TipoAviso, { classe: string; icone: LucideIcon; cor: string }> = {
  info: { classe: "bg-info-suave border-borda", icone: Info, cor: "text-primaria" },
  alerta: {
    classe: "bg-atencao-suave border-[#f0dfb5]",
    icone: AlertTriangle,
    cor: "text-atencao",
  },
  perigo: { classe: "bg-erro-suave border-[#f3cfcb]", icone: XCircle, cor: "text-erro" },
  sucesso: { classe: "bg-ok-suave border-[#cde9d6]", icone: CheckCircle2, cor: "text-ok" },
};

export function Aviso({
  tipo = "info",
  titulo,
  children,
}: {
  tipo?: TipoAviso;
  titulo?: ReactNode;
  children?: ReactNode;
}) {
  const { classe, icone: Icone, cor } = ESTILO_AVISO[tipo];
  return (
    <div className={`mb-4 flex gap-3 rounded-md border p-3.5 ${classe}`}>
      <Icone {...ICONE} className={`mt-0.5 shrink-0 ${cor}`} />
      <div className="min-w-0">
        {titulo && <p className="font-semibold">{titulo}</p>}
        {children && <div className={titulo ? "mt-1 text-texto-2" : ""}>{children}</div>}
      </div>
    </div>
  );
}

/** Aviso obrigatório em toda tela de cálculo. */
export function AvisoCalculo() {
  return (
    <p className="mb-4 flex items-center gap-2 text-sm text-texto-2">
      <Info size={16} strokeWidth={1.75} aria-hidden="true" />
      Estimativa — o valor final é definido pela Caixa.
    </p>
  );
}

export function Carregando({ texto = "Carregando…" }: { texto?: string }) {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="flex items-center justify-center gap-2 py-16 text-texto-2"
    >
      <Loader2 {...ICONE} className="animate-spin" />
      {texto}
    </div>
  );
}

export function EstadoVazio({
  titulo,
  children,
  icone: Icone,
  acao,
}: {
  titulo: string;
  children?: ReactNode;
  icone?: LucideIcon;
  acao?: ReactNode;
}) {
  return (
    <div className="rounded-md border border-dashed border-borda-forte bg-superficie px-6 py-10 text-center">
      {Icone && (
        <Icone
          size={28}
          strokeWidth={1.5}
          aria-hidden="true"
          className="mx-auto mb-3 text-texto-3"
        />
      )}
      <p className="font-semibold">{titulo}</p>
      {children && <div className="mx-auto mt-1 max-w-md text-texto-2">{children}</div>}
      {acao && <div className="mt-4 flex justify-center">{acao}</div>}
    </div>
  );
}
export const EmptyState = EstadoVazio;

type CorSelo = "verde" | "amarelo" | "vermelho" | "cinza" | "azul";
const CLASSES_SELO: Record<CorSelo, string> = {
  verde: "bg-ok-suave text-ok",
  amarelo: "bg-atencao-suave text-atencao",
  vermelho: "bg-erro-suave text-erro",
  cinza: "bg-fundo text-texto-2 ring-1 ring-borda",
  azul: "bg-primaria-suave text-primaria-forte",
};

export function Selo({ cor, children }: { cor: CorSelo; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-medium whitespace-nowrap ${CLASSES_SELO[cor]}`}
    >
      {children}
    </span>
  );
}
export const Badge = Selo;

/** Par "rótulo: valor" para listas de números. */
export function Valor({
  rotulo,
  valor,
  destaque = false,
  ajuda,
}: {
  rotulo: ReactNode;
  valor: ReactNode;
  destaque?: boolean;
  ajuda?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-borda py-2.5 last:border-0">
      <dt className="text-texto-2">
        {rotulo}
        {ajuda && <span className="block text-sm text-texto-3">{ajuda}</span>}
      </dt>
      <dd className={`numeros ${destaque ? "text-xl font-semibold" : "font-medium"}`}>{valor}</dd>
    </div>
  );
}

/** Número em destaque (preço máximo, parcela). */
export function NumeroDestaque({
  rotulo,
  valor,
  detalhe,
}: {
  rotulo: ReactNode;
  valor: ReactNode;
  detalhe?: ReactNode;
}) {
  return (
    <div>
      <p className="text-sm text-texto-2">{rotulo}</p>
      <p className="numeros text-3xl font-semibold tracking-tight">{valor}</p>
      {detalhe && <p className="mt-0.5 text-sm text-texto-3">{detalhe}</p>}
    </div>
  );
}

export { confirmar, avisar } from "@/lib/feedback";
