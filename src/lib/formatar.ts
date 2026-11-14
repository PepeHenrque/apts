const formatadorMoeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** Formata um valor em reais. Ex.: 1950 → "R$ 1.950,00". */
export function formatarMoeda(valor: number): string {
  // Intl usa espaço não separável (U+00A0) depois de "R$"; normalizamos para espaço comum.
  return formatadorMoeda.format(valor).replace(/ /g, " ");
}
