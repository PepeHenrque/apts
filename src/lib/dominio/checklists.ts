/**
 * Conteúdo dos checklists e guias (F8). O que está marcado fica salvo em `estado.checklists`
 * com a chave `${prefixo}:${id}`. Textos em linguagem simples; confirme sempre com a Caixa.
 */
import type { Pessoa, SituacaoEmpregoPessoa } from "@/lib/dominio/esquemas";

export interface ItemVerificacao {
  id: string;
  texto: string;
  ajuda?: string;
}

export interface SecaoChecklist {
  prefixo: string;
  titulo: string;
  descricao: string;
  itens: ItemVerificacao[];
  comNotas?: boolean;
}

export const CHECKLIST_REPASSE: ItemVerificacao[] = [
  {
    id: "transferencia-formal",
    texto: "A transferência será feita no banco (com aprovação do banco), não só “de gaveta”",
  },
  {
    id: "extrato",
    texto:
      "Pedi ao vendedor o extrato atualizado do financiamento (saldo devedor e parcelas em dia)",
  },
  {
    id: "matricula",
    texto: "Conferi a matrícula atualizada do imóvel no cartório (dono, dívidas, penhoras)",
  },
  { id: "credito", texto: "Simulei minha aprovação de crédito antes de pagar qualquer ágio" },
  { id: "condominio-iptu", texto: "Conferi que condomínio e IPTU estão quitados" },
  { id: "contrato", texto: "O ágio só será pago com contrato assinado e transferência aprovada" },
  { id: "advogado", texto: "Um advogado ou a Defensoria Pública revisou o contrato" },
];

const DOCUMENTOS_GERAIS: ItemVerificacao[] = [
  { id: "rg-cpf", texto: "RG e CPF (ou CNH) de cada comprador" },
  {
    id: "estado-civil",
    texto: "Certidão de nascimento ou de casamento (com averbação, se for divorciado/viúvo)",
  },
  { id: "residencia", texto: "Comprovante de residência recente (conta de luz, água ou telefone)" },
  { id: "ir", texto: "Declaração do Imposto de Renda com recibo (quem declara)" },
  { id: "ctps", texto: "Carteira de trabalho (pode ser a digital, no app)" },
  { id: "fgts", texto: "Extrato do FGTS (se for usar o FGTS)", ajuda: "No app FGTS da Caixa." },
  { id: "cadunico", texto: "Número do NIS/CadÚnico (se tiver)" },
];

const DOCUMENTOS_POR_RENDA: Partial<Record<SituacaoEmpregoPessoa, ItemVerificacao[]>> = {
  clt: [{ id: "holerites", texto: "Últimos 3 holerites (contracheques)" }],
  "jovem-aprendiz": [
    { id: "holerites", texto: "Últimos 3 holerites (contracheques)" },
    { id: "contrato-aprendiz", texto: "Contrato de aprendizagem (o banco pode pedir)" },
  ],
  aposentado: [
    { id: "extrato-inss", texto: "Extrato de pagamento do benefício (Meu INSS) dos últimos meses" },
  ],
  mei: [
    { id: "ccmei", texto: "Certificado do MEI (CCMEI)" },
    { id: "dasn", texto: "Declaração anual do MEI (DASN-SIMEI) dos últimos anos" },
    { id: "extratos", texto: "Extratos bancários dos últimos 6 meses" },
  ],
  "autonomo-informal": [
    {
      id: "extratos",
      texto: "Extratos bancários dos últimos 6 meses",
      ajuda:
        "Renda informal raramente é aceita. Um contador pode emitir uma DECORE, ou vale abrir um MEI.",
    },
  ],
};

/** Documentos para a Caixa conforme o trabalho de cada possível comprador. */
export function secoesDocumentos(pessoas: Pessoa[]): SecaoChecklist[] {
  const secoes: SecaoChecklist[] = [
    {
      prefixo: "docs-gerais",
      titulo: "Documentos de todos os compradores",
      descricao: "Separe uma pasta para cada pessoa.",
      itens: DOCUMENTOS_GERAIS,
    },
  ];
  for (const p of pessoas.filter((x) => x.podeSerComprador)) {
    const itens = DOCUMENTOS_POR_RENDA[p.emprego.situacao];
    if (itens) {
      secoes.push({
        prefixo: `docs-${p.id}`,
        titulo: `Comprovantes de renda — ${p.nome}`,
        descricao: "Comprovam a renda que o banco vai considerar.",
        itens,
      });
    }
  }
  return secoes;
}

export const CHECKLIST_IMOVEL: SecaoChecklist = {
  prefixo: "conferir-imovel",
  titulo: "Antes de fechar negócio: confira o imóvel",
  descricao: "Nunca pague sinal antes de conferir estes itens.",
  itens: [
    {
      id: "matricula",
      texto: "Matrícula atualizada (até 30 dias) tirada no cartório de imóveis",
      ajuda: "Mostra quem é o dono e se há dívidas, penhoras ou processos.",
    },
    { id: "dono", texto: "Quem está vendendo é o dono que aparece na matrícula" },
    { id: "onus", texto: "Matrícula sem penhora, hipoteca ou ação judicial" },
    {
      id: "financiamento",
      texto: "O imóvel aceita financiamento (pergunte e confirme com o correspondente)",
    },
    {
      id: "regular",
      texto: "Construção regularizada (habite-se e construção averbada na matrícula)",
    },
    {
      id: "condominio",
      texto: "Declaração de que não há dívidas de condomínio (assinada pelo síndico)",
    },
    { id: "iptu", texto: "Certidão de IPTU quitado (prefeitura)" },
    { id: "certidoes", texto: "Certidões negativas do vendedor (justiça, protestos)" },
    {
      id: "vistoria",
      texto: "Visitei de dia e conferi infiltrações, rachaduras, parte elétrica e hidráulica",
    },
    {
      id: "avaliacao",
      texto: "Sei que o banco faz uma avaliação e pode financiar sobre um valor menor que o preço",
    },
    {
      id: "custos",
      texto: "Separei dinheiro para ITBI e cartório (peça o valor à prefeitura e ao cartório)",
    },
  ],
};

export const CHECKLIST_LIMPAR_NOME: SecaoChecklist = {
  prefixo: "limpar-nome",
  titulo: "Passo a passo para limpar o nome",
  descricao: "Faça para cada pessoa com o nome sujo.",
  itens: [
    {
      id: "consultar",
      texto: "Consultar dívidas no Serasa, SPC e Boa Vista (grátis nos sites e apps)",
    },
    { id: "registrato", texto: "Consultar o Registrato do Banco Central (dívidas com bancos)" },
    { id: "cadastrar", texto: "Cadastrar cada dívida aqui no app (Situação → pessoa → Nome)" },
    {
      id: "prescricao",
      texto: "Ver a data de cada dívida: após 5 anos ela sai do cadastro de negativados",
      ajuda: "Não negocie sem saber disso — mas o banco credor ainda pode ter o registro interno.",
    },
    {
      id: "negociar",
      texto: "Negociar com desconto (Serasa Limpa Nome, feirões, direto com o credor)",
    },
    { id: "pagar", texto: "Pagar e guardar o comprovante" },
    { id: "baixa", texto: "Conferir se o nome saiu da lista em até 5 dias úteis" },
    { id: "cadastro-positivo", texto: "Ativar o Cadastro Positivo e manter as contas em dia" },
    { id: "score", texto: "Acompanhar o score antes de pedir o financiamento de novo" },
  ],
};

export const CHECKLIST_FAIXA1: SecaoChecklist = {
  prefixo: "faixa1",
  titulo: "Caminho da Faixa 1 pela prefeitura",
  descricao:
    "Algumas moradias da Faixa 1 são entregues por sorteio/cadastro da prefeitura ou do estado, com parcelas bem baixas. Anote o que já fizeram.",
  comNotas: true,
  itens: [
    {
      id: "cadunico",
      texto: "Inscrever (ou atualizar) a família no CadÚnico no CRAS",
      ajuda:
        "Leve documentos de todos e comprovante de residência. Atualize a cada 2 anos ou quando algo mudar.",
    },
    {
      id: "habitacao-municipal",
      texto: "Fazer inscrição na Secretaria/Companhia de Habitação da prefeitura",
    },
    { id: "habitacao-estadual", texto: "Fazer inscrição na companhia de habitação do estado" },
    {
      id: "idosos",
      texto: "Perguntar sobre a reserva para pessoas idosas",
      ajuda:
        "O Estatuto da Pessoa Idosa (Lei 10.741/2003, art. 38) garante reserva de pelo menos 3% das unidades dos programas habitacionais públicos.",
    },
    {
      id: "entidades",
      texto: "Procurar movimentos/entidades de moradia que inscrevem famílias no MCMV-Entidades",
    },
    { id: "protocolos", texto: "Guardar todos os números de protocolo" },
    { id: "editais", texto: "Acompanhar editais e sorteios (site da prefeitura, Diário Oficial)" },
  ],
};
