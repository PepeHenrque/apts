/**
 * DADOS DE EXEMPLO — ponto de partida da família, carregado no primeiro uso.
 * Nada aqui é fixo: tudo pode ser editado ou apagado dentro do app ("Nossa situação").
 * Os valores são aproximados a partir da descrição inicial do projeto.
 */
import { esquemaEstado, type EstadoFamilia } from "@/lib/dominio/esquemas";

export const ID_PAI = "exemplo-pai";
export const ID_MAE = "exemplo-mae";
export const ID_FILHA = "exemplo-danielle";

export function dadosIniciais(): EstadoFamilia {
  return esquemaEstado.parse({
    ehExemplo: true,
    pessoas: [
      {
        id: ID_PAI,
        nome: "Pai",
        dataNascimento: "1965-06-15",
        vaiMorar: true,
        podeSerComprador: true,
        emprego: {
          situacao: "clt",
          ocupacao: "Ajuste a ocupação",
          salarioBruto: 1950,
          dataInicio: "",
          dataFimPrevista: "",
        },
        cpf: {
          negativado: true,
          dividas: [
            {
              id: "exemplo-divida-1",
              credor: "Ajuste o credor",
              valor: 0,
              status: "aberto",
              dataPagamento: "",
            },
          ],
        },
        fgts: { saldo: 0, tem3Anos: false },
        compromissos: [],
        temImovel: false,
      },
      {
        id: ID_MAE,
        nome: "Mãe",
        dataNascimento: "1965-03-10",
        vaiMorar: true,
        podeSerComprador: true,
        emprego: {
          situacao: "desempregado",
          ocupacao: "",
          salarioBruto: 0,
          dataInicio: "",
          dataFimPrevista: "",
        },
        cpf: { negativado: false, dividas: [] },
        fgts: { saldo: 0, tem3Anos: false },
        compromissos: [],
        temImovel: false,
      },
      {
        id: ID_FILHA,
        nome: "Danielle",
        dataNascimento: "2007-08-20",
        vaiMorar: true,
        podeSerComprador: true,
        emprego: {
          situacao: "jovem-aprendiz",
          ocupacao: "Jovem aprendiz",
          salarioBruto: 950,
          dataInicio: "2025-02-01",
          dataFimPrevista: "2027-01-31",
        },
        cpf: { negativado: false, dividas: [] },
        fgts: { saldo: 0, tem3Anos: false },
        compromissos: [],
        temImovel: false,
      },
    ],
    recusas: [
      {
        id: "exemplo-recusa-1",
        data: "",
        banco: "Caixa",
        canal: "correspondente",
        imovelDescricao: "Apartamento 2 quartos (exemplo — ajuste com os dados reais)",
        imovelValor: 140000,
        compradoresIds: [ID_PAI],
        causa: "cpf",
        observacoes: "Já foram cerca de 5 recusas por falta de crédito. Cadastre cada uma aqui.",
      },
    ],
    dinheiro: { entrada: 0, guardaPorMes: 0, outrosRecursos: 0 },
    preferencias: {
      tipo: "apartamento",
      quartosMin: 2,
      acesso: "so-terreo-ou-elevador",
      distanciaMaxKm: 15,
      aceitaRepasse: "talvez",
      consideraEmprestimo: "talvez",
    },
  });
}
