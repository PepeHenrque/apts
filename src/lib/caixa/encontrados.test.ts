import { describe, expect, it } from "vitest";
import { lerDataIso } from "@/lib/datas";
import { esquemaImovel } from "@/lib/dominio/esquemas";
import {
  ehNovo,
  filtrarEncontrados,
  normalizarLugar,
  paraImovelSalvo,
  type FiltroEncontrados,
} from "./encontrados";
import type { ImovelCaixa } from "./parser";

const HOJE = lerDataIso("2026-11-14")!;

function imovel(dados: Partial<ImovelCaixa>): ImovelCaixa {
  return {
    id: "1",
    uf: "SP",
    cidade: "Campinas",
    bairro: "Centro",
    endereco: "Rua A, 10",
    preco: 120000,
    avaliacao: 150000,
    desconto: 20,
    aceitaFinanciamento: true,
    tipo: "apartamento",
    quartos: 2,
    area: 45,
    descricao: "",
    modalidade: "Venda Direta Online",
    link: "https://venda-imoveis.caixa.gov.br/sistema/detalhe-imovel.asp?hdnimovel=1",
    lat: null,
    lon: null,
    vistoDesde: "2026-11-01",
    ...dados,
  };
}

const FILTRO: FiltroEncontrados = {
  precoMaximo: 130000,
  incluirAmarelo: false,
  lugares: ["Campinas"],
  tipo: "apartamento",
  quartosMin: 2,
  soFinanciamento: true,
  casa: { lat: -22.9, lon: -47.06 },
  distanciaMaxKm: 15,
};

describe("filtro dos imóveis encontrados", () => {
  const base = { baseDesde: "2026-11-01" };

  it("aplica preço, financiamento, tipo, quartos, cidade e distância", () => {
    const lista = [
      imovel({ id: "ok" }),
      imovel({ id: "caro", preco: 140000 }),
      imovel({ id: "sem-financ", aceitaFinanciamento: false }),
      imovel({ id: "casa", tipo: "casa" }),
      imovel({ id: "1-quarto", quartos: 1 }),
      imovel({ id: "outra-cidade", cidade: "Sumare", bairro: "X" }),
      imovel({ id: "longe", lat: -23.55, lon: -46.63 }),
      imovel({ id: "perto", lat: -22.91, lon: -47.07 }),
    ];
    const ids = filtrarEncontrados({ ...base, imoveis: lista }, FILTRO, HOJE).map(
      (e) => e.imovel.id,
    );
    expect(ids.sort()).toEqual(["ok", "perto"]);
  });

  it("faixa amarela inclui até 10% acima do preço máximo", () => {
    const lista = [imovel({ id: "caro", preco: 140000 })];
    expect(
      filtrarEncontrados({ ...base, imoveis: lista }, { ...FILTRO, incluirAmarelo: true }, HOJE),
    ).toHaveLength(1);
  });

  it("bairro desejado também conta e acentos não atrapalham", () => {
    expect(normalizarLugar("São José  dos Campos")).toBe("sao jose dos campos");
    const lista = [imovel({ id: "b", cidade: "Sao Jose Dos Campos", bairro: "Jardim Satelite" })];
    const r = filtrarEncontrados(
      { ...base, imoveis: lista },
      { ...FILTRO, lugares: ["Jardim Satélite"] },
      HOJE,
    );
    expect(r).toHaveLength(1);
  });

  it("novos aparecem primeiro; imóveis da primeira lista não contam como novos", () => {
    const lista = [
      imovel({ id: "antigo", preco: 100000 }),
      imovel({ id: "novo", preco: 125000, vistoDesde: "2026-11-12" }),
    ];
    const r = filtrarEncontrados({ ...base, imoveis: lista }, FILTRO, HOJE);
    expect(r.map((e) => [e.imovel.id, e.novo])).toEqual([
      ["novo", true],
      ["antigo", false],
    ]);
    expect(ehNovo(imovel({ vistoDesde: "2026-11-01" }), "2026-11-01", HOJE)).toBe(false);
    expect(ehNovo(imovel({ vistoDesde: "2026-11-02" }), "2026-11-01", HOJE)).toBe(false); // mais de 7 dias
  });

  it("converte para imóvel salvo válido", () => {
    const salvo = paraImovelSalvo(imovel({}), "x", "Mãe", "2026-11-14T10:00:00.000Z");
    expect(esquemaImovel.safeParse(salvo).success).toBe(true);
    expect(salvo.titulo).toBe("Apartamento 2 quarto(s) — Centro (Caixa)");
    expect(salvo.aceitaFinanciamento).toBe("sim");
  });
});
