/**
 * Links digitados por pessoas (anúncios, fotos) só viram links clicáveis se forem http(s).
 * Evita "javascript:" e "data:" — os dados da família são compartilhados entre aparelhos.
 */
export function linkSeguro(url: string | null | undefined): string | null {
  const texto = url?.trim() ?? "";
  if (!/^https?:\/\//i.test(texto)) return null;
  try {
    return new URL(texto).toString();
  } catch {
    return null;
  }
}
