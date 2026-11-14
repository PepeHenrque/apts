/** Frases curtas para o histórico de alterações ("Mudou o salário de Mãe: R$ 0 → R$ 1.200"). */
import { NOMES_SITUACAO, type Pessoa } from "@/lib/dominio/esquemas";
import { formatarData, formatarMoedaInteira } from "@/lib/formatar";

export function descreverMudancasPessoa(antes: Pessoa | null, depois: Pessoa): string {
  if (!antes) return `Adicionou ${depois.nome}`;
  const n = depois.nome;
  const mudancas: string[] = [];
  if (antes.nome !== depois.nome) mudancas.push(`nome de ${antes.nome} para ${depois.nome}`);
  if (antes.dataNascimento !== depois.dataNascimento) {
    mudancas.push(`data de nascimento de ${n} para ${formatarData(depois.dataNascimento)}`);
  }
  if (antes.emprego.situacao !== depois.emprego.situacao) {
    mudancas.push(`trabalho de ${n} para "${NOMES_SITUACAO[depois.emprego.situacao]}"`);
  }
  if (antes.emprego.salarioBruto !== depois.emprego.salarioBruto) {
    mudancas.push(
      `salário de ${n}: ${formatarMoedaInteira(antes.emprego.salarioBruto)} → ${formatarMoedaInteira(depois.emprego.salarioBruto)}`,
    );
  }
  if (antes.emprego.dataFimPrevista !== depois.emprego.dataFimPrevista) {
    mudancas.push(
      depois.emprego.dataFimPrevista
        ? `fim do contrato de ${n} para ${formatarData(depois.emprego.dataFimPrevista)}`
        : `tirou a data de fim do contrato de ${n}`,
    );
  }
  if (antes.cpf.negativado !== depois.cpf.negativado) {
    mudancas.push(
      depois.cpf.negativado
        ? `marcou o CPF de ${n} como negativado`
        : `marcou o CPF de ${n} como limpo`,
    );
  }
  const pagasAntes = antes.cpf.dividas.filter((d) => d.status === "pago").length;
  const pagasDepois = depois.cpf.dividas.filter((d) => d.status === "pago").length;
  if (pagasDepois > pagasAntes)
    mudancas.push(`marcou ${pagasDepois - pagasAntes} dívida(s) de ${n} como paga(s)`);
  if (antes.cpf.dividas.length !== depois.cpf.dividas.length) mudancas.push(`dívidas de ${n}`);
  if (antes.fgts.saldo !== depois.fgts.saldo || antes.fgts.tem3Anos !== depois.fgts.tem3Anos) {
    mudancas.push(`FGTS de ${n}`);
  }
  if (JSON.stringify(antes.compromissos) !== JSON.stringify(depois.compromissos)) {
    mudancas.push(`compromissos mensais de ${n}`);
  }
  if (antes.podeSerComprador !== depois.podeSerComprador || antes.vaiMorar !== depois.vaiMorar) {
    mudancas.push(`participação de ${n} na compra`);
  }
  if (antes.temImovel !== depois.temImovel) mudancas.push(`imóvel no nome de ${n}`);
  if (mudancas.length === 0) return `Revisou os dados de ${n} (sem mudanças)`;
  const texto = mudancas.join("; ");
  return `Mudou ${texto}`;
}
