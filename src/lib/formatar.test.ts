import { describe, expect, it } from "vitest";
import { formatarMoeda } from "./formatar";

describe("formatarMoeda", () => {
  it("formata no padrão brasileiro", () => {
    expect(formatarMoeda(1950)).toBe("R$ 1.950,00");
    expect(formatarMoeda(140000)).toBe("R$ 140.000,00");
  });

  it("arredonda centavos", () => {
    expect(formatarMoeda(585.005)).toMatch(/^R\$ 585,0[01]$/);
  });
});
