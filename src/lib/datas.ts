/**
 * Datas são guardadas como texto "AAAA-MM-DD" (sem fuso horário).
 * Estas funções convertem sem o erro clássico de fuso (new Date("2026-11-14") vira dia 13 no Brasil).
 */

const PADRAO_DATA = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Converte "AAAA-MM-DD" em Date local (meia-noite). Retorna null se inválida. */
export function lerDataIso(texto: string | null | undefined): Date | null {
  if (!texto) return null;
  const m = PADRAO_DATA.exec(texto);
  if (!m) return null;
  const [ano, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const data = new Date(ano, mes - 1, dia);
  if (data.getFullYear() !== ano || data.getMonth() !== mes - 1 || data.getDate() !== dia) {
    return null;
  }
  return data;
}

/** Converte Date em "AAAA-MM-DD" (data local). */
export function paraDataIso(data: Date): string {
  const a = data.getFullYear();
  const m = String(data.getMonth() + 1).padStart(2, "0");
  const d = String(data.getDate()).padStart(2, "0");
  return `${a}-${m}-${d}`;
}

/** Diferença em dias inteiros (b - a), ignorando horário. */
export function diasEntre(a: Date, b: Date): number {
  const ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((ub - ua) / 86_400_000);
}

/** Soma dias a uma data. */
export function somarDias(data: Date, dias: number): Date {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate() + dias);
}

/** Início do dia de hoje (para cálculos que dependem da data atual). */
export function hoje(): Date {
  const agora = new Date();
  return new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
}
