/** Aviso fixo e discreto exibido em todas as telas (exigência do projeto). */
export function AvisoEstimativa() {
  return (
    <footer
      role="note"
      className="sticky bottom-0 border-t border-gray-300 bg-amber-50 px-4 py-2 text-center text-sm text-gray-800"
    >
      Simulações são estimativas. Não é aconselhamento financeiro. Confirme com a Caixa ou um
      correspondente bancário.
    </footer>
  );
}
