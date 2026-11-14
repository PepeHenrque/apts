import { describe, expect, it } from "vitest";
import { lerDataIso } from "@/lib/datas";
import { avaliarImovel } from "@/lib/financiamento/orcamento";
import {
  gerarCenarios,
  melhorCenario,
  mudancasFuturas,
  rendaFamiliarNaData,
  rendaNaData,
  situacaoCpfNaData,
} from "./cenarios";
import { dadosIniciais, ID_FILHA, ID_MAE, ID_PAI } from "./dados-iniciais";
import { esquemaImovel, esquemaPessoa, estadoVazio, lerEstado, type Pessoa } from "./esquemas";

const HOJE = lerDataIso("2026-11-14")!;

function pessoa(dados: Partial<Pessoa> = {}): Pessoa {
  return esquemaPessoa.parse({ id: "x", nome: "Fulano", dataNascimento: "1990-01-01", ...dados });
}

describe("validação (Zod)", () => {
  it("pessoa sem nome ou com data inválida é rejeitada", () => {
    expect(
      esquemaPessoa.safeParse({ id: "x", nome: "", dataNascimento: "1990-01-01" }).success,
    ).toBe(false);
    expect(
      esquemaPessoa.safeParse({ id: "x", nome: "Ana", dataNascimento: "01/01/1990" }).success,
    ).toBe(false);
  });

  it("salário negativo é rejeitado", () => {
    const r = esquemaPessoa.safeParse({
      id: "x",
      nome: "Ana",
      dataNascimento: "1990-01-01",
      emprego: { situacao: "clt", salarioBruto: -10 },
    });
    expect(r.success).toBe(false);
  });

  it("campos não informados recebem valores padrão", () => {
    const p = pessoa();
    expect(p.emprego.situacao).toBe("desempregado");
    expect(p.cpf.negativado).toBe(false);
    expect(p.compromissos).toEqual([]);
  });

  it("imóvel precisa de título e preço", () => {
    expect(esquemaImovel.safeParse({ id: "i", titulo: "Apto", preco: 0 }).success).toBe(false);
    expect(esquemaImovel.safeParse({ id: "i", titulo: "Apto", preco: 140000 }).success).toBe(true);
  });

  it("estado salvo é lido com segurança", () => {
    expect(lerEstado({})).toEqual(estadoVazio());
    expect(lerEstado({ pessoas: "isto não é uma lista" })).toBeNull();
    expect(lerEstado(dadosIniciais())?.pessoas).toHaveLength(3);
  });
});

describe("renda e CPF na data", () => {
  it("renda acaba depois do fim previsto do contrato", () => {
    const p = pessoa({
      emprego: {
        situacao: "jovem-aprendiz",
        ocupacao: "",
        salarioBruto: 950,
        dataInicio: "",
        dataFimPrevista: "2027-01-31",
      },
    });
    expect(rendaNaData(p, lerDataIso("2027-01-31")!).comprovada).toBe(950);
    expect(rendaNaData(p, lerDataIso("2027-02-01")!).comprovada).toBe(0);
    expect(rendaNaData(p, HOJE).temporaria).toBe(true);
  });

  it("renda informal não é comprovada, mas conta na renda familiar", () => {
    const p = pessoa({
      emprego: {
        situacao: "autonomo-informal",
        ocupacao: "",
        salarioBruto: 1200,
        dataInicio: "",
        dataFimPrevista: "",
      },
    });
    expect(rendaNaData(p, HOJE)).toEqual({ comprovada: 0, naoComprovada: 1200, temporaria: false });
    expect(rendaFamiliarNaData([p], HOJE)).toBe(1200);
  });

  it("CPF: negativado → aguardando score → limpo", () => {
    const divida = (status: "aberto" | "pago", dataPagamento = "") => ({
      id: "d",
      credor: "Banco",
      valor: 500,
      status,
      dataPagamento,
    });
    expect(
      situacaoCpfNaData(pessoa({ cpf: { negativado: true, dividas: [divida("aberto")] } }), HOJE),
    ).toBe("negativado");
    expect(situacaoCpfNaData(pessoa({ cpf: { negativado: true, dividas: [] } }), HOJE)).toBe(
      "negativado",
    );
    const pagaRecente = pessoa({
      cpf: { negativado: true, dividas: [divida("pago", "2026-11-04")] },
    });
    expect(situacaoCpfNaData(pagaRecente, HOJE)).toBe("aguardando-score");
    const pagaHaTempo = pessoa({
      cpf: { negativado: true, dividas: [divida("pago", "2026-09-01")] },
    });
    expect(situacaoCpfNaData(pagaHaTempo, HOJE)).toBe("limpo");
  });
});

describe("cenários com os dados de exemplo da família", () => {
  const estado = dadosIniciais();
  const cenarios = gerarCenarios(estado, HOJE);

  it("gera cada pessoa sozinha, as duplas e todos juntos", () => {
    expect(cenarios).toHaveLength(3 + 3 + 1);
    expect(cenarios.map((c) => c.nome)).toContain("Todos juntos");
  });

  it("pai sozinho é inviável por causa do CPF; mãe sozinha por falta de renda", () => {
    const pai = cenarios.find((c) => c.id === ID_PAI)!;
    const mae = cenarios.find((c) => c.id === ID_MAE)!;
    expect(pai.resultado.impedimentos.map((i) => i.codigo)).toContain("cpf-negativado");
    expect(mae.resultado.impedimentos.map((i) => i.codigo)).toContain("sem-renda");
  });

  it("o melhor cenário hoje é a Danielle sozinha (prazo longo), com aviso de contrato temporário", () => {
    const melhor = melhorCenario(cenarios);
    expect(melhor?.id).toBe(ID_FILHA);
    expect(melhor?.resultado.prazoMeses).toBe(420);
    expect(melhor?.resultado.avisos.join(" ")).toMatch(/temporário/);
  });

  it("imóvel de R$ 140.000 com o perfil atual: não cabe e mostra quanto falta", () => {
    const melhor = melhorCenario(cenarios)!;
    const a = avaliarImovel(140000, melhor.resultado);
    expect(a.cor).toBe("vermelho");
    expect(a.faltaEntrada).toBeGreaterThan(40000);
    expect(a.rendaNecessaria).toBeGreaterThan(950);
  });

  it("depois do fim do contrato de aprendiz, nenhum cenário é aprovável", () => {
    const depois = gerarCenarios(estado, lerDataIso("2027-02-01")!);
    expect(melhorCenario(depois)).toBeNull();
  });

  it("se o pai limpar o nome, pai + Danielle passa a ser viável", () => {
    const potencial = gerarCenarios(estado, HOJE, { ignorarCpf: true });
    const paiFilha = potencial.find(
      (c) =>
        c.pessoasIds.length === 2 &&
        c.pessoasIds.includes(ID_PAI) &&
        c.pessoasIds.includes(ID_FILHA),
    )!;
    expect(paiFilha.resultado.viavel).toBe(true);
    expect(paiFilha.resultado.prazoMeses).toBeLessThan(420);
  });

  it("avisa sobre o fim do contrato da Danielle", () => {
    const mudancas = mudancasFuturas(estado, HOJE);
    expect(mudancas[0]).toMatchObject({ data: "2027-01-31", pessoaId: ID_FILHA });
  });
});
