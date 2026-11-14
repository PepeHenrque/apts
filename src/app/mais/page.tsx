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
        <ul className="mb-6 space-y-2">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="block rounded-2xl border-2 border-gray-200 bg-white p-4 hover:border-blue-700"
              >
                <span className="block text-xl font-bold text-blue-900">{l.titulo}</span>
                <span className="text-gray-700">{l.texto}</span>
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
        <p className="mb-3 text-lg">
          Por enquanto os dados ficam só neste aparelho. Baixe uma cópia de vez em quando.
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
            className="text-lg"
            onChange={async (e) => {
              const arquivo = e.target.files?.[0];
              if (!arquivo) return;
              try {
                const dados = lerEstado(JSON.parse(await arquivo.text()));
                if (!dados) throw new Error("inválido");
                if (confirmar("Substituir os dados deste aparelho pelos da cópia?")) {
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
            onClick={() => {
              if (confirmar("Apagar tudo e voltar aos dados de exemplo?")) recarregarExemplo();
            }}
          >
            Voltar aos dados de exemplo
          </Botao>
        </div>
      </Cartao>
    </>
  );
}
