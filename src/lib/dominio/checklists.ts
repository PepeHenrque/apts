/** Itens dos checklists (o que está marcado fica salvo em estado.checklists). */
export interface ItemVerificacao {
  id: string;
  texto: string;
  ajuda?: string;
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
