"use client";

import { useState } from "react";
import { useEstadoFamilia } from "@/lib/armazenamento/hooks";
import { atualizarEstado } from "@/lib/armazenamento/loja";
import type { ItemVerificacao } from "@/lib/dominio/checklists";

/** Checklist salvo e compartilhado (fica em `estado.checklists`, chave = `${prefixo}:${id}`). */
export function ListaVerificacao({
  prefixo,
  itens,
  comNotas = false,
}: {
  prefixo: string;
  itens: ItemVerificacao[];
  comNotas?: boolean;
}) {
  const estado = useEstadoFamilia();
  const [notas, setNotas] = useState<Record<string, string>>({});
  if (!estado) return null;
  const feitos = itens.filter((i) => estado.checklists[`${prefixo}:${i.id}`]?.feito).length;

  function salvar(chave: string, texto: string, dados: { feito?: boolean; nota?: string }) {
    const atual = estado?.checklists[chave] ?? { feito: false, nota: "" };
    const novo = { ...atual, ...dados };
    const descricao =
      dados.feito === undefined
        ? `Anotou em "${texto}"`
        : dados.feito
          ? `Marcou como feito: "${texto}"`
          : `Desmarcou: "${texto}"`;
    atualizarEstado(descricao, (e) => ({ ...e, checklists: { ...e.checklists, [chave]: novo } }));
  }

  return (
    <div>
      <p className="mb-2 font-semibold" aria-live="polite">
        {feitos} de {itens.length} feitos
      </p>
      <ul className="space-y-3">
        {itens.map((item) => {
          const chave = `${prefixo}:${item.id}`;
          const salvo = estado.checklists[chave];
          const idCampo = `lv-${chave}`;
          return (
            <li key={item.id} className="rounded-xl border-2 border-gray-200 bg-white p-3">
              <div className="flex items-start gap-3">
                <input
                  id={idCampo}
                  type="checkbox"
                  checked={salvo?.feito ?? false}
                  onChange={(e) => salvar(chave, item.texto, { feito: e.target.checked })}
                  className="mt-1 h-7 w-7 shrink-0 accent-green-700"
                />
                <div className="flex-1">
                  <label
                    htmlFor={idCampo}
                    className={`text-lg ${salvo?.feito ? "line-through decoration-2" : ""}`}
                  >
                    {item.texto}
                  </label>
                  {item.ajuda && <p className="text-gray-700">{item.ajuda}</p>}
                  {comNotas && (
                    <div className="mt-2">
                      <label htmlFor={`${idCampo}-nota`} className="text-base font-semibold">
                        Anotações
                      </label>
                      <textarea
                        id={`${idCampo}-nota`}
                        rows={2}
                        value={notas[chave] ?? salvo?.nota ?? ""}
                        onChange={(e) => setNotas({ ...notas, [chave]: e.target.value })}
                        onBlur={() => {
                          const nota = notas[chave];
                          if (nota !== undefined && nota !== (salvo?.nota ?? "")) {
                            salvar(chave, item.texto, { nota });
                          }
                        }}
                        className="mt-1 block w-full rounded-xl border-2 border-gray-400 p-2 text-lg"
                      />
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
