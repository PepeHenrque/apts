import { describe, expect, it } from "vitest";
import { REGRAS } from "@/config/regras-mcmv";
import { lerDataIso } from "@/lib/datas";
import {
  enquadrarFaixa,
  estimarSubsidio,
  idadeEmAnos,
  idadeEmMeses,
  mesesParaJuntar,
  prazoMaximoMeses,
  taxaMipMensal,
} from "./basico";

const HOJE = lerDataIso("2026-11-14")!;

describe("idade", () => {
  it("conta meses completos, considerando o dia do aniversário", () => {
    expect(idadeEmMeses("1965-11-14", HOJE)).toBe(61 * 12);
    expect(idadeEmMeses("1965-11-15", HOJE)).toBe(61 * 12 - 1);
    expect(idadeEmMeses("1965-06-15", HOJE)).toBe(61 * 12 + 4);
    expect(idadeEmAnos("1965-06-15", HOJE)).toBe(61);
  });

  it("data inválida vira idade zero", () => {
    expect(idadeEmMeses("", HOJE)).toBe(0);
    expect(idadeEmMeses("2026-02-30", HOJE)).toBe(0);
  });
});

describe("prazo máximo pela idade (80 anos e 6 meses)", () => {
  it("pessoa de 61 anos → 234 meses (966 − 732)", () => {
    expect(prazoMaximoMeses([idadeEmMeses("1965-11-14", HOJE)])).toBe(234);
  });

  it("pai (61) + filha (18): o prazo é definido pelo mais velho", () => {
    const pai = idadeEmMeses("1965-11-14", HOJE);
    const filha = idadeEmMeses("2008-11-14", HOJE);
    expect(prazoMaximoMeses([filha])).toBe(420);
    expect(prazoMaximoMeses([pai, filha])).toBe(234);
  });

  it("jovem fica limitado a 420 meses", () => {
    expect(prazoMaximoMeses([20 * 12])).toBe(REGRAS.prazoMaximoMeses);
  });

  it("idade muito alta → prazo curto ou zero", () => {
    expect(prazoMaximoMeses([80 * 12])).toBe(6);
    expect(prazoMaximoMeses([85 * 12])).toBe(0);
    expect(prazoMaximoMeses([])).toBe(0);
  });
});

describe("faixas do MCMV (limites inclusivos)", () => {
  it.each([
    [0, "F1"],
    [1950, "F1"],
    [3200, "F1"],
    [3200.01, "F2"],
    [5000, "F2"],
    [5000.01, "F3"],
    [9600, "F3"],
    [9600.01, "F4"],
    [13000, "F4"],
  ])("renda %d → %s", (renda, faixa) => {
    expect(enquadrarFaixa(renda)?.id).toBe(faixa);
  });

  it("acima de R$ 13.000 fica fora do MCMV", () => {
    expect(enquadrarFaixa(13000.01)).toBeNull();
  });
});

describe("seguro MIP cresce com a idade", () => {
  it("usa a linha da tabela da idade", () => {
    expect(taxaMipMensal(20)).toBe(0.0001);
    expect(taxaMipMensal(61)).toBe(0.00115);
    expect(taxaMipMensal(61)).toBeGreaterThan(taxaMipMensal(40));
    expect(taxaMipMensal(95)).toBe(REGRAS.mipPorIdade.at(-1)?.taxaMensal);
  });
});

describe("subsídio estimado", () => {
  const f1 = enquadrarFaixa(1500);
  const f2 = enquadrarFaixa(3500);
  it("renda baixa recebe o teto", () => {
    expect(estimarSubsidio(1500, f1)).toBe(55000);
  });
  it("cai em linha reta com a renda", () => {
    expect(estimarSubsidio(3500, f2)).toBe(27500);
    expect(estimarSubsidio(5000, enquadrarFaixa(5000))).toBe(0);
  });
  it("Faixas 3, 4 e fora do MCMV não têm subsídio", () => {
    expect(estimarSubsidio(6000, enquadrarFaixa(6000))).toBe(0);
    expect(estimarSubsidio(1000, null)).toBe(0);
  });
});

describe("meses para juntar a entrada", () => {
  it("arredonda para cima", () => {
    expect(mesesParaJuntar(1000, 300)).toBe(4);
  });
  it("nada a juntar → 0; não guarda nada → null", () => {
    expect(mesesParaJuntar(0, 300)).toBe(0);
    expect(mesesParaJuntar(100, 0)).toBeNull();
  });
});
