"use client";

import { useEffect, useState } from "react";
import { Botao } from "@/components/ui";

const EH_DESKTOP = process.env.NEXT_PUBLIC_DESKTOP === "1";

/** Registra o service worker (só no site em produção; o app de Windows não precisa). */
export function RegistrarServiceWorker() {
  useEffect(() => {
    if (EH_DESKTOP || process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) {
      return;
    }
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Sem service worker o app continua funcionando (só não abre offline).
    });
  }, []);
  return null;
}

interface EventoInstalar extends Event {
  prompt: () => Promise<void>;
}

/** Botão "Instalar no aparelho" (Chrome/Edge/Android) + instruções para iPhone. */
export function InstalarApp() {
  const [evento, setEvento] = useState<EventoInstalar | null>(null);
  const [instalado, setInstalado] = useState(false);

  useEffect(() => {
    const aoPoderInstalar = (e: Event) => {
      e.preventDefault();
      setEvento(e as EventoInstalar);
    };
    const aoInstalar = () => setInstalado(true);
    window.addEventListener("beforeinstallprompt", aoPoderInstalar);
    window.addEventListener("appinstalled", aoInstalar);
    return () => {
      window.removeEventListener("beforeinstallprompt", aoPoderInstalar);
      window.removeEventListener("appinstalled", aoInstalar);
    };
  }, []);

  if (EH_DESKTOP) return null;
  if (instalado) return <p className="text-lg font-semibold text-green-800">App instalado!</p>;

  return (
    <div>
      {evento && (
        <Botao
          className="mb-3 w-full"
          onClick={async () => {
            await evento.prompt();
            setEvento(null);
          }}
        >
          📲 Instalar no aparelho
        </Botao>
      )}
      <ul className="list-disc space-y-1 pl-6 text-lg">
        <li>
          <strong>Android (Chrome):</strong> menu ⋮ → “Instalar app” ou “Adicionar à tela inicial”.
        </li>
        <li>
          <strong>iPhone (Safari):</strong> botão Compartilhar → “Adicionar à Tela de Início”.
        </li>
        <li>
          <strong>Windows (Edge ou Chrome):</strong> ícone de instalar na barra de endereço, ou menu
          → “Aplicativos” → “Instalar este site como aplicativo”.
        </li>
      </ul>
    </div>
  );
}
