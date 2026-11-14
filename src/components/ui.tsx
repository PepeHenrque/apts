/**
 * Componentes visuais simples e reutilizáveis. Pensados para celular e público leigo:
 * botões grandes, texto grande, alto contraste.
 */
import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variante = "primario" | "secundario" | "perigo" | "discreto";

const CLASSES_VARIANTE: Record<Variante, string> = {
  primario: "bg-blue-700 text-white hover:bg-blue-800 border-blue-700",
  secundario: "bg-white text-blue-800 border-blue-700 hover:bg-blue-50",
  perigo: "bg-white text-red-800 border-red-700 hover:bg-red-50",
  discreto: "bg-transparent text-blue-800 border-transparent underline hover:bg-blue-50",
};

export function classesBotao(variante: Variante = "primario", extra = ""): string {
  return `inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 px-5 py-2 text-lg font-semibold disabled:opacity-50 ${CLASSES_VARIANTE[variante]} ${extra}`;
}

export function Botao({
  variante = "primario",
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante }) {
  return <button type={type} className={classesBotao(variante, className)} {...props} />;
}

export function BotaoLink({
  href,
  variante = "primario",
  className = "",
  children,
}: {
  href: string;
  variante?: Variante;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={classesBotao(variante, className)}>
      {children}
    </Link>
  );
}

export function TituloPagina({
  children,
  subtitulo,
}: {
  children: ReactNode;
  subtitulo?: ReactNode;
}) {
  return (
    <header className="mb-5">
      <h1 className="text-3xl leading-tight font-bold">{children}</h1>
      {subtitulo && <p className="mt-2 text-lg text-gray-700">{subtitulo}</p>}
    </header>
  );
}

export function Cartao({
  titulo,
  children,
  className = "",
  acoes,
}: {
  titulo?: ReactNode;
  children: ReactNode;
  className?: string;
  acoes?: ReactNode;
}) {
  return (
    <section className={`mb-4 rounded-2xl border-2 border-gray-200 bg-white p-4 ${className}`}>
      {(titulo || acoes) && (
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          {titulo && <h2 className="text-xl font-bold">{titulo}</h2>}
          {acoes}
        </div>
      )}
      {children}
    </section>
  );
}

type TipoAviso = "info" | "alerta" | "perigo" | "sucesso";
const CLASSES_AVISO: Record<TipoAviso, string> = {
  info: "border-blue-300 bg-blue-50 text-blue-950",
  alerta: "border-amber-400 bg-amber-50 text-amber-950",
  perigo: "border-red-400 bg-red-50 text-red-950",
  sucesso: "border-green-500 bg-green-50 text-green-950",
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
  return (
    <div className={`mb-4 rounded-xl border-2 p-4 ${CLASSES_AVISO[tipo]}`}>
      {titulo && <p className="font-bold">{titulo}</p>}
      {children && <div className={titulo ? "mt-1" : ""}>{children}</div>}
    </div>
  );
}

/** Aviso obrigatório em toda tela de cálculo. */
export function AvisoCalculo() {
  return (
    <p className="mb-4 rounded-lg bg-gray-100 px-3 py-2 text-base text-gray-800">
      <strong>Estimativa</strong> — o valor final é definido pela Caixa.
    </p>
  );
}

export function Carregando({ texto = "Carregando…" }: { texto?: string }) {
  return (
    <div aria-busy="true" aria-live="polite" className="py-16 text-center text-lg text-gray-700">
      {texto}
    </div>
  );
}

export function EstadoVazio({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-gray-300 p-6 text-center">
      <p className="text-lg font-semibold">{titulo}</p>
      {children && <div className="mt-2 text-gray-700">{children}</div>}
    </div>
  );
}

type CorSelo = "verde" | "amarelo" | "vermelho" | "cinza" | "azul";
const CLASSES_SELO: Record<CorSelo, string> = {
  verde: "bg-green-100 text-green-900 border-green-600",
  amarelo: "bg-amber-100 text-amber-950 border-amber-500",
  vermelho: "bg-red-100 text-red-900 border-red-600",
  cinza: "bg-gray-100 text-gray-900 border-gray-400",
  azul: "bg-blue-100 text-blue-900 border-blue-500",
};

export function Selo({ cor, children }: { cor: CorSelo; children: ReactNode }) {
  return (
    <span
      className={`inline-block rounded-full border px-3 py-0.5 text-base font-semibold ${CLASSES_SELO[cor]}`}
    >
      {children}
    </span>
  );
}

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
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-gray-100 py-2 last:border-0">
      <dt className="text-gray-700">
        {rotulo}
        {ajuda && <span className="block text-sm text-gray-600">{ajuda}</span>}
      </dt>
      <dd className={destaque ? "text-2xl font-bold" : "text-lg font-semibold"}>{valor}</dd>
    </div>
  );
}

/** Pergunta de confirmação simples (para remover itens). */
export function confirmar(mensagem: string): boolean {
  return typeof window === "undefined" ? false : window.confirm(mensagem);
}
