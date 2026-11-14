import { describe, expect, it } from "vitest";
import { dadosIniciais, ID_MAE, ID_PAI } from "./dados-iniciais";
import { descreverMudancasPessoa } from "./historico";

const estado = dadosIniciais();
const mae = estado.pessoas.find((p) => p.id === ID_MAE)!;
const pai = estado.pessoas.find((p) => p.id === ID_PAI)!;

describe("descrição do histórico", () => {
  it("pessoa nova", () => {
    expect(descreverMudancasPessoa(null, mae)).toBe("Adicionou Mãe");
  });

  it("mudança de salário e de trabalho", () => {
    const depois = {
      ...mae,
      emprego: { ...mae.emprego, situacao: "clt" as const, salarioBruto: 1200 },
    };
    const texto = descreverMudancasPessoa(mae, depois);
    expect(texto).toContain("salário de Mãe: R$ 0 → R$ 1.200");
    expect(texto).toContain("Carteira assinada");
  });

  it("dívida paga", () => {
    const depois = {
      ...pai,
      cpf: {
        ...pai.cpf,
        dividas: pai.cpf.dividas.map((d) => ({ ...d, status: "pago" as const })),
      },
    };
    expect(descreverMudancasPessoa(pai, depois)).toContain("1 dívida(s) de Pai como paga(s)");
  });

  it("sem mudanças", () => {
    expect(descreverMudancasPessoa(pai, pai)).toContain("sem mudanças");
  });
});
