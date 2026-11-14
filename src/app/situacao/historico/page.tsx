"use client";

import { Cartao, Carregando, EstadoVazio } from "@/components/ui";
import { useEstadoFamilia } from "@/lib/armazenamento/hooks";
import { formatarDataHora } from "@/lib/formatar";

export default function PaginaHistorico() {
  const estado = useEstadoFamilia();
  if (!estado) return <Carregando />;
  if (estado.historico.length === 0) {
    return (
      <EstadoVazio titulo="Nenhuma alteração ainda">
        As mudanças feitas no app aparecem aqui.
      </EstadoVazio>
    );
  }
  return (
    <Cartao titulo="Últimas alterações">
      <ol className="divide-y divide-gray-200">
        {estado.historico.map((h) => (
          <li key={h.id} className="py-3">
            <p className="text-lg">
              <strong>{h.quem}</strong> — {h.descricao}
            </p>
            <p className="text-gray-700">{formatarDataHora(h.quando)}</p>
          </li>
        ))}
      </ol>
    </Cartao>
  );
}
