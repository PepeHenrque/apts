"use client";

import Link from "next/link";
import { useState } from "react";
import { CampoTexto } from "@/components/campos";
import { InstalarApp } from "@/components/Pwa";
import { Aviso, Botao, Cartao, TituloPagina, confirmar } from "@/components/ui";
import { useEstadoFamilia, useQuem } from "@/lib/armazenamento/hooks";
import { definirQuem, recarregarExemplo, substituirEstado } from "@/lib/armazenamento/loja";
import { lerEstado } from "@/lib/dominio/esquemas";

const LINKS = [
  {
    href: "/como-usar",
    titulo: "Como usar",
    texto: "Passo a passo, do cadastro até salvar um imóvel",
  },
  {
    href: "/familia",
    titulo: "Família e login",
    texto: "Compartilhar os dados com a família em vários aparelhos",
  },
  { href: "/diagnostico", titulo: "Por que estão negando?", texto: "Bloqueios e o que fazer" },
  {
    href: "/simulador",
    titulo: "Simulador",
    texto: "Quanto cada combinação de compradores consegue",
  },
  {
    href: "/situacao",
    titulo: "Nossa situação",
    texto: "Pessoas, rendas, nome, recusas, dinheiro",
  },
  {
    href: "/guias",
    titulo: "Checklists e guias",
    texto: "Documentos, conferir o imóvel, limpar o nome, Faixa 1",
  },
  { href: "/repasse", titulo: "Repasse", texto: "Assumir o financiamento de outra pessoa" },
  { href: "/emprestimo", titulo: "Empréstimo para a entrada", texto: "Efeito no financiamento" },
];

function baixarCopia(conteudo: string) {
  const blob = new Blob([conteudo], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `apts-copia-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function PaginaMais() {
  const estado = useEstadoFamilia();
  const quem = useQuem();
  const [nome, setNome] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState("");

  return (
    <>
      <TituloPagina>Mais</TituloPagina>
      <nav aria-label="Todas as telas">
        <ul className="mb-6 grid gap-2 sm:grid-cols-2">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="block rounded-md border border-borda bg-white p-4 hover:border-primaria"
              >
                <span className="block text-lg font-semibold text-primaria">{l.titulo}</span>
                <span className="text-texto-2">{l.texto}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <Cartao titulo="Instalar o app">
        <InstalarApp />
      </Cartao>

      <Cartao titulo="Quem está usando este aparelho">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (nome?.trim()) definirQuem(nome);
            setNome(null);
          }}
        >
          <CampoTexto rotulo="Nome ou apelido" valor={nome ?? quem} aoMudar={setNome} />
          <Botao type="submit" variante="secundario">
            Salvar nome
          </Botao>
        </form>
      </Cartao>

      <Cartao titulo="Cópia de segurança">
        <p className="mb-3">
          Os dados ficam neste aparelho (e na nuvem, se a família estiver conectada). Baixe uma
          cópia de vez em quando.
        </p>
        <div className="flex flex-col gap-2">
          <Botao
            variante="secundario"
            disabled={!estado}
            onClick={() => estado && baixarCopia(JSON.stringify(estado, null, 2))}
          >
            Baixar cópia dos dados
          </Botao>
          <label className="font-semibold" htmlFor="importar">
            Restaurar de uma cópia (arquivo .json)
          </label>
          <input
            id="importar"
            type="file"
            accept="application/json,.json"
            className=""
            onChange={async (e) => {
              const arquivo = e.target.files?.[0];
              if (!arquivo) return;
              try {
                const dados = lerEstado(JSON.parse(await arquivo.text()));
                if (!dados) throw new Error("inválido");
                if (await confirmar("Substituir os dados deste aparelho pelos da cópia?")) {
                  substituirEstado(dados);
                  setMensagem("Dados restaurados.");
                }
              } catch {
                setMensagem("Esse arquivo não é uma cópia válida do app.");
              }
            }}
          />
          {mensagem && <Aviso tipo="info">{mensagem}</Aviso>}
          <Botao
            variante="perigo"
            onClick={async () => {
              if (await confirmar("Apagar tudo e voltar aos dados de exemplo?"))
                recarregarExemplo();
            }}
          >
            Voltar aos dados de exemplo
          </Botao>
        </div>
      </Cartao>
    </>
  );
}
