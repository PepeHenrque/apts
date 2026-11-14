"use client";

import { ListaVerificacao } from "@/components/ListaVerificacao";
import { Aviso, Carregando, TituloPagina } from "@/components/ui";
import { useEstadoFamilia } from "@/lib/armazenamento/hooks";
import {
  CHECKLIST_FAIXA1,
  CHECKLIST_IMOVEL,
  CHECKLIST_LIMPAR_NOME,
  CHECKLIST_REPASSE,
  secoesDocumentos,
  type SecaoChecklist,
} from "@/lib/dominio/checklists";

function Secao({ secao, aberta = false }: { secao: SecaoChecklist; aberta?: boolean }) {
  return (
    <details className="mb-4 rounded-md border border-borda bg-white p-4" open={aberta}>
      <summary className="min-h-11 cursor-pointer text-lg font-semibold">{secao.titulo}</summary>
      <p className="my-2 text-texto-2">{secao.descricao}</p>
      <ListaVerificacao prefixo={secao.prefixo} itens={secao.itens} comNotas={secao.comNotas} />
    </details>
  );
}

export default function PaginaGuias() {
  const estado = useEstadoFamilia();
  if (!estado) return <Carregando />;
  const temNegativado = estado.pessoas.some((p) => p.cpf.negativado);

  return (
    <>
      <TituloPagina
        idAjuda="guias"
        ajuda="Marquem o que já fizeram. As marcações ficam salvas e aparecem para toda a família."
        subtitulo="Marque o que já fizeram. As marcações ficam salvas e aparecem para a família."
      >
        Checklists e guias
      </TituloPagina>
      <Aviso tipo="info">
        Os documentos exatos podem variar. Confirme a lista com a Caixa ou o correspondente
        bancário.
      </Aviso>

      <h2 className="mb-3 text-xl font-semibold">Documentos para a Caixa</h2>
      {secoesDocumentos(estado.pessoas).map((s, i) => (
        <Secao key={s.prefixo} secao={s} aberta={i === 0} />
      ))}

      <h2 className="mt-6 mb-3 text-xl font-semibold">Guias</h2>
      <Secao secao={CHECKLIST_LIMPAR_NOME} aberta={temNegativado} />
      <Secao secao={CHECKLIST_FAIXA1} />
      <Secao secao={CHECKLIST_IMOVEL} />
      <Secao
        secao={{
          prefixo: "repasse",
          titulo: "Segurança no repasse",
          descricao: "Se forem assumir o financiamento de outra pessoa.",
          itens: CHECKLIST_REPASSE,
        }}
      />
    </>
  );
}
