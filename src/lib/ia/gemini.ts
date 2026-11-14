/**
 * Chamada ao Gemini (Google AI Studio, nível gratuito) pela API REST — sem SDK.
 * SÓ no servidor: a chave GEMINI_API_KEY nunca vai para o navegador.
 *
 * Privacidade: no nível gratuito o Google pode usar o que é enviado para melhorar os modelos.
 * Por isso só enviamos texto de anúncio ou números anonimizados — nunca nomes, CPF ou dívidas.
 */

export const MODELO_PADRAO = "gemini-flash-latest";

export class ErroCotaIA extends Error {}
export class ErroIA extends Error {}

export function iaConfigurada(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

/** Tira do texto qualquer coisa com cara de CPF ou e-mail (por precaução). */
export function limparTextoParaIA(texto: string): string {
  return texto
    .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, "[removido]")
    .replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, "[removido]")
    .slice(0, 6000);
}

/** Extrai o texto da resposta do generateContent. */
export function textoDaResposta(json: unknown): string {
  const r = json as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  return r.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
}

export async function chamarGemini(opcoes: {
  prompt: string;
  esquemaResposta?: Record<string, unknown>;
  json?: boolean;
}): Promise<string> {
  const chave = process.env.GEMINI_API_KEY;
  if (!chave) throw new ErroIA("IA não configurada.");
  const modelo = process.env.GEMINI_MODELO || MODELO_PADRAO;
  const resposta = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelo)}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": chave },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: opcoes.prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1024,
          ...(opcoes.json
            ? { responseMimeType: "application/json", responseSchema: opcoes.esquemaResposta }
            : {}),
        },
      }),
      signal: AbortSignal.timeout(25_000),
    },
  );
  if (resposta.status === 429) throw new ErroCotaIA("Limite da IA atingido.");
  if (!resposta.ok) throw new ErroIA(`Gemini respondeu ${resposta.status}.`);
  const texto = textoDaResposta(await resposta.json());
  if (!texto) throw new ErroIA("Resposta vazia da IA.");
  return texto;
}
