import type { ResumoRecusas } from "@/lib/dominio/diagnostico";

/**
 * Barras horizontais simples (uma série só): causa → quantidade.
 * O nome e o número ficam escritos em texto (a cor não é a única informação).
 */
export function GraficoCausas({ resumo }: { resumo: ResumoRecusas }) {
  const maior = Math.max(1, ...resumo.porCausa.map((c) => c.quantidade));
  return (
    <figure>
      <figcaption className="mb-3 text-lg font-bold">Causas mais frequentes</figcaption>
      <ul className="space-y-3">
        {resumo.porCausa.map((c) => (
          <li key={c.causa} title={`${c.nome}: ${c.quantidade} de ${resumo.total} recusas`}>
            <div className="flex justify-between gap-2 text-base">
              <span>{c.nome}</span>
              <span className="font-bold tabular-nums">{c.quantidade}</span>
            </div>
            <div className="mt-1 h-3 w-full bg-gray-100" aria-hidden="true">
              <div
                className="h-3 rounded-r bg-blue-700"
                style={{ width: `${(c.quantidade / maior) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </figure>
  );
}
