"use client";

import { useState, useSyncExternalStore } from "react";
import { Aviso, Botao, Cartao } from "@/components/ui";
import { urlApi } from "@/lib/api";
import { hoje } from "@/lib/datas";
import type { Diagnostico } from "@/lib/dominio/diagnostico";
import type { EstadoFamilia, Imovel } from "@/lib/dominio/esquemas";
import { anonimizarSituacao } from "@/lib/ia/anonimizar";

// ---- A IA está disponível? (pergunta ao servidor uma vez) ----
let disponivel: boolean | null = null;
let consultando = false;
const ouvintes = new Set<() => void>();

function assinar(ouvinte: () => void) {
  ouvintes.add(ouvinte);
  if (disponivel === null && !consultando) {
    consultando = true;
    fetch(urlApi("/api/ia/status"))
      .then((r) => (r.ok ? r.json() : { disponivel: false }))
      .catch(() => ({ disponivel: false }))
      .then((d: { disponivel?: boolean }) => {
        disponivel = Boolean(d.disponivel);
        for (const o of ouvintes) o();
      });
  }
  return () => ouvintes.delete(ouvinte);
}

/** true só se o servidor tiver a chave do Gemini. Sem chave, os botões de IA não aparecem. */
export function useIaDisponivel(): boolean {
  return useSyncExternalStore(
    assinar,
    () => disponivel === true,
    () => false,
  );
}

async function postar<T>(caminho: string, corpo: unknown): Promise<T> {
  const r = await fetch(urlApi(caminho), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corpo),
  });
  const json = (await r.json().catch(() => ({}))) as T & { erro?: string };
  if (!r.ok) throw new Error(json.erro ?? "A IA não respondeu agora. Preencha manualmente.");
  return json;
}

/** Botão "Preencher automaticamente" do formulário de imóvel. */
export function BotaoPreencherIA({
  texto,
  aoPreencher,
}: {
  texto: string;
  aoPreencher: (dados: Partial<Imovel>) => void;
}) {
  const ok = useIaDisponivel();
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  if (!ok) return null;
  return (
    <div>
      <Botao
        variante="secundario"
        disabled={carregando || texto.trim().length < 10}
        onClick={async () => {
          setCarregando(true);
          setErro("");
          try {
            const { dados } = await postar<{ dados: Partial<Imovel> }>("/api/ia/anuncio", {
              texto,
            });
            aoPreencher(dados);
          } catch (e) {
            setErro(e instanceof Error ? e.message : "Erro na IA.");
          } finally {
            setCarregando(false);
          }
        }}
      >
        {carregando ? "Lendo o anúncio…" : "Preencher automaticamente"}
      </Botao>
      {erro && (
        <p role="alert" className="mt-1 font-semibold text-erro">
          {erro}
        </p>
      )}
      <p className="mt-1 text-sm text-texto-2">
        Só o texto do anúncio é enviado ao Google Gemini (nunca nomes, CPF, rendas ou dívidas da
        família).
      </p>
    </div>
  );
}

/** "Explicar minha situação" — envia só números anonimizados. */
export function ExplicarSituacao({
  estado,
  diagnostico,
}: {
  estado: EstadoFamilia;
  diagnostico: Diagnostico;
}) {
  const ok = useIaDisponivel();
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  if (!ok) return null;
  return (
    <Cartao titulo="Explicação em linguagem simples">
      <p className="mb-3 text-texto-2">
        Enviamos ao Google Gemini só números (idades, rendas, tipos de bloqueio), sem nomes nem
        dados de dívidas.
      </p>
      <Botao
        variante="secundario"
        className="w-full"
        disabled={carregando}
        onClick={async () => {
          setCarregando(true);
          setErro("");
          try {
            const r = await postar<{ texto: string }>(
              "/api/ia/explicar",
              anonimizarSituacao(estado, diagnostico, hoje()),
            );
            setTexto(r.texto);
          } catch (e) {
            setErro(e instanceof Error ? e.message : "Erro na IA.");
          } finally {
            setCarregando(false);
          }
        }}
      >
        {carregando ? "Preparando a explicação…" : "Explicar a nossa situação"}
      </Botao>
      {erro && <Aviso tipo="alerta">{erro}</Aviso>}
      {texto && <p className="mt-3 whitespace-pre-line">{texto}</p>}
    </Cartao>
  );
}
