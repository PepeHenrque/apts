import { describe, expect, it } from "vitest";
import { lerDataIso } from "@/lib/datas";
import { dadosIniciais } from "@/lib/dominio/dados-iniciais";
import { gerarDiagnostico } from "@/lib/dominio/diagnostico";
import { anonimizarSituacao, esquemaSituacaoAnonima, promptExplicar } from "./anonimizar";
import { lerDadosAnuncioIA, promptAnuncio } from "./anuncio";
import { limparTextoParaIA, textoDaResposta } from "./gemini";
import { criarLimitador } from "./limitador";

const HOJE = lerDataIso("2026-11-14")!;

describe("leitura da resposta da IA", () => {
  it("aceita JSON válido, arredonda quartos e descarta nulos", () => {
    const dados = lerDadosAnuncioIA(
      JSON.stringify({
        titulo: "Apto 2 quartos",
        preco: 139900,
        quartos: 2.0,
        area: null,
        tipo: "apartamento",
      }),
    );
    expect(dados).toEqual({
      titulo: "Apto 2 quartos",
      preco: 139900,
      quartos: 2,
      tipo: "apartamento",
    });
  });

  it("ignora campos com tipo errado em vez de quebrar", () => {
    const dados = lerDadosAnuncioIA(
      JSON.stringify({ preco: "barato", tipo: "castelo", quartos: -1, cidade: "Campinas" }),
    );
    expect(dados).toEqual({ cidade: "Campinas" });
  });

  it("aceita JSON dentro de bloco de código e rejeita texto solto", () => {
    expect(lerDadosAnuncioIA('```json\n{"preco": 100000}\n```')).toEqual({ preco: 100000 });
    expect(lerDadosAnuncioIA("não sei")).toBeNull();
  });

  it("extrai o texto do formato do generateContent", () => {
    expect(textoDaResposta({ candidates: [{ content: { parts: [{ text: "oi" }] } }] })).toBe("oi");
    expect(textoDaResposta({})).toBe("");
  });
});

describe("privacidade", () => {
  it("remove CPF e e-mail do texto antes de enviar", () => {
    const limpo = limparTextoParaIA(
      "Falar com João, CPF 123.456.789-09, joao@email.com, R$ 150.000",
    );
    expect(limpo).not.toContain("123.456.789-09");
    expect(limpo).not.toContain("joao@email.com");
    expect(limpo).toContain("R$ 150.000");
    expect(promptAnuncio("texto")).toContain('"""\ntexto\n"""');
  });

  it("situação anonimizada não contém nomes nem credores", () => {
    const estado = dadosIniciais();
    estado.pessoas[0]!.cpf.dividas[0]!.credor = "Banco Secreto";
    const situacao = anonimizarSituacao(estado, gerarDiagnostico(estado, HOJE), HOJE);
    const texto = JSON.stringify(situacao) + promptExplicar(situacao);
    for (const proibido of ["Pai", "Mãe", "Danielle", "danielle", "Banco Secreto"]) {
      expect(texto).not.toContain(proibido);
    }
    expect(situacao.pessoas.map((p) => p.rotulo)).toEqual(["Pessoa 1", "Pessoa 2", "Pessoa 3"]);
    expect(situacao.bloqueios).toContain("fim-contrato");
    expect(esquemaSituacaoAnonima.safeParse(situacao).success).toBe(true);
  });

  it("o servidor rejeita situação com nome no rótulo", () => {
    const estado = dadosIniciais();
    const situacao = anonimizarSituacao(estado, gerarDiagnostico(estado, HOJE), HOJE);
    situacao.pessoas[0]!.rotulo = "Danielle";
    expect(esquemaSituacaoAnonima.safeParse(situacao).success).toBe(false);
  });
});

describe("limite de uso", () => {
  it("bloqueia depois do máximo e libera quando a janela passa", () => {
    const limite = criarLimitador(2, 1000);
    expect(limite.permitir("ip", 0)).toBe(true);
    expect(limite.permitir("ip", 10)).toBe(true);
    expect(limite.permitir("ip", 20)).toBe(false);
    expect(limite.permitir("outro-ip", 20)).toBe(true);
    expect(limite.permitir("ip", 1500)).toBe(true);
  });
});
