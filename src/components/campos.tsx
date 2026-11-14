"use client";

/**
 * Campos de formulário acessíveis: todo campo tem rótulo, ajuda opcional e mensagem de erro
 * ligada por aria-describedby.
 */
import { useId, useState, type ReactNode } from "react";
import type { z } from "zod";
import { formatarMoeda, lerNumero } from "@/lib/formatar";

const CLASSE_ENTRADA =
  "mt-1.5 block w-full min-h-11 rounded-md border border-borda-forte bg-superficie px-3 py-2 text-base text-texto placeholder:text-texto-3 focus:border-primaria focus:outline-none focus:ring-2 focus:ring-primaria/20 aria-[invalid=true]:border-erro lg:min-h-10";

interface BaseCampo {
  rotulo: ReactNode;
  ajuda?: ReactNode;
  erro?: string;
}

function Moldura({
  id,
  rotulo,
  ajuda,
  erro,
  children,
}: BaseCampo & { id: string; children: ReactNode }) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block font-medium">
        {rotulo}
      </label>
      {ajuda && (
        <p id={`${id}-ajuda`} className="mt-0.5 text-sm text-texto-2">
          {ajuda}
        </p>
      )}
      {children}
      {erro && (
        <p id={`${id}-erro`} role="alert" className="mt-1 text-sm font-medium text-erro">
          {erro}
        </p>
      )}
    </div>
  );
}

function descritoPor(id: string, ajuda?: ReactNode, erro?: string): string | undefined {
  const ids = [ajuda ? `${id}-ajuda` : "", erro ? `${id}-erro` : ""].filter(Boolean).join(" ");
  return ids || undefined;
}

export function CampoTexto({
  rotulo,
  ajuda,
  erro,
  valor,
  aoMudar,
  tipo = "text",
  placeholder,
  autoComplete,
}: BaseCampo & {
  valor: string;
  aoMudar: (v: string) => void;
  tipo?: "text" | "email" | "url" | "date";
  placeholder?: string;
  autoComplete?: string;
}) {
  const id = useId();
  return (
    <Moldura id={id} rotulo={rotulo} ajuda={ajuda} erro={erro}>
      <input
        id={id}
        type={tipo}
        value={valor}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(e) => aoMudar(e.target.value)}
        aria-invalid={erro ? true : undefined}
        aria-describedby={descritoPor(id, ajuda, erro)}
        className={CLASSE_ENTRADA}
      />
    </Moldura>
  );
}

export function CampoData(props: BaseCampo & { valor: string; aoMudar: (v: string) => void }) {
  return <CampoTexto {...props} tipo="date" />;
}

export function CampoAreaTexto({
  rotulo,
  ajuda,
  erro,
  valor,
  aoMudar,
  linhas = 3,
}: BaseCampo & { valor: string; aoMudar: (v: string) => void; linhas?: number }) {
  const id = useId();
  return (
    <Moldura id={id} rotulo={rotulo} ajuda={ajuda} erro={erro}>
      <textarea
        id={id}
        rows={linhas}
        value={valor}
        onChange={(e) => aoMudar(e.target.value)}
        aria-invalid={erro ? true : undefined}
        aria-describedby={descritoPor(id, ajuda, erro)}
        className={CLASSE_ENTRADA}
      />
    </Moldura>
  );
}

/**
 * Campo numérico que aceita "1.950,50" ou "1950.5". Enquanto a pessoa digita, mostra o texto
 * digitado; fora do foco, mostra o número formatado.
 */
export function CampoNumero({
  rotulo,
  ajuda,
  erro,
  valor,
  aoMudar,
  moeda = false,
  sufixo,
}: BaseCampo & {
  valor: number;
  aoMudar: (v: number) => void;
  moeda?: boolean;
  sufixo?: string;
}) {
  const id = useId();
  const [digitando, setDigitando] = useState<string | null>(null);
  const formatado = valor === 0 ? "" : moeda ? formatarMoeda(valor) : valor.toLocaleString("pt-BR");
  return (
    <Moldura id={id} rotulo={rotulo} ajuda={ajuda} erro={erro}>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={digitando ?? formatado}
          placeholder={moeda ? "R$ 0,00" : "0"}
          onFocus={() => setDigitando(valor === 0 ? "" : String(valor).replace(".", ","))}
          onChange={(e) => {
            setDigitando(e.target.value);
            aoMudar(lerNumero(e.target.value) ?? 0);
          }}
          onBlur={() => setDigitando(null)}
          aria-invalid={erro ? true : undefined}
          aria-describedby={descritoPor(id, ajuda, erro)}
          className={`${CLASSE_ENTRADA} numeros`}
        />
        {sufixo && <span className="mt-1 text-texto-2">{sufixo}</span>}
      </div>
    </Moldura>
  );
}

export function CampoSelecao<T extends string>({
  rotulo,
  ajuda,
  erro,
  valor,
  aoMudar,
  opcoes,
}: BaseCampo & { valor: T; aoMudar: (v: T) => void; opcoes: Record<T, string> }) {
  const id = useId();
  return (
    <Moldura id={id} rotulo={rotulo} ajuda={ajuda} erro={erro}>
      <select
        id={id}
        value={valor}
        onChange={(e) => aoMudar(e.target.value as T)}
        aria-invalid={erro ? true : undefined}
        aria-describedby={descritoPor(id, ajuda, erro)}
        className={CLASSE_ENTRADA}
      >
        {(Object.entries(opcoes) as [T, string][]).map(([chave, nome]) => (
          <option key={chave} value={chave}>
            {nome}
          </option>
        ))}
      </select>
    </Moldura>
  );
}

export function CampoMarcar({
  rotulo,
  ajuda,
  marcado,
  aoMudar,
}: {
  rotulo: ReactNode;
  ajuda?: ReactNode;
  marcado: boolean;
  aoMudar: (v: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="mb-4 flex items-start gap-3">
      <input
        id={id}
        type="checkbox"
        checked={marcado}
        onChange={(e) => aoMudar(e.target.checked)}
        aria-describedby={ajuda ? `${id}-ajuda` : undefined}
        className="mt-0.5 h-6 w-6 shrink-0 accent-[#0b5563]"
      />
      <div>
        <label htmlFor={id} className="font-medium">
          {rotulo}
        </label>
        {ajuda && (
          <p id={`${id}-ajuda`} className="mt-0.5 text-sm text-texto-2">
            {ajuda}
          </p>
        )}
      </div>
    </div>
  );
}

/** Erros do Zod por caminho do campo. Ex.: { "emprego.salarioBruto": "Informe um valor..." } */
export function errosPorCampo(erro: z.ZodError): Record<string, string> {
  const erros: Record<string, string> = {};
  for (const problema of erro.issues) {
    const chave = problema.path.join(".");
    if (!erros[chave]) erros[chave] = problema.message;
  }
  return erros;
}
