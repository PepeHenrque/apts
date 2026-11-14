/** Aviso fixo e discreto exibido em todas as telas (exigência do projeto). */
export function AvisoEstimativa() {
  return (
    <p
      data-testid="aviso-estimativa"
      className="border-t border-borda bg-fundo/95 px-3 py-1.5 text-center text-xs text-texto-2 backdrop-blur-sm"
    >
      Simulações são estimativas. Não é aconselhamento financeiro. Confirme com a Caixa ou um
      correspondente bancário.
    </p>
  );
}
