import { lerDataIso } from "@/lib/datas";

const formatadorMoeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const formatadorMoedaInteira = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

/** Formata um valor em reais. Ex.: 1950 → "R$ 1.950,00". */
export function formatarMoeda(valor: number): string {
  // Intl usa espaço não separável (U+00A0) depois de "R$"; normalizamos para espaço comum.
  return formatadorMoeda.format(valor).replace(/ /g, " ");
}

/** Reais sem centavos (para valores grandes). Ex.: 83512.4 → "R$ 83.512". */
export function formatarMoedaInteira(valor: number): string {
  return formatadorMoedaInteira.format(Math.round(valor)).replace(/ /g, " ");
}

/** Fração em porcentagem. Ex.: 0.045 → "4,50%". */
export function formatarPercentual(fracao: number, casas = 2): string {
  return (
    (fracao * 100).toLocaleString("pt-BR", {
      minimumFractionDigits: casas,
      maximumFractionDigits: casas,
    }) + "%"
  );
}

/** Meses em texto. Ex.: 234 → "19 anos e 6 meses". */
export function formatarPrazo(meses: number): string {
  const anos = Math.floor(meses / 12);
  const resto = meses % 12;
  const partes: string[] = [];
  if (anos > 0) partes.push(`${anos} ${anos === 1 ? "ano" : "anos"}`);
  if (resto > 0) partes.push(`${resto} ${resto === 1 ? "mês" : "meses"}`);
  return partes.length ? partes.join(" e ") : "0 meses";
}

/** "AAAA-MM-DD" → "DD/MM/AAAA". Vazio/inválido → "". */
export function formatarData(iso: string): string {
  const data = lerDataIso(iso);
  if (!data) return "";
  return data.toLocaleDateString("pt-BR");
}

/** Data e hora ISO completa → "14/11/2026 às 10:30". */
export function formatarDataHora(isoCompleto: string): string {
  const data = new Date(isoCompleto);
  if (Number.isNaN(data.getTime())) return "";
  const dia = data.toLocaleDateString("pt-BR");
  const hora = data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `${dia} às ${hora}`;
}

/**
 * Lê número digitado no formato brasileiro ou comum.
 * "1.950,50" → 1950.5; "1950.5" → 1950.5; "R$ 2.000" → 2000; "" → null.
 */
export function lerNumero(texto: string): number | null {
  let limpo = texto.replace(/[R$\s%]/g, "");
  if (!limpo) return null;
  if (limpo.includes(",")) {
    limpo = limpo.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(limpo)) {
    limpo = limpo.replace(/\./g, ""); // "2.000" é dois mil, não dois
  }
  const n = Number(limpo);
  return Number.isFinite(n) ? n : null;
}
