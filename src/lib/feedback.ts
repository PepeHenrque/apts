/**
 * Confirmações (Dialog) e avisos rápidos (Toast) sem depender de bibliotecas.
 * As telas chamam `await confirmar("…")` e `avisar("Salvo.")`; o desenho fica em
 * src/components/Feedback.tsx (montado uma vez no layout).
 */

export interface PedidoConfirmacao {
  mensagem: string;
  textoConfirmar: string;
  perigoso: boolean;
  responder: (ok: boolean) => void;
}

export interface Toast {
  id: number;
  texto: string;
  tipo: "sucesso" | "erro" | "info";
}

interface EstadoFeedback {
  confirmacao: PedidoConfirmacao | null;
  toasts: Toast[];
}

let estado: EstadoFeedback = { confirmacao: null, toasts: [] };
const ouvintes = new Set<() => void>();
let proximoId = 1;

function mudar(parcial: Partial<EstadoFeedback>) {
  estado = { ...estado, ...parcial };
  for (const o of ouvintes) o();
}

export function assinarFeedback(o: () => void) {
  ouvintes.add(o);
  return () => ouvintes.delete(o);
}
export function obterFeedback(): EstadoFeedback {
  return estado;
}
const VAZIO: EstadoFeedback = { confirmacao: null, toasts: [] };
export function obterFeedbackServidor(): EstadoFeedback {
  return VAZIO;
}

/** Pergunta de confirmação. Resolve true se a pessoa confirmar. */
export function confirmar(
  mensagem: string,
  opcoes: { textoConfirmar?: string; perigoso?: boolean } = {},
): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  return new Promise((resolve) => {
    mudar({
      confirmacao: {
        mensagem,
        textoConfirmar: opcoes.textoConfirmar ?? "Confirmar",
        perigoso: opcoes.perigoso ?? true,
        responder: (ok) => {
          mudar({ confirmacao: null });
          resolve(ok);
        },
      },
    });
  });
}

/** Aviso rápido no canto da tela (some sozinho). */
export function avisar(texto: string, tipo: Toast["tipo"] = "sucesso") {
  const id = proximoId++;
  mudar({ toasts: [...estado.toasts, { id, texto, tipo }] });
  setTimeout(() => mudar({ toasts: estado.toasts.filter((t) => t.id !== id) }), 4000);
}
