"use client";

import { useCallback, useEffect, useState } from "react";
import { CampoTexto } from "@/components/campos";
import {
  Aviso,
  Botao,
  BotaoLink,
  Cartao,
  Carregando,
  Selo,
  TituloPagina,
  confirmar,
} from "@/components/ui";
import { useNuvem } from "@/lib/armazenamento/hooks";
import { obterSupabase } from "@/lib/supabase/cliente";
import {
  aceitarConvite,
  criarFamilia,
  sairDaConta,
  sairDaFamilia,
  type StatusNuvem,
} from "@/lib/supabase/sincronizacao";

interface Membro {
  usuario_id: string;
  email: string;
  papel: "dono" | "membro";
}
interface Convite {
  id: string;
  email: string;
  familia_id: string;
}

const TEXTO_STATUS: Partial<Record<StatusNuvem["tipo"], string>> = {
  sincronizado: "✅ Dados sincronizados com a família",
  salvando: "⏳ Salvando…",
  carregando: "⏳ Carregando…",
  erro: "⚠️ Sem conexão com a nuvem",
  conflito: "⚠️ Houve uma alteração ao mesmo tempo",
};

function useListas(familiaId: string | null, email: string | undefined) {
  const [membros, setMembros] = useState<Membro[]>([]);
  const [convites, setConvites] = useState<Convite[]>([]);
  const recarregar = useCallback(async () => {
    const sb = obterSupabase();
    if (!sb || !email) return;
    const [m, c] = await Promise.all([
      familiaId
        ? sb.from("membros").select("usuario_id, email, papel")
        : Promise.resolve({ data: [] }),
      sb.from("convites").select("id, email, familia_id"),
    ]);
    setMembros((m.data as Membro[] | null) ?? []);
    setConvites((c.data as Convite[] | null) ?? []);
  }, [familiaId, email]);
  useEffect(() => {
    // Busca inicial das listas no servidor (assíncrona).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void recarregar();
  }, [recarregar]);
  return { membros, convites, recarregar };
}

export default function PaginaFamilia() {
  const nuvem = useNuvem();
  const { membros, convites, recarregar } = useListas(
    nuvem.familia?.id ?? null,
    nuvem.usuario?.email,
  );
  const [nomeFamilia, setNomeFamilia] = useState("Nossa família");
  const [emailConvite, setEmailConvite] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function executar(acao: () => Promise<string | null>, sucesso: string) {
    setOcupado(true);
    const erro = await acao();
    setOcupado(false);
    setMensagem(erro ? `Erro: ${erro}` : sucesso);
    await recarregar();
  }

  if (nuvem.tipo === "desligado") {
    return (
      <>
        <TituloPagina>Família</TituloPagina>
        <Aviso tipo="info" titulo="Modo só neste aparelho">
          O compartilhamento com a família ainda não foi configurado. Tudo funciona normalmente, mas
          os dados ficam só neste aparelho — baixe cópias de segurança em Mais.
        </Aviso>
      </>
    );
  }
  if (nuvem.tipo === "carregando" && !nuvem.usuario) return <Carregando />;
  if (!nuvem.usuario) {
    return (
      <>
        <TituloPagina subtitulo="Entre para compartilhar os dados com a família em vários aparelhos.">
          Família
        </TituloPagina>
        <BotaoLink href="/entrar" className="w-full">
          Entrar com e-mail
        </BotaoLink>
      </>
    );
  }

  const convitesParaMim = convites.filter(
    (c) =>
      c.email.toLowerCase() === nuvem.usuario?.email.toLowerCase() &&
      c.familia_id !== nuvem.familia?.id,
  );
  const convitesDaFamilia = convites.filter((c) => c.familia_id === nuvem.familia?.id);
  const souDono = membros.some((m) => m.usuario_id === nuvem.usuario?.id && m.papel === "dono");
  const enderecoApp = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <>
      <TituloPagina subtitulo={`Você entrou como ${nuvem.usuario.email}.`}>Família</TituloPagina>
      {mensagem && (
        <Aviso tipo={mensagem.startsWith("Erro") ? "perigo" : "sucesso"}>{mensagem}</Aviso>
      )}
      {nuvem.mensagem && <Aviso tipo="alerta">{nuvem.mensagem}</Aviso>}

      {!nuvem.familia ? (
        <>
          {convitesParaMim.map((c) => (
            <Cartao key={c.id} titulo="Você recebeu um convite!">
              <p className="mb-3 text-lg">
                Ao entrar, os dados deste aparelho serão trocados pelos da família (guardamos uma
                cópia).
              </p>
              <Botao
                className="w-full"
                disabled={ocupado}
                onClick={() => executar(() => aceitarConvite(c.id), "Você entrou na família!")}
              >
                Entrar na família
              </Botao>
            </Cartao>
          ))}
          <Cartao titulo="Criar a família">
            <p className="mb-3 text-lg">
              Os dados que estão neste aparelho vão para a família. Depois convide os outros pelo
              e-mail.
            </p>
            <CampoTexto rotulo="Nome da família" valor={nomeFamilia} aoMudar={setNomeFamilia} />
            <Botao
              className="w-full"
              disabled={ocupado}
              onClick={() =>
                executar(
                  () => criarFamilia(nomeFamilia),
                  "Família criada! Agora convide os outros.",
                )
              }
            >
              Criar família
            </Botao>
          </Cartao>
        </>
      ) : (
        <>
          <Cartao titulo={nuvem.familia.nome}>
            <p className="mb-3 text-lg font-semibold" role="status">
              {TEXTO_STATUS[nuvem.tipo] ?? ""}
            </p>
            <h3 className="text-lg font-bold">Quem participa</h3>
            <ul className="mb-2 divide-y divide-gray-200">
              {membros.map((m) => (
                <li
                  key={m.usuario_id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2"
                >
                  <span className="text-lg">
                    {m.email} {m.papel === "dono" && <Selo cor="azul">Dono</Selo>}
                  </span>
                  {souDono && m.usuario_id !== nuvem.usuario?.id && (
                    <Botao
                      variante="perigo"
                      onClick={async () => {
                        if (!confirmar(`Remover ${m.email} da família?`)) return;
                        await obterSupabase()
                          ?.from("membros")
                          .delete()
                          .eq("usuario_id", m.usuario_id);
                        await recarregar();
                      }}
                    >
                      Remover
                    </Botao>
                  )}
                </li>
              ))}
            </ul>
          </Cartao>

          <Cartao titulo="Convidar alguém">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const email = emailConvite.trim().toLowerCase();
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
                  return setMensagem("Erro: e-mail inválido.");
                const { error } = await obterSupabase()!
                  .from("convites")
                  .insert({ familia_id: nuvem.familia!.id, email, criado_por: nuvem.usuario!.id });
                setMensagem(error ? `Erro: ${error.message}` : `Convite criado para ${email}.`);
                setEmailConvite("");
                await recarregar();
              }}
            >
              <CampoTexto
                rotulo="E-mail da pessoa"
                tipo="email"
                valor={emailConvite}
                aoMudar={setEmailConvite}
              />
              <Botao type="submit" className="w-full">
                Convidar
              </Botao>
            </form>
            {convitesDaFamilia.length > 0 && (
              <>
                <h3 className="mt-4 text-lg font-bold">Convites esperando</h3>
                <ul className="divide-y divide-gray-200">
                  {convitesDaFamilia.map((c) => {
                    const texto = `Oi! Entre no app da nossa casa: ${enderecoApp}/entrar — use o e-mail ${c.email} e depois toque em "Entrar na família".`;
                    return (
                      <li key={c.id} className="py-2">
                        <p className="text-lg">{c.email}</p>
                        <div className="mt-1 flex flex-wrap gap-2">
                          <a
                            href={`https://wa.me/?text=${encodeURIComponent(texto)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-blue-800 underline"
                          >
                            Avisar pelo WhatsApp ↗
                          </a>
                          <Botao
                            variante="discreto"
                            onClick={async () => {
                              await obterSupabase()?.from("convites").delete().eq("id", c.id);
                              await recarregar();
                            }}
                          >
                            Cancelar convite
                          </Botao>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </Cartao>

          <Botao
            variante="perigo"
            className="mb-3 w-full"
            onClick={() => {
              if (
                confirmar(
                  "Sair da família? Os dados continuam neste aparelho, mas param de sincronizar.",
                )
              ) {
                void executar(sairDaFamilia, "Você saiu da família.");
              }
            }}
          >
            Sair da família
          </Botao>
        </>
      )}

      <Botao variante="secundario" className="w-full" onClick={() => void sairDaConta()}>
        Sair da conta neste aparelho
      </Botao>
    </>
  );
}
