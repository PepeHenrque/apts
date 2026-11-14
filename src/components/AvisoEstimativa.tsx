/** Aviso fixo e discreto exibido em todas as telas (exigência do projeto). */
export function AvisoEstimativa() {
  return (
    <p
      data-testid="aviso-estimativa"
      className="border-t border-gray-300 bg-amber-50 px-3 py-1 text-center text-xs text-gray-900 sm:text-sm"
    >
      Simulações são estimativas. Não é aconselhamento financeiro. Confirme com a Caixa ou um
      correspondente bancário.
    </p>
  );
}
