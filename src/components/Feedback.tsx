"use client";

import { CheckCircle2, Info, XCircle } from "lucide-react";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { Botao, ICONE } from "@/components/ui";
import { assinarFeedback, obterFeedback, obterFeedbackServidor } from "@/lib/feedback";

const ICONES = { sucesso: CheckCircle2, erro: XCircle, info: Info } as const;

/** Dialog de confirmação (elemento <dialog> nativo, acessível) e pilha de toasts. */
export function Feedback() {
  const { confirmacao, toasts } = useSyncExternalStore(
    assinarFeedback,
    obterFeedback,
    obterFeedbackServidor,
  );
  const dialogo = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    if (confirmacao && !d.open) d.showModal();
    if (!confirmacao && d.open) d.close();
  }, [confirmacao]);

  return (
    <>
      <dialog
        ref={dialogo}
        aria-labelledby="dialogo-mensagem"
        onCancel={() => confirmacao?.responder(false)}
        className="m-auto w-[min(92vw,26rem)] rounded-md border border-borda bg-superficie p-5 text-texto shadow-lg backdrop:bg-black/40"
      >
        <p id="dialogo-mensagem" className="text-lg">
          {confirmacao?.mensagem}
        </p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Botao variante="secundario" onClick={() => confirmacao?.responder(false)}>
            Cancelar
          </Botao>
          <Botao
            variante={confirmacao?.perigoso ? "perigo" : "primario"}
            onClick={() => confirmacao?.responder(true)}
          >
            {confirmacao?.textoConfirmar}
          </Botao>
        </div>
      </dialog>

      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-36 z-[1300] flex flex-col items-center gap-2 px-4 lg:bottom-6 lg:items-end"
      >
        {toasts.map((t) => {
          const Icone = ICONES[t.tipo];
          return (
            <div
              key={t.id}
              role="status"
              className="pointer-events-auto flex max-w-sm items-center gap-2 rounded-md bg-texto px-4 py-3 text-white shadow-lg"
            >
              <Icone {...ICONE} />
              {t.texto}
            </div>
          );
        })}
      </div>
    </>
  );
}
