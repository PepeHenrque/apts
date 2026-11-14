import { describe, expect, it } from "vitest";
import { gerarLinksBusca, separarCidadeUf, slug } from "@/lib/busca/links";
import { lerDataIso } from "@/lib/datas";
import { distanciaKm, formatarDistancia, linkRotaGoogleMaps } from "@/lib/geo/distancia";
import { dadosIniciais } from "./dados-iniciais";
import { gerarDiagnostico } from "./diagnostico";
import { esquemaImovel, esquemaPreferencias, imovelEmBranco } from "./esquemas";
import { avaliarImovelSalvo, extrairDoTexto, ordenarImoveis } from "./imoveis";

const HOJE = lerDataIso("2026-11-14")!;

describe("distância", () => {
  it("Haversine: Praça da Sé (SP) até Campinas ≈ 84 km", () => {
    const se = { lat: -23.5505, lon: -46.6333 };
    const campinas = { lat: -22.9056, lon: -47.0608 };
    expect(distanciaKm(se, campinas)).toBeGreaterThan(80);
    expect(distanciaKm(se, campinas)).toBeLessThan(88);
    expect(distanciaKm(se, se)).toBe(0);
  });

  it("formata e monta link de rota", () => {
    expect(formatarDistancia(0.43)).toBe("430 m");
    expect(formatarDistancia(12.34)).toBe("12,3 km");
    expect(linkRotaGoogleMaps({ lat: -23.5, lon: -46.6 }, "Rua A, 10")).toBe(
      "https://www.google.com/maps/dir/?api=1&origin=-23.5%2C-46.6&destination=Rua+A%2C+10",
    );
  });
});

describe("links de busca", () => {
  it("separa cidade e UF", () => {
    expect(separarCidadeUf("Campinas - SP")).toEqual({ cidade: "Campinas", uf: "SP" });
    expect(separarCidadeUf("São José dos Campos/sp")).toEqual({
      cidade: "São José dos Campos",
      uf: "SP",
    });
    expect(separarCidadeUf("Recife")).toEqual({ cidade: "Recife", uf: "" });
    expect(slug("São José dos Campos")).toBe("sao-jose-dos-campos");
  });

  it("aplica preço máximo e quartos nos links", () => {
    const links = gerarLinksBusca({
      precoMax: 150000.7,
      quartosMin: 2,
      cidade: "Campinas",
      uf: "SP",
      tipo: "apartamento",
    });
    const porSite = Object.fromEntries(links.map((l) => [l.site, l.url]));
    expect(porSite["OLX"]).toContain("/estado-sp?");
    expect(porSite["OLX"]).toContain("pe=150000");
    expect(porSite["OLX"]).toContain("ros=2");
    expect(porSite["Zap Imóveis"]).toContain("/venda/apartamentos/sp+campinas/");
    expect(porSite["Zap Imóveis"]).toContain("precoMaximo=150000");
    expect(porSite["VivaReal"]).toContain("/venda/sp/campinas/apartamento_residencial/");
    expect(porSite["Facebook Marketplace"]).toContain("maxPrice=150000");
    expect(links.map((l) => l.site)).toContain("Imóveis à venda da Caixa");
  });
});

describe("imóvel salvo", () => {
  const estado = dadosIniciais();
  const diagnostico = gerarDiagnostico(estado, HOJE);
  const preferencias = esquemaPreferencias.parse({
    quartosMin: 2,
    condominioMax: 300,
    distanciaMaxKm: 10,
    casaAtual: { id: "c", nome: "Casa", endereco: "", lat: -23.55, lon: -46.63 },
    pontosImportantes: [{ id: "p", nome: "Posto", endereco: "", lat: -23.56, lon: -46.64 }],
  });

  it("rascunho de imóvel abre sem erro", () => {
    expect(imovelEmBranco().titulo).toBe("");
    expect(esquemaImovel.safeParse(imovelEmBranco()).success).toBe(false);
  });

  it("imóvel barato cabe; caro não cabe", () => {
    const barato = esquemaImovel.parse({ id: "1", titulo: "Barato", preco: 50000 });
    const caro = esquemaImovel.parse({ id: "2", titulo: "Caro", preco: 140000 });
    expect(avaliarImovelSalvo(barato, diagnostico, preferencias).avaliacao?.cor).toBe("verde");
    expect(avaliarImovelSalvo(caro, diagnostico, preferencias).avaliacao?.cor).toBe("vermelho");
  });

  it("calcula distâncias e alertas de preferência", () => {
    const longe = esquemaImovel.parse({
      id: "3",
      titulo: "Longe",
      preco: 60000,
      quartos: 1,
      condominio: 400,
      lat: -23.9,
      lon: -46.63,
      aceitaFinanciamento: "nao",
    });
    const a = avaliarImovelSalvo(longe, diagnostico, preferencias);
    expect(a.distanciaCasaKm).toBeGreaterThan(30);
    expect(a.distanciasPontos[0]?.nome).toBe("Posto");
    expect(a.alertas.join(" ")).toMatch(/NÃO aceita financiamento/);
    expect(a.alertas.join(" ")).toMatch(/1 quarto/);
    expect(a.alertas.join(" ")).toMatch(/Condomínio acima/);
    expect(a.alertas.join(" ")).toMatch(/mais de 10 km/);
    expect(a.custoMensal).toBeGreaterThan(400);
  });

  it("ordena por orçamento (verde primeiro) e por distância", () => {
    const lista = [140000, 50000].map((preco, i) =>
      avaliarImovelSalvo(
        esquemaImovel.parse({ id: String(i), titulo: "x", preco, lat: -23.55 - i, lon: -46.63 }),
        diagnostico,
        preferencias,
      ),
    );
    expect(ordenarImoveis(lista, "orcamento")[0]?.imovel.preco).toBe(50000);
    expect(ordenarImoveis(lista, "distancia")[0]?.imovel.preco).toBe(140000);
  });
});

describe("leitura de texto de anúncio (sem IA)", () => {
  it("extrai os principais números", () => {
    const texto =
      "Vendo apto 2 quartos, 1 banheiro, 1 vaga, 45m², R$ 139.900,00. Condomínio R$ 250. IPTU R$ 600/ano. https://exemplo.com/anuncio/1";
    expect(extrairDoTexto(texto)).toEqual({
      preco: 139900,
      quartos: 2,
      banheiros: 1,
      vagas: 1,
      area: 45,
      condominio: 250,
      iptu: 600,
      link: "https://exemplo.com/anuncio/1",
    });
  });

  it("texto sem números não inventa nada", () => {
    expect(extrairDoTexto("Casa bonita, chame no zap")).toEqual({});
  });
});
