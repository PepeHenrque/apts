import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  areaDaDescricao,
  compararComAnterior,
  dataDeGeracao,
  lerListaCaixa,
  lerValorCaixa,
  nomeProprio,
  quartosDaDescricao,
  tipoDaDescricao,
} from "./parser";

// Amostra real (primeiras linhas do arquivo oficial de SP, baixado em 14/11/2026), em latin1.
const AMOSTRA = new TextDecoder("latin1").decode(
  readFileSync(join(__dirname, "__fixtures__", "Lista_imoveis_SP_amostra.csv")),
);

describe("lista de imóveis da Caixa", () => {
  const imoveis = lerListaCaixa(AMOSTRA, "2026-11-14");

  it("lê todas as linhas de imóvel da amostra real", () => {
    expect(imoveis.length).toBeGreaterThanOrEqual(30);
    expect(dataDeGeracao(AMOSTRA)).toBe("2026-11-13");
  });

  it("normaliza o primeiro imóvel da amostra", () => {
    const primeiro = imoveis[0]!;
    expect(primeiro).toMatchObject({
      id: "1444421729441",
      uf: "SP",
      cidade: "Adamantina",
      bairro: "Gov Mario Covas",
      preco: 136584.86,
      avaliacao: 217000,
      desconto: 37.06,
      aceitaFinanciamento: false,
      tipo: "casa",
      quartos: 2,
      area: 116.12,
      modalidade: "Venda Direta Online",
      vistoDesde: "2026-11-14",
    });
    expect(primeiro.link).toBe(
      "https://venda-imoveis.caixa.gov.br/sistema/detalhe-imovel.asp?hdnimovel=1444421729441",
    );
  });

  it("todos têm preço, UF e link oficial", () => {
    for (const i of imoveis) {
      expect(i.preco).toBeGreaterThan(0);
      expect(i.uf).toBe("SP");
      expect(i.link.startsWith("https://venda-imoveis.caixa.gov.br/")).toBe(true);
    }
  });
});

describe("partes do parser", () => {
  it("valores em reais e percentuais", () => {
    expect(lerValorCaixa("136.584,86")).toBe(136584.86);
    expect(lerValorCaixa("37.06")).toBe(37.06);
    expect(lerValorCaixa("")).toBe(0);
  });

  it("descrição → tipo, quartos e área", () => {
    const d =
      "Apartamento, 0.00 de área total, 42.65 de área privativa, 0.00 de área do terreno, 2 qto(s), WC, 1 sala(s), cozinha.";
    expect(tipoDaDescricao(d)).toBe("apartamento");
    expect(quartosDaDescricao(d)).toBe(2);
    expect(areaDaDescricao(d)).toBe(42.65);
    expect(tipoDaDescricao("Terreno, 250.00 de área total")).toBe("terreno");
    expect(quartosDaDescricao("Terreno, 250.00 de área total")).toBeNull();
    expect(nomeProprio("SAO JOSE DOS CAMPOS")).toBe("Sao Jose dos Campos");
  });

  it("linhas que não são de imóvel são ignoradas", () => {
    expect(lerListaCaixa("lixo;;;\n\n;;;;", "2026-11-14")).toEqual([]);
  });
});

describe("comparação com o dia anterior", () => {
  const base = lerListaCaixa(AMOSTRA, "2026-11-10");

  it("marca novos, preserva a data de entrada e as coordenadas, e lista os que saíram", () => {
    const anterior = base
      .slice(0, 5)
      .map((i, n) => (n === 0 ? { ...i, lat: -21.6, lon: -51.07 } : i));
    const atual = lerListaCaixa(AMOSTRA, "2026-11-14").slice(1, 8);
    const r = compararComAnterior(atual, anterior, "2026-11-14");
    expect(r.novos).toEqual(atual.slice(4).map((i) => i.id));
    expect(r.imoveis[0]!.vistoDesde).toBe("2026-11-10");
    expect(r.removidos.map((x) => x.id)).toEqual([anterior[0]!.id]);
    expect(r.removidos[0]!.saiuEm).toBe("2026-11-14");
  });

  it("esquece removidos com mais de 30 dias", () => {
    const r = compararComAnterior([], [], "2026-11-14", [
      { id: "1", saiuEm: "2026-09-01", cidade: "X", preco: 1 },
      { id: "2", saiuEm: "2026-11-01", cidade: "X", preco: 1 },
    ]);
    expect(r.removidos.map((x) => x.id)).toEqual(["2"]);
  });
});
