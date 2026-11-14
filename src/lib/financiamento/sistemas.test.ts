import { describe, expect, it } from "vitest";
import {
  evolucaoParcelas,
  fatorPrice,
  parcelaEmprestimo,
  primeiraParcela,
  taxaMensalDeNominalAnual,
  valorFinanciavel,
  type CondicoesFinanciamento,
} from "./sistemas";

const condicoes: CondicoesFinanciamento = {
  prazoMeses: 234,
  taxaMensal: taxaMensalDeNominalAnual(0.045),
  taxaMip: 0.00115,
  taxaAdministracao: 25,
};

describe("SAC x Price", () => {
  it("com a mesma parcela, o SAC financia MENOS que o Price", () => {
    const sac = valorFinanciavel("SAC", 585, condicoes);
    const price = valorFinanciavel("PRICE", 585, condicoes);
    expect(sac).toBeGreaterThan(0);
    expect(sac).toBeLessThan(price);
  });

  it("a primeira parcela do valor financiável é exatamente a parcela disponível", () => {
    for (const sistema of ["SAC", "PRICE"] as const) {
      const valor = valorFinanciavel(sistema, 585, condicoes);
      expect(primeiraParcela(sistema, valor, condicoes)).toBeCloseTo(585, 6);
    }
  });

  it("parcela menor que a taxa de administração → nada financiável", () => {
    expect(valorFinanciavel("SAC", 20, condicoes)).toBe(0);
  });

  it("fator Price sem juros divide igualmente", () => {
    expect(fatorPrice(0, 10)).toBeCloseTo(0.1);
    expect(fatorPrice(0.01, 0)).toBe(0);
  });
});

describe("evolução das parcelas", () => {
  it("SAC: parcelas caem com o tempo e a dívida zera", () => {
    const ev = evolucaoParcelas("SAC", 60000, condicoes, 12);
    expect(ev.linhas).toHaveLength(12);
    expect(ev.linhas[1]!.parcela).toBeLessThan(ev.linhas[0]!.parcela);
    expect(ev.ultimaParcela).toBeLessThan(ev.primeiraParcela);
    expect(ev.primeiraParcela).toBeCloseTo(primeiraParcela("SAC", 60000, condicoes), 6);
  });

  it("Price paga mais no total que o SAC", () => {
    const sac = evolucaoParcelas("SAC", 60000, condicoes);
    const price = evolucaoParcelas("PRICE", 60000, condicoes);
    expect(price.totalPago).toBeGreaterThan(sac.totalPago);
    expect(price.totalJuros).toBeGreaterThan(sac.totalJuros);
  });

  it("Price: saldo zera na última parcela", () => {
    const ev = evolucaoParcelas("PRICE", 60000, { ...condicoes, prazoMeses: 12 }, 12);
    expect(ev.linhas.at(-1)!.saldoDepois).toBeCloseTo(0, 4);
  });
});

describe("empréstimo", () => {
  it("parcela pela tabela Price", () => {
    // R$ 10.000 a 3% ao mês em 24x ≈ R$ 590,47
    expect(parcelaEmprestimo(10000, 0.03, 24)).toBeCloseTo(590.47, 1);
    expect(parcelaEmprestimo(0, 0.03, 24)).toBe(0);
  });
});
