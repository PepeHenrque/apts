"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CampoTexto } from "@/components/campos";
import { Aviso, Botao, BotaoLink, Cartao, TituloPagina } from "@/components/ui";
import { useNuvem } from "@/lib/armazenamento/hooks";
import { obterSupabase } from "@/lib/supabase/cliente";

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function PaginaEntrar() {
  const nuvem = useNuvem();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [etapa, setEtapa] = useState<"email" | "codigo">("email");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  if (nuvem.tipo === "desligado") {
    return (
      <>
        <TituloPagina>Entrar</TituloPagina>
        <Aviso tipo="info" titulo="O login ainda não foi configurado.">
          Por enquanto os dados ficam só neste aparelho. Para compartilhar com a família, siga o
          passo a passo em docs/SUPABASE.md.
        </Aviso>
      </>
    );
  }

  if (nuvem.usuario) {
    return (
      <>
        <TituloPagina>Entrar</TituloPagina>
        <Aviso tipo="sucesso" titulo={`Você entrou como ${nuvem.usuario.email}.`} />
        <BotaoLink href="/familia" className="w-full">
          Ir para a família
        </BotaoLink>
      </>
    );
  }

  async function enviarEmail() {
    const sb = obterSupabase();
    if (!sb) return;
    if (!EMAIL_VALIDO.test(email.trim())) {
      setErro("Digite um e-mail válido.");
      return;
    }
    setEnviando(true);
    setErro("");
    const { error } = await sb.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/familia`, shouldCreateUser: true },
    });
    setEnviando(false);
    if (error) {
      setErro(
        error.status === 429
          ? "Muitos pedidos de e-mail. Espere alguns minutos e tente de novo."
          : "Não foi possível enviar o e-mail. Confira o endereço e a internet.",
      );
      return;
    }
    setEtapa("codigo");
  }

  async function verificarCodigo() {
    const sb = obterSupabase();
    if (!sb) return;
    setEnviando(true);
    setErro("");
    const { error } = await sb.auth.verifyOtp({
      email: email.trim(),
      token: codigo.replace(/\D/g, ""),
      type: "email",
    });
    setEnviando(false);
    if (error) {
      setErro("Código inválido ou vencido. Peça um novo e-mail.");
      return;
    }
    router.push("/familia");
  }

  return (
    <>
      <TituloPagina subtitulo="Sem senha: mandamos um link e um código para o seu e-mail.">
        Entrar
      </TituloPagina>
      {erro && <Aviso tipo="perigo">{erro}</Aviso>}
      {etapa === "email" ? (
        <Cartao>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void enviarEmail();
            }}
          >
            <CampoTexto
              rotulo="Seu e-mail"
              tipo="email"
              autoComplete="email"
              valor={email}
              aoMudar={setEmail}
            />
            <Botao type="submit" className="w-full" disabled={enviando}>
              {enviando ? "Enviando…" : "Receber link de acesso"}
            </Botao>
          </form>
        </Cartao>
      ) : (
        <Cartao>
          <p className="mb-3 text-lg">
            Enviamos um e-mail para <strong>{email}</strong>. Toque no link do e-mail{" "}
            <strong>ou</strong> digite aqui o código que veio nele (útil no app instalado).
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void verificarCodigo();
            }}
          >
            <CampoTexto
              rotulo="Código do e-mail"
              valor={codigo}
              aoMudar={setCodigo}
              autoComplete="one-time-code"
            />
            <Botao
              type="submit"
              className="w-full"
              disabled={enviando || codigo.replace(/\D/g, "").length < 6}
            >
              {enviando ? "Conferindo…" : "Entrar com o código"}
            </Botao>
          </form>
          <Botao variante="discreto" className="mt-2 px-0" onClick={() => setEtapa("email")}>
            Usar outro e-mail ou reenviar
          </Botao>
          <p className="mt-2 text-gray-700">
            Não chegou? Veja a caixa de spam e espere alguns minutos.
          </p>
        </Cartao>
      )}
    </>
  );
}
