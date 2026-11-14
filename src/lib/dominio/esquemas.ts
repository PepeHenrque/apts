/**
 * Esquemas Zod de TODOS os dados da família. Servem para:
 * - validar formulários;
 * - validar o que vem do armazenamento (localStorage/Supabase), preenchendo campos novos com padrão;
 * - gerar os tipos TypeScript (z.infer).
 *
 * Ao adicionar um campo novo, dê um `.default(...)` para que dados antigos continuem válidos.
 */
import { z } from "zod";

const mensagemDataInvalida = "Data inválida (use o seletor de data)";
export const esquemaDataIso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, mensagemDataInvalida);
/** Data opcional: "" significa "não informada". */
export const esquemaDataOpcional = z.union([esquemaDataIso, z.literal("")]).default("");

const dinheiro = (mensagem = "Informe um valor igual ou maior que zero") =>
  z.number({ error: "Informe um número" }).min(0, mensagem).default(0);
const inteiro = () => z.number().int().min(0).default(0);
const texto = () => z.string().trim().default("");
const id = () => z.string().min(1);

export const SITUACOES_EMPREGO = [
  "clt",
  "aposentado",
  "mei",
  "autonomo-informal",
  "jovem-aprendiz",
  "estagio",
  "desempregado",
] as const;

export const NOMES_SITUACAO: Record<(typeof SITUACOES_EMPREGO)[number], string> = {
  clt: "Carteira assinada (CLT)",
  aposentado: "Aposentado(a) / pensionista",
  mei: "MEI",
  "autonomo-informal": "Autônomo / informal (sem comprovação)",
  "jovem-aprendiz": "Jovem aprendiz",
  estagio: "Estágio",
  desempregado: "Sem trabalho no momento",
};

export const STATUS_DIVIDA = ["aberto", "negociando", "acordo", "pago"] as const;
export const NOMES_STATUS_DIVIDA: Record<(typeof STATUS_DIVIDA)[number], string> = {
  aberto: "Em aberto",
  negociando: "Negociando",
  acordo: "Acordo feito (pagando)",
  pago: "Pago",
};

export const esquemaDivida = z.object({
  id: id(),
  credor: z.string().trim().min(1, "Informe o credor (para quem deve)"),
  valor: dinheiro(),
  status: z.enum(STATUS_DIVIDA).default("aberto"),
  dataPagamento: esquemaDataOpcional,
});

export const esquemaCompromisso = z.object({
  id: id(),
  descricao: z.string().trim().min(1, "Descreva o compromisso"),
  valorMensal: dinheiro(),
});

export const esquemaPessoa = z.object({
  id: id(),
  nome: z.string().trim().min(1, "Informe o nome"),
  dataNascimento: esquemaDataIso,
  vaiMorar: z.boolean().default(true),
  podeSerComprador: z.boolean().default(true),
  emprego: z
    .object({
      situacao: z.enum(SITUACOES_EMPREGO).default("desempregado"),
      ocupacao: texto(),
      salarioBruto: dinheiro(),
      dataInicio: esquemaDataOpcional,
      dataFimPrevista: esquemaDataOpcional,
    })
    .default({
      situacao: "desempregado",
      ocupacao: "",
      salarioBruto: 0,
      dataInicio: "",
      dataFimPrevista: "",
    }),
  cpf: z
    .object({
      negativado: z.boolean().default(false),
      dividas: z.array(esquemaDivida).default([]),
    })
    .default({ negativado: false, dividas: [] }),
  fgts: z
    .object({ saldo: dinheiro(), tem3Anos: z.boolean().default(false) })
    .default({ saldo: 0, tem3Anos: false }),
  compromissos: z.array(esquemaCompromisso).default([]),
  temImovel: z.boolean().default(false),
});

export const CANAIS_RECUSA = [
  "agencia",
  "correspondente",
  "feirao",
  "construtora",
  "outro",
] as const;
export const NOMES_CANAL: Record<(typeof CANAIS_RECUSA)[number], string> = {
  agencia: "Agência do banco",
  correspondente: "Correspondente bancário",
  feirao: "Feirão de imóveis",
  construtora: "Construtora / imobiliária",
  outro: "Outro",
};

export const CAUSAS_RECUSA = [
  "cpf",
  "renda",
  "entrada",
  "idade",
  "imovel",
  "documentacao",
  "nao-informada",
  "outra",
] as const;
export const NOMES_CAUSA: Record<(typeof CAUSAS_RECUSA)[number], string> = {
  cpf: "Restrição no CPF (nome sujo)",
  renda: "Renda insuficiente",
  entrada: "Falta de entrada",
  idade: "Idade / prazo",
  imovel: "Imóvel não aceito",
  documentacao: "Documentação",
  "nao-informada": "Não informaram",
  outra: "Outra",
};

export const esquemaRecusa = z.object({
  id: id(),
  data: esquemaDataOpcional,
  banco: texto(),
  canal: z.enum(CANAIS_RECUSA).default("agencia"),
  imovelDescricao: texto(),
  imovelValor: dinheiro(),
  imovelLink: texto(),
  compradoresIds: z.array(z.string()).default([]),
  causa: z.enum(CAUSAS_RECUSA).default("nao-informada"),
  causaOutra: texto(),
  observacoes: texto(),
});

export const esquemaDinheiro = z.object({
  entrada: dinheiro(),
  guardaPorMes: dinheiro(),
  outrosRecursos: dinheiro(),
});

export const TIPOS_IMOVEL = [
  "qualquer",
  "apartamento",
  "casa",
  "casa-condominio",
  "sobrado",
  "terreno",
] as const;
export const NOMES_TIPO_IMOVEL: Record<(typeof TIPOS_IMOVEL)[number], string> = {
  qualquer: "Qualquer tipo",
  apartamento: "Apartamento",
  casa: "Casa",
  "casa-condominio": "Casa em condomínio",
  sobrado: "Sobrado",
  terreno: "Terreno",
};
export const CONDICOES_IMOVEL = ["tanto-faz", "novo", "usado", "na-planta"] as const;
export const NOMES_CONDICAO: Record<(typeof CONDICOES_IMOVEL)[number], string> = {
  "tanto-faz": "Tanto faz",
  novo: "Novo",
  usado: "Usado",
  "na-planta": "Na planta",
};
export const SIM_NAO_TALVEZ = ["sim", "nao", "talvez"] as const;
export const NOMES_SIM_NAO_TALVEZ: Record<(typeof SIM_NAO_TALVEZ)[number], string> = {
  sim: "Sim",
  nao: "Não",
  talvez: "Talvez",
};
export const ACESSO_ESCADA = ["tanto-faz", "so-terreo-ou-elevador", "aceita-escada"] as const;
export const NOMES_ACESSO: Record<(typeof ACESSO_ESCADA)[number], string> = {
  "tanto-faz": "Tanto faz",
  "so-terreo-ou-elevador": "Só térreo ou com elevador",
  "aceita-escada": "Aceita escada",
};

export const esquemaLocal = z.object({
  id: id(),
  nome: z.string().trim().min(1, "Informe o nome do lugar"),
  endereco: texto(),
  lat: z.number().nullable().default(null),
  lon: z.number().nullable().default(null),
});

export const esquemaPreferencias = z.object({
  tipo: z.enum(TIPOS_IMOVEL).default("qualquer"),
  condicao: z.enum(CONDICOES_IMOVEL).default("tanto-faz"),
  quartosMin: inteiro(),
  banheirosMin: inteiro(),
  vagasMin: inteiro(),
  areaMin: dinheiro(),
  acesso: z.enum(ACESSO_ESCADA).default("tanto-faz"),
  condominioMax: dinheiro(),
  casaAtual: esquemaLocal.default({
    id: "casa-atual",
    nome: "Casa atual",
    endereco: "",
    lat: null,
    lon: null,
  }),
  cidadeUf: texto(),
  locaisDesejados: z.array(esquemaLocal).default([]),
  distanciaMaxKm: dinheiro(),
  pontosImportantes: z.array(esquemaLocal).default([]),
  aceitaRepasse: z.enum(SIM_NAO_TALVEZ).default("talvez"),
  consideraEmprestimo: z.enum(SIM_NAO_TALVEZ).default("talvez"),
});

export const STATUS_IMOVEL = [
  "interessado",
  "visitado",
  "proposta",
  "descartado",
  "negado",
] as const;
export const NOMES_STATUS_IMOVEL: Record<(typeof STATUS_IMOVEL)[number], string> = {
  interessado: "Interessado",
  visitado: "Visitado",
  proposta: "Proposta feita",
  descartado: "Descartado",
  negado: "Negado pela Caixa",
};
export const SIM_NAO_NAO_SEI = ["sim", "nao", "nao-sei"] as const;
export const NOMES_SIM_NAO_NAO_SEI: Record<(typeof SIM_NAO_NAO_SEI)[number], string> = {
  sim: "Sim",
  nao: "Não",
  "nao-sei": "Não sei",
};

export const esquemaRepasseImovel = z.object({
  agio: dinheiro(),
  saldoDevedor: dinheiro(),
  parcela: dinheiro(),
  parcelasRestantes: inteiro(),
  banco: texto(),
});

export const esquemaImovel = z.object({
  id: id(),
  titulo: z.string().trim().min(1, "Dê um nome para o imóvel"),
  link: texto(),
  preco: z.number({ error: "Informe o preço" }).positive("Informe o preço"),
  tipo: z.enum(TIPOS_IMOVEL).default("qualquer"),
  quartos: inteiro(),
  banheiros: inteiro(),
  vagas: inteiro(),
  area: dinheiro(),
  endereco: texto(),
  bairro: texto(),
  cidade: texto(),
  lat: z.number().nullable().default(null),
  lon: z.number().nullable().default(null),
  condominio: dinheiro(),
  iptu: dinheiro(),
  aceitaFinanciamento: z.enum(SIM_NAO_NAO_SEI).default("nao-sei"),
  observacoes: texto(),
  fotos: z.array(z.string()).default([]),
  status: z.enum(STATUS_IMOVEL).default("interessado"),
  ehRepasse: z.boolean().default(false),
  repasse: esquemaRepasseImovel.default({
    agio: 0,
    saldoDevedor: 0,
    parcela: 0,
    parcelasRestantes: 0,
    banco: "",
  }),
  criadoPor: texto(),
  criadoEm: texto(),
});

export const esquemaItemChecklist = z.object({
  feito: z.boolean().default(false),
  nota: texto(),
});

export const esquemaRegistroHistorico = z.object({
  id: id(),
  quando: z.string(),
  quem: texto(),
  descricao: z.string(),
});

export const VERSAO_ESTADO = 1;

export const esquemaEstado = z.object({
  versao: z.number().default(VERSAO_ESTADO),
  ehExemplo: z.boolean().default(false),
  pessoas: z.array(esquemaPessoa).default([]),
  recusas: z.array(esquemaRecusa).default([]),
  dinheiro: esquemaDinheiro.default({ entrada: 0, guardaPorMes: 0, outrosRecursos: 0 }),
  preferencias: esquemaPreferencias.default(() => esquemaPreferencias.parse({})),
  imoveis: z.array(esquemaImovel).default([]),
  checklists: z.record(z.string(), esquemaItemChecklist).default({}),
  historico: z.array(esquemaRegistroHistorico).default([]),
});

export type Divida = z.infer<typeof esquemaDivida>;
export type Compromisso = z.infer<typeof esquemaCompromisso>;
export type Pessoa = z.infer<typeof esquemaPessoa>;
export type SituacaoEmpregoPessoa = Pessoa["emprego"]["situacao"];
export type Recusa = z.infer<typeof esquemaRecusa>;
export type Dinheiro = z.infer<typeof esquemaDinheiro>;
export type Preferencias = z.infer<typeof esquemaPreferencias>;
export type Local = z.infer<typeof esquemaLocal>;
export type Imovel = z.infer<typeof esquemaImovel>;
export type ItemChecklist = z.infer<typeof esquemaItemChecklist>;
export type RegistroHistorico = z.infer<typeof esquemaRegistroHistorico>;
export type EstadoFamilia = z.infer<typeof esquemaEstado>;

/** Lê dados de qualquer origem com segurança. Inválidos → null (quem chamou decide o que fazer). */
export function lerEstado(dados: unknown): EstadoFamilia | null {
  const resultado = esquemaEstado.safeParse(dados);
  return resultado.success ? resultado.data : null;
}

/** Estado vazio (sem nenhum dado). */
export function estadoVazio(): EstadoFamilia {
  return esquemaEstado.parse({});
}

/** Gera um id curto e único o bastante para uso local. */
export function novoId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** Rascunho de pessoa para o formulário (nome vazio: só é validado ao salvar). */
export function pessoaEmBranco(): Pessoa {
  return {
    ...esquemaPessoa.parse({ id: novoId(), nome: "rascunho", dataNascimento: "2000-01-01" }),
    nome: "",
  };
}
