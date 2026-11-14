import { describe, expect, it } from "vitest";
import { lerDataIso } from "@/lib/datas";
import { dadosIniciais, ID_FILHA, ID_PAI } from "./dados-iniciais";
import { gerarDiagnostico, precoDeReferencia, resumirRecusas } from "./diagnostico";
import { esquemaImovel, esquemaRecusa, type EstadoFamilia } from "./esquemas";

const HOJE = lerDataIso("2026-11-14")!;

function recusa(causa: "cpf" | "renda", id: string) {
  return esquemaRecusa.parse({ id, causa, imovelValor: 140000, data: "2026-01-0" + id });
}

describe("resumo das recusas", () => {
  it("conta as causas e monta a frase", () => {
    const r = resumirRecusas([
      recusa("cpf", "1"),
      recusa("cpf", "2"),
      recusa("renda", "3"),
      recusa("cpf", "4"),
      recusa("cpf", "5"),
    ]);
    expect(r.total).toBe(5);
    expect(r.porCausa[0]).toMatchObject({ causa: "cpf", quantidade: 4 });
    expect(r.frase).toBe("4 das 5 recusas foram por: Restrição no CPF (nome sujo).");
  });

  it("sem recusas", () => {
    expect(resumirRecusas([]).frase).toBe("Nenhuma recusa cadastrada.");
  });
});

describe("diagnóstico com os dados de exemplo", () => {
  const d = gerarDiagnostico(dadosIniciais(), HOJE);

  it("o bloqueio mais grave é o nome sujo do pai, com links", () => {
    expect(d.bloqueios[0]?.id).toBe("cpf");
    expect(d.bloqueios[0]?.titulo).toContain("Pai");
    expect(d.bloqueios[0]?.links.length).toBeGreaterThan(0);
  });

  it("avisa que o contrato da Danielle termina e que a idade limita o prazo", () => {
    const ids = d.bloqueios.map((b) => b.id);
    expect(ids).toContain(`fim-contrato-${ID_FILHA}`);
    expect(ids).toContain("idade");
  });

  it("mostra que falta entrada para o imóvel de R$ 140 mil", () => {
    expect(d.precoAlvo).toBe(140000);
    expect(d.bloqueios.map((b) => b.id)).toContain("entrada");
  });

  it("semáforo 'quase': dá para pedir com a Danielle, mas há alertas", () => {
    expect(d.melhor?.id).toBe(ID_FILHA);
    expect(d.semaforo).toBe("quase");
    expect(d.resumo).toContain("Danielle");
  });
});

describe("semáforo", () => {
  function semRendaDaFilha(): EstadoFamilia {
    const e = dadosIniciais();
    e.pessoas = e.pessoas.map((p) =>
      p.id === ID_FILHA
        ? { ...p, emprego: { ...p.emprego, situacao: "desempregado" as const } }
        : p,
    );
    return e;
  }

  it("'ainda não' quando nenhum cenário é aprovável", () => {
    const d = gerarDiagnostico(semRendaDaFilha(), HOJE);
    expect(d.semaforo).toBe("ainda-nao");
    expect(d.potencial).not.toBeNull();
    expect(d.resumo).toContain("Resolvendo o nome");
  });

  it("'quase' quando só falta o score atualizar", () => {
    const e = semRendaDaFilha();
    e.pessoas = e.pessoas.map((p) =>
      p.id === ID_PAI
        ? {
            ...p,
            cpf: {
              negativado: true,
              dividas: [
                {
                  id: "d",
                  credor: "Banco",
                  valor: 1,
                  status: "pago" as const,
                  dataPagamento: "2026-11-10",
                },
              ],
            },
          }
        : p,
    );
    expect(gerarDiagnostico(e, HOJE).semaforo).toBe("quase");
  });

  it("'pronto' quando há cenário viável sem alertas importantes", () => {
    const e = dadosIniciais();
    e.recusas = [];
    e.pessoas = e.pessoas
      .filter((p) => p.id === ID_FILHA)
      .map((p) => ({
        ...p,
        emprego: { ...p.emprego, situacao: "clt" as const, dataFimPrevista: "" },
      }));
    const d = gerarDiagnostico(e, HOJE);
    expect(d.semaforo).toBe("pronto");
  });
});

describe("preço de referência", () => {
  it("usa a mediana dos imóveis salvos não descartados", () => {
    const e = dadosIniciais();
    e.imoveis = [100000, 150000, 200000, 999999].map((preco, i) =>
      esquemaImovel.parse({
        id: String(i),
        titulo: "x",
        preco,
        status: i === 3 ? "descartado" : "interessado",
      }),
    );
    expect(precoDeReferencia(e)).toBe(150000);
  });
});
