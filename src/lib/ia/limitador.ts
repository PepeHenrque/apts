/**
 * Limite simples de uso (em memória do servidor): no máximo `maximo` pedidos por `janelaMs`
 * para cada chave (IP). Protege a cota gratuita do Gemini contra abuso.
 */
export function criarLimitador(maximo: number, janelaMs: number) {
  const registros = new Map<string, number[]>();
  return {
    /** true = pode; false = passou do limite. */
    permitir(chave: string, agora = Date.now()): boolean {
      const recentes = (registros.get(chave) ?? []).filter((t) => agora - t < janelaMs);
      if (recentes.length >= maximo) {
        registros.set(chave, recentes);
        return false;
      }
      recentes.push(agora);
      registros.set(chave, recentes);
      if (registros.size > 5000) registros.clear(); // evita crescer sem fim
      return true;
    },
  };
}

/** IP de quem chamou (Vercel envia x-forwarded-for). */
export function ipDoPedido(cabecalhos: Headers): string {
  return cabecalhos.get("x-forwarded-for")?.split(",")[0]?.trim() || "desconhecido";
}
