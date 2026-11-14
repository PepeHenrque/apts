import { describe, expect, it } from "vitest";
import {
  formatarData,
  formatarMoeda,
  formatarMoedaInteira,
  formatarPercentual,
  formatarPrazo,
  lerNumero,
} from "./formatar";

describe("formatação", () => {
  it("moeda no padrão brasileiro", () => {
    expect(formatarMoeda(1950)).toBe("R$ 1.950,00");
    expect(formatarMoeda(140000)).toBe("R$ 140.000,00");
    expect(formatarMoedaInteira(83512.6)).toBe("R$ 83.513");
  });

  it("percentual, prazo e data", () => {
    expect(formatarPercentual(0.045)).toBe("4,50%");
    expect(formatarPrazo(234)).toBe("19 anos e 6 meses");
    expect(formatarPrazo(12)).toBe("1 ano");
    expect(formatarPrazo(1)).toBe("1 mês");
    expect(formatarData("2027-01-31")).toBe("31/01/2027");
    expect(formatarData("")).toBe("");
  });
});

describe("lerNumero", () => {
  it.each([
    ["1.950,50", 1950.5],
    ["1950.5", 1950.5],
    ["R$ 2.000", 2000],
    ["2.000.000", 2000000],
    ["4,5%", 4.5],
    ["140000", 140000],
  ])("%s → %d", (texto, esperado) => {
    expect(lerNumero(texto)).toBe(esperado);
  });

  it("vazio ou inválido → null", () => {
    expect(lerNumero("")).toBeNull();
    expect(lerNumero("abc")).toBeNull();
  });
});
