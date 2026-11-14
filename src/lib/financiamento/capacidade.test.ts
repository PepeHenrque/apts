import { describe, expect, it } from "vitest";
import { calcularCenario, type Proponente } from "./capacidade";
import { primeiraParcela } from "./sistemas";
import { avaliarImovel, corDoOrcamento, custoCompraFinanciada, custoRepasse } from "./orcamento";

function proponente(dados: Partial<Proponente> = {}): Proponente {
  return {
    id: "p",
    nome: "Pai",
    idadeMeses: 61 * 12,
    rendaComprovada: 1950,
    rendaNaoComprovada: 0,
    rendaTemporaria: false,
    situacaoCpf: "limpo",
    compromissosMensais: 0,
    fgtsSaldo: 0,
    fgtsTem3Anos: false,
    temImovel: false,
    ...dados,
  };
}

describe("cenário de um comprador", () => {
  it("renda R$ 1.950 → parcela máxima de 30% (R$ 585) e Faixa 1", () => {
    const r = calcularCenario({
      proponentes: [proponente()],
      rendaFamiliar: 1950,
      recursosProprios: 0,
    });
    expect(r.parcelaMaxima).toBeCloseTo(585);
    expect(r.faixa?.id).toBe("F1");
    expect(r.prazoMeses).toBe(234);
    expect(r.viavel).toBe(true);
    expect(primeiraParcela("SAC", r.financiavel.SAC, r.condicoes)).toBeCloseTo(585, 4);
  });

  it("SAC financia menos que Price → preço máximo menor ou igual", () => {
    const r = calcularCenario({
      proponentes: [proponente()],
      rendaFamiliar: 1950,
      recursosProprios: 0,
    });
    expect(r.financiavel.SAC).toBeLessThan(r.financiavel.PRICE);
    expect(r.precoMaximo.SAC).toBeLessThanOrEqual(r.precoMaximo.PRICE);
  });

  it("CPF negativado → cenário inviável, com o motivo", () => {
    const r = calcularCenario({
      proponentes: [proponente({ situacaoCpf: "negativado" })],
      rendaFamiliar: 1950,
      recursosProprios: 0,
    });
    expect(r.viavel).toBe(false);
    expect(r.impedimentos.map((i) => i.codigo)).toContain("cpf-negativado");
    expect(r.impedimentos[0]?.mensagem).toMatch(/negativado/);
  });

  it("ignorando o CPF, mostra o potencial depois de limpar o nome", () => {
    const r = calcularCenario({
      proponentes: [proponente({ situacaoCpf: "negativado" })],
      rendaFamiliar: 1950,
      recursosProprios: 0,
      ignorarCpf: true,
    });
    expect(r.viavel).toBe(true);
  });

  it("aguardando score também bloqueia (temporariamente)", () => {
    const r = calcularCenario({
      proponentes: [proponente({ situacaoCpf: "aguardando-score" })],
      rendaFamiliar: 1950,
      recursosProprios: 0,
    });
    expect(r.impedimentos.map((i) => i.codigo)).toEqual(["aguardando-score"]);
  });

  it("sem renda comprovada não pode ser titular sozinho", () => {
    const r = calcularCenario({
      proponentes: [proponente({ nome: "Mãe", rendaComprovada: 0 })],
      rendaFamiliar: 1950,
      recursosProprios: 0,
    });
    expect(r.viavel).toBe(false);
    expect(r.impedimentos.map((i) => i.codigo)).toContain("sem-renda");
  });

  it("idade alta demais → prazo curto e inviável", () => {
    const r = calcularCenario({
      proponentes: [proponente({ idadeMeses: 78 * 12 })],
      rendaFamiliar: 1950,
      recursosProprios: 0,
    });
    expect(r.prazoMeses).toBe(30);
    expect(r.impedimentos.map((i) => i.codigo)).toContain("idade");
  });

  it("compromissos mensais (empréstimo, cartão) reduzem a parcela", () => {
    const sem = calcularCenario({
      proponentes: [proponente()],
      rendaFamiliar: 1950,
      recursosProprios: 0,
    });
    const com = calcularCenario({
      proponentes: [proponente({ compromissosMensais: 200 })],
      rendaFamiliar: 1950,
      recursosProprios: 0,
      compromissosExtras: 100,
    });
    expect(com.parcelaMaxima).toBeCloseTo(285);
    expect(com.precoMaximo.SAC).toBeLessThan(sem.precoMaximo.SAC);
  });

  it("compromissos maiores que 30% da renda → sem parcela possível", () => {
    const r = calcularCenario({
      proponentes: [proponente({ compromissosMensais: 600 })],
      rendaFamiliar: 1950,
      recursosProprios: 0,
    });
    expect(r.impedimentos.map((i) => i.codigo)).toContain("parcela-insuficiente");
  });

  it("quem já tem imóvel sai do MCMV (sem subsídio)", () => {
    const r = calcularCenario({
      proponentes: [proponente({ temImovel: true })],
      rendaFamiliar: 1950,
      recursosProprios: 0,
    });
    expect(r.dentroDoMcmv).toBe(false);
    expect(r.subsidio).toBe(0);
    expect(r.avisos.join(" ")).toMatch(/já tem imóvel/);
  });

  it("FGTS só entra com 3 anos de contribuição", () => {
    const sem3 = calcularCenario({
      proponentes: [proponente({ fgtsSaldo: 5000 })],
      rendaFamiliar: 1950,
      recursosProprios: 0,
    });
    const com3 = calcularCenario({
      proponentes: [proponente({ fgtsSaldo: 5000, fgtsTem3Anos: true })],
      rendaFamiliar: 1950,
      recursosProprios: 0,
    });
    expect(sem3.fgts).toBe(0);
    expect(com3.fgts).toBe(5000);
    expect(com3.precoMaximo.SAC).toBeGreaterThan(sem3.precoMaximo.SAC);
  });

  it("sem subsídio nem entrada, o banco não financia 100% → preço máximo zero", () => {
    const r = calcularCenario({
      proponentes: [proponente({ rendaComprovada: 6000, idadeMeses: 30 * 12 })],
      rendaFamiliar: 6000,
      recursosProprios: 0,
    });
    expect(r.faixa?.id).toBe("F3");
    expect(r.financiavel.SAC).toBeGreaterThan(0);
    expect(r.precoMaximo.SAC).toBe(0);
    expect(r.limitadoPor).toBe("entrada");
  });

  it("composição de renda: pai + filha soma as rendas, prazo pelo mais velho", () => {
    const pai = proponente();
    const filha = proponente({
      id: "f",
      nome: "Filha",
      idadeMeses: 18 * 12,
      rendaComprovada: 1800,
    });
    const sozinha = calcularCenario({
      proponentes: [filha],
      rendaFamiliar: 3750,
      recursosProprios: 0,
    });
    const juntos = calcularCenario({
      proponentes: [pai, filha],
      rendaFamiliar: 3750,
      recursosProprios: 0,
    });
    expect(juntos.rendaComprovada).toBe(3750);
    expect(juntos.prazoMeses).toBe(234);
    expect(sozinha.prazoMeses).toBe(420);
  });

  it("nenhum comprador → inviável", () => {
    const r = calcularCenario({ proponentes: [], rendaFamiliar: 0, recursosProprios: 0 });
    expect(r.viavel).toBe(false);
  });
});

describe("avaliação de um imóvel", () => {
  const cenario = calcularCenario({
    proponentes: [proponente()],
    rendaFamiliar: 1950,
    recursosProprios: 10000,
  });

  it("cor: verde até o preço máximo, amarelo até +10%, vermelho acima", () => {
    expect(corDoOrcamento(100, 100)).toBe("verde");
    expect(corDoOrcamento(110, 100)).toBe("amarelo");
    expect(corDoOrcamento(110.01, 100)).toBe("vermelho");
    expect(corDoOrcamento(50, 0)).toBe("vermelho");
  });

  it("imóvel no preço máximo cabe e não falta entrada", () => {
    const a = avaliarImovel(Math.floor(cenario.precoMaximo.SAC), cenario);
    expect(a.cor).toBe("verde");
    expect(a.faltaEntrada).toBeCloseTo(0, 0);
    expect(a.parcelaEstimada).toBeLessThanOrEqual(cenario.parcelaMaxima + 0.01);
  });

  it("imóvel caro mostra quanto falta de entrada e a renda necessária", () => {
    const a = avaliarImovel(200000, cenario);
    expect(a.cor).toBe("vermelho");
    expect(a.faltaEntrada).toBeGreaterThan(0);
    expect(a.rendaNecessaria).toBeGreaterThan(1950);
  });

  it("custo total da compra financiada soma entrada e parcelas", () => {
    const custo = custoCompraFinanciada(80000, cenario);
    expect(custo.custoTotal).toBeCloseTo(custo.entrada + custo.totalParcelas, 6);
    expect(custo.totalParcelas).toBeGreaterThan(0);
  });
});

describe("repasse", () => {
  it("soma ágio, custos e parcelas restantes", () => {
    const r = custoRepasse({
      agio: 30000,
      saldoDevedor: 90000,
      parcelaAtual: 800,
      parcelasRestantes: 200,
      custosTransferencia: 5000,
    });
    expect(r.desembolsoInicial).toBe(35000);
    expect(r.totalParcelas).toBe(160000);
    expect(r.custoTotal).toBe(195000);
    expect(r.valorEquivalente).toBe(120000);
  });
});
