/**
 * Diagnóstico "Por que estão negando?": junta perfil atual, cenários e histórico de recusas
 * numa lista de bloqueios (do mais grave ao mais leve), cada um com explicação e o que fazer.
 */
import { REGRAS, type Regras } from "@/config/regras-mcmv";
import { diasEntre, lerDataIso } from "@/lib/datas";
import {
  gerarCenarios,
  melhorCenario,
  mudancasFuturas,
  situacaoCpfNaData,
  type Cenario,
  type MudancaFutura,
} from "@/lib/dominio/cenarios";
import { NOMES_CAUSA, type EstadoFamilia, type Recusa } from "@/lib/dominio/esquemas";
import { idadeEmAnos, mesesParaJuntar } from "@/lib/financiamento/basico";
import { avaliarImovel } from "@/lib/financiamento/orcamento";
import { formatarData, formatarMoedaInteira, formatarPrazo } from "@/lib/formatar";

export type Semaforo = "pronto" | "quase" | "ainda-nao";
/** 3 = impede a aprovação; 2 = atrapalha/precisa atenção; 1 = informação útil. */
export type Gravidade = 1 | 2 | 3;

export interface Link {
  texto: string;
  url: string;
}

export interface Bloqueio {
  id: string;
  gravidade: Gravidade;
  titulo: string;
  explicacao: string;
  oQueFazer: string[];
  links: Link[];
}

export interface ResumoRecusas {
  total: number;
  porCausa: { causa: Recusa["causa"]; nome: string; quantidade: number }[];
  /** Ex.: "4 das 5 recusas foram por Restrição no CPF (nome sujo)." */
  frase: string;
}

export interface Diagnostico {
  semaforo: Semaforo;
  tituloSemaforo: string;
  resumo: string;
  bloqueios: Bloqueio[];
  recusas: ResumoRecusas;
  cenarios: Cenario[];
  melhor: Cenario | null;
  /** Melhor cenário se os nomes forem limpos (ignora CPF). */
  potencial: Cenario | null;
  mudancas: MudancaFutura[];
  /** Preço de referência dos imóveis procurados (para medir a entrada). */
  precoAlvo: number | null;
}

export const LINKS_LIMPAR_NOME: Link[] = [
  {
    texto: "Serasa Limpa Nome (consultar e negociar dívidas)",
    url: "https://www.serasa.com.br/limpa-nome-online/",
  },
  {
    texto: "Registrato do Banco Central (ver dívidas em bancos, grátis)",
    url: "https://www.bcb.gov.br/cidadaniafinanceira/registrato",
  },
  {
    texto: "Consumidor.gov.br (reclamar de cobrança indevida)",
    url: "https://www.consumidor.gov.br/",
  },
];

export function resumirRecusas(recusas: Recusa[]): ResumoRecusas {
  const contagem = new Map<Recusa["causa"], number>();
  for (const r of recusas) contagem.set(r.causa, (contagem.get(r.causa) ?? 0) + 1);
  const porCausa = [...contagem.entries()]
    .map(([causa, quantidade]) => ({ causa, nome: NOMES_CAUSA[causa], quantidade }))
    .sort((a, b) => b.quantidade - a.quantidade);
  const total = recusas.length;
  const principal = porCausa[0];
  let frase = "Nenhuma recusa cadastrada.";
  if (principal && total > 0) {
    frase =
      total === 1
        ? `1 recusa cadastrada: ${principal.nome}.`
        : `${principal.quantidade} das ${total} recusas foram por: ${principal.nome}.`;
  }
  return { total, porCausa, frase };
}

/**
 * Preço de referência do que a família procura: mediana dos imóveis salvos (não descartados);
 * se não houver, o valor da recusa mais recente.
 */
export function precoDeReferencia(estado: EstadoFamilia): number | null {
  const precos = estado.imoveis
    .filter((i) => i.status !== "descartado" && i.preco > 0)
    .map((i) => i.preco)
    .sort((a, b) => a - b);
  if (precos.length > 0) {
    const meio = Math.floor(precos.length / 2);
    return precos.length % 2
      ? (precos[meio] ?? null)
      : ((precos[meio - 1] ?? 0) + (precos[meio] ?? 0)) / 2;
  }
  const comValor = [...estado.recusas]
    .filter((r) => r.imovelValor > 0)
    .sort((a, b) => b.data.localeCompare(a.data));
  return comValor[0]?.imovelValor ?? null;
}

export function gerarDiagnostico(
  estado: EstadoFamilia,
  data: Date,
  opcoes: { regras?: Regras; compromissosExtras?: number } = {},
): Diagnostico {
  const regras = opcoes.regras ?? REGRAS;
  const cenarios = gerarCenarios(estado, data, {
    regras,
    compromissosExtras: opcoes.compromissosExtras,
  });
  const melhor = melhorCenario(cenarios);
  const potencial = melhorCenario(
    gerarCenarios(estado, data, {
      regras,
      ignorarCpf: true,
      compromissosExtras: opcoes.compromissosExtras,
    }),
  );
  const mudancas = mudancasFuturas(estado, data, regras);
  const recusas = resumirRecusas(estado.recusas);
  const precoAlvo = precoDeReferencia(estado);
  const compradores = estado.pessoas.filter((p) => p.podeSerComprador);
  const bloqueios: Bloqueio[] = [];

  // 1. Nome sujo
  const negativados = compradores.filter(
    (p) => situacaoCpfNaData(p, data, regras) === "negativado",
  );
  if (negativados.length > 0) {
    const nomes = negativados.map((p) => p.nome).join(", ");
    const cpfNasRecusas = recusas.porCausa.find((c) => c.causa === "cpf");
    bloqueios.push({
      id: "cpf",
      gravidade: 3,
      titulo: `Nome sujo (CPF negativado): ${nomes}`,
      explicacao:
        "O banco consulta o CPF de todos os compradores no SPC/Serasa. Com o nome negativado, o crédito é negado automaticamente, mesmo com renda suficiente." +
        (cpfNasRecusas && recusas.total > 0
          ? ` No histórico, ${cpfNasRecusas.quantidade} de ${recusas.total} recusas foram por isso.`
          : ""),
      oQueFazer: [
        "Consulte todas as dívidas no Serasa e no Registrato (grátis) — às vezes há dívidas esquecidas.",
        "Negocie: muitas vezes há grandes descontos para pagar à vista ou parcelado. Verifique se há algum programa de renegociação do governo aberto (como foi o Desenrola).",
        "Cadastre cada dívida aqui no app e marque como paga quando quitar, com a data do pagamento.",
        "Depois de pagar, o nome sai da lista em até 5 dias úteis, mas o score (pontuação) sobe aos poucos — pode levar semanas ou meses. Guarde os comprovantes.",
      ],
      links: LINKS_LIMPAR_NOME,
    });
  }

  // 2. Aguardando score
  const aguardando = compradores.filter(
    (p) => situacaoCpfNaData(p, data, regras) === "aguardando-score",
  );
  if (aguardando.length > 0) {
    bloqueios.push({
      id: "score",
      gravidade: 2,
      titulo: `Aguardando o score atualizar: ${aguardando.map((p) => p.nome).join(", ")}`,
      explicacao:
        "As dívidas foram pagas, mas o score ainda pode estar baixo. Pedir crédito agora pode gerar outra recusa (e cada consulta conta).",
      oQueFazer: [
        `Espere cerca de ${regras.diasAguardarScore} dias depois do último pagamento antes de pedir de novo.`,
        "Consulte o score grátis no app da Serasa ou do SPC antes de ir ao banco.",
        "Mantenha as contas em dia e ative o Cadastro Positivo — ajuda o score a subir.",
      ],
      links: LINKS_LIMPAR_NOME.slice(0, 1),
    });
  }

  // 3. Sem renda comprovada
  const algumComRenda = cenarios.some((c) => c.resultado.rendaComprovada > 0);
  if (!algumComRenda) {
    bloqueios.push({
      id: "renda",
      gravidade: 3,
      titulo: "Ninguém tem renda comprovada",
      explicacao:
        "O banco só considera renda que dá para comprovar (carteira assinada, aposentadoria, MEI com declaração). Sem isso não há financiamento.",
      oQueFazer: [
        "Carteira assinada (CLT) é a forma mais aceita.",
        "Quem trabalha por conta pode abrir um MEI e declarar a renda todo ano.",
        "Quem tem direito à aposentadoria ou pensão pode pedir pelo Meu INSS.",
        "Outra pessoa da família com renda pode entrar como compradora (composição de renda).",
      ],
      links: [
        {
          texto: "Abrir MEI (gov.br)",
          url: "https://www.gov.br/empresas-e-negocios/pt-br/empreendedor",
        },
        { texto: "Meu INSS", url: "https://meu.inss.gov.br/" },
      ],
    });
  }

  // 4. Renda que vai acabar (contrato temporário)
  for (const m of mudancas.filter((x) => x.descricao.startsWith("Termina"))) {
    const fim = lerDataIso(m.data);
    if (fim && diasEntre(data, fim) <= 180) {
      bloqueios.push({
        id: `fim-contrato-${m.pessoaId}`,
        gravidade: 2,
        titulo: `Renda com data para acabar (${formatarData(m.data)})`,
        explicacao: `${m.descricao} Os cenários que dependem dessa renda deixam de funcionar depois dessa data. Contratos temporários (como jovem aprendiz) também podem não ser aceitos pelo banco.`,
        oQueFazer: [
          "Se possível, peça a análise de crédito antes da data de fim do contrato.",
          "Procure efetivação ou outro emprego com carteira assinada.",
          "Veja no Simulador como fica a situação depois dessa data (campo 'Simular na data').",
        ],
        links: [],
      });
    }
  }

  // 5. Idade (o mais velho define o prazo)
  const maisVelho = compradores.reduce<{ nome: string; anos: number } | null>((acc, p) => {
    const anos = idadeEmAnos(p.dataNascimento, data);
    return !acc || anos > acc.anos ? { nome: p.nome, anos } : acc;
  }, null);
  if (maisVelho && maisVelho.anos >= 50) {
    const prazo = Math.max(
      0,
      Math.min(regras.prazoMaximoMeses, regras.idadeMaximaFinalMeses - maisVelho.anos * 12),
    );
    bloqueios.push({
      id: "idade",
      gravidade: 1,
      titulo: "Idade: o comprador mais velho define o prazo",
      explicacao: `A idade do comprador mais velho somada ao prazo não pode passar de 80 anos e 6 meses. Com ${maisVelho.nome} (${maisVelho.anos} anos) no contrato, o prazo máximo fica em cerca de ${formatarPrazo(prazo)} — prazo menor significa parcela maior e menos valor financiado. O seguro obrigatório (MIP) também fica mais caro com a idade.`,
      oQueFazer: [
        "Compare no Simulador os cenários com e sem a pessoa mais velha no contrato.",
        "Alguém mais novo como único comprador consegue prazo de até 35 anos.",
        "A pessoa mais velha pode morar no imóvel mesmo sem estar no contrato.",
      ],
      links: [],
    });
  }

  // 6. Entrada insuficiente para o que procuram
  const referencia = melhor ?? potencial;
  if (referencia && precoAlvo) {
    const avaliacao = avaliarImovel(precoAlvo, referencia.resultado);
    if (avaliacao.faltaEntrada > 0 || avaliacao.rendaNecessaria > 0) {
      const meses = mesesParaJuntar(avaliacao.faltaEntrada, estado.dinheiro.guardaPorMes);
      const prazoJuntar =
        avaliacao.faltaEntrada <= 0
          ? ""
          : meses === null
            ? " Hoje a família não tem valor mensal guardado cadastrado."
            : ` Guardando ${formatarMoedaInteira(estado.dinheiro.guardaPorMes)} por mês, levaria cerca de ${formatarPrazo(meses)}.`;
      bloqueios.push({
        id: "entrada",
        gravidade: 2,
        titulo: "Falta dinheiro para os imóveis que vocês procuram",
        explicacao: `Para um imóvel de ${formatarMoedaInteira(precoAlvo)}, no melhor cenário ${melhor ? "de hoje" : "(depois de limpar o nome)"}, faltariam cerca de ${formatarMoedaInteira(avaliacao.faltaEntrada)} de entrada.${prazoJuntar}${avaliacao.rendaNecessaria > 0 ? ` Para a parcela caber, a renda comprovada precisaria ser de uns ${formatarMoedaInteira(avaliacao.rendaNecessaria)}.` : ""}`,
        oQueFazer: [
          "Procure imóveis até o preço máximo mostrado no Simulador.",
          "Use o FGTS (se tiver 3 anos de trabalho com FGTS) na entrada.",
          "Imóveis novos do MCMV costumam ter o subsídio maior; pergunte à construtora.",
          "Veja as telas Empréstimo e Repasse para comparar alternativas (com cuidado).",
        ],
        links: [],
      });
    }
  }

  // 7. Compromissos mensais altos
  const totalCompromissos = compradores.reduce(
    (s, p) => s + p.compromissos.reduce((t, c) => t + c.valorMensal, 0),
    0,
  );
  if (totalCompromissos > 0) {
    bloqueios.push({
      id: "compromissos",
      gravidade: 1,
      titulo: `Outras parcelas mensais: ${formatarMoedaInteira(totalCompromissos)}`,
      explicacao:
        "Empréstimos, cartão e consignado já pagos todo mês são descontados da parcela que o banco aceita (30% da renda).",
      oQueFazer: ["Quitar ou reduzir essas parcelas aumenta o valor que dá para financiar."],
      links: [],
    });
  }

  bloqueios.sort((a, b) => b.gravidade - a.gravidade);

  // Semáforo geral
  let semaforo: Semaforo;
  if (melhor) {
    semaforo = bloqueios.some((b) => b.gravidade >= 2) ? "quase" : "pronto";
  } else {
    const soEsperandoScore = cenarios.some(
      (c) =>
        c.resultado.impedimentos.length > 0 &&
        c.resultado.impedimentos.every((i) => i.codigo === "aguardando-score"),
    );
    semaforo = soEsperandoScore ? "quase" : "ainda-nao";
  }

  const tituloSemaforo = {
    pronto: "Pronto para pedir crédito",
    quase: "Quase lá",
    "ainda-nao": "Ainda não",
  }[semaforo];

  let resumo: string;
  if (melhor) {
    resumo = `Hoje dá para pedir com "${melhor.nome}": imóvel de até ${formatarMoedaInteira(melhor.resultado.precoMaximo.SAC)}.`;
  } else if (potencial) {
    resumo = `Hoje nenhum cenário é aprovável. Resolvendo o nome, "${potencial.nome}" chegaria a imóveis de até ${formatarMoedaInteira(potencial.resultado.precoMaximo.SAC)}.`;
  } else {
    resumo = "Hoje nenhum cenário é aprovável. Veja abaixo o que precisa mudar.";
  }

  return {
    semaforo,
    tituloSemaforo,
    resumo,
    bloqueios,
    recusas,
    cenarios,
    melhor,
    potencial,
    mudancas,
    precoAlvo,
  };
}
