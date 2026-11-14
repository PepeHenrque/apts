import { describe, expect, it } from "vitest";
import {
  CHECKLIST_FAIXA1,
  CHECKLIST_IMOVEL,
  CHECKLIST_LIMPAR_NOME,
  CHECKLIST_REPASSE,
  secoesDocumentos,
} from "./checklists";
import { dadosIniciais, ID_FILHA, ID_PAI } from "./dados-iniciais";

describe("checklists", () => {
  it("documentos mudam conforme o trabalho de cada comprador", () => {
    const secoes = secoesDocumentos(dadosIniciais().pessoas);
    const prefixos = secoes.map((s) => s.prefixo);
    expect(prefixos).toContain("docs-gerais");
    expect(prefixos).toContain(`docs-${ID_PAI}`);
    expect(prefixos).toContain(`docs-${ID_FILHA}`);
    // A mãe está sem trabalho: não há comprovante de renda para ela.
    expect(secoes).toHaveLength(3);
    const filha = secoes.find((s) => s.prefixo === `docs-${ID_FILHA}`)!;
    expect(filha.itens.map((i) => i.id)).toContain("contrato-aprendiz");
  });

  it("ids são únicos em cada lista (senão as marcações se misturam)", () => {
    for (const itens of [
      CHECKLIST_REPASSE,
      CHECKLIST_IMOVEL.itens,
      CHECKLIST_LIMPAR_NOME.itens,
      CHECKLIST_FAIXA1.itens,
    ]) {
      const ids = itens.map((i) => i.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});
