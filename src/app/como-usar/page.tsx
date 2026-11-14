"use client";

import Link from "next/link";
import { abrirTour } from "@/components/Tour";
import { Botao, Cartao, TituloPagina } from "@/components/ui";

const PASSOS = [
  {
    titulo: "Cadastrem quem vai comprar e quem vai morar",
    texto:
      "Em Nossa situação → Pessoas, adicionem cada pessoa com data de nascimento, trabalho e salário bruto. Se alguém tem nome sujo, marquem e cadastrem as dívidas.",
    href: "/situacao",
    link: "Abrir Nossa situação",
  },
  {
    titulo: "Registrem as recusas que já tiveram",
    texto:
      "Em Nossa situação → Recusas, anotem cada vez que o banco negou e o motivo informado. Isso ajuda o diagnóstico.",
    href: "/situacao/recusas",
    link: "Abrir Recusas",
  },
  {
    titulo: "Digam quanto dinheiro já têm",
    texto:
      "Em Nossa situação → Dinheiro, informem o que está guardado para a entrada e quanto conseguem guardar por mês.",
    href: "/situacao/dinheiro",
    link: "Abrir Dinheiro",
  },
  {
    titulo: "Vejam o diagnóstico",
    texto:
      "O Diagnóstico mostra se dá para pedir o financiamento agora e, se não der, o que resolver primeiro.",
    href: "/diagnostico",
    link: "Abrir Diagnóstico",
  },
  {
    titulo: "Comparem os cenários",
    texto:
      'No Simulador aparecem todas as combinações de compradores. A melhor fica em destaque, com o preço máximo do imóvel e a parcela. Usem o "E se…?" para testar mudanças sem salvar.',
    href: "/simulador",
    link: "Abrir Simulador",
  },
  {
    titulo: "Procurem imóveis dentro do orçamento",
    texto:
      "Em Buscar nos sites, os links da OLX, Zap, VivaReal, Caixa e Facebook já abrem com o preço máximo. Em Imóveis salvos, adicionem os anúncios que gostaram colando o texto ou o link.",
    href: "/busca",
    link: "Abrir Buscar nos sites",
  },
  {
    titulo: "Confiram cada imóvel e separem os documentos",
    texto:
      "Cada imóvel salvo mostra se cabe no orçamento (verde, amarelo ou vermelho), a entrada, a parcela e a distância. Em Checklists estão os documentos para a Caixa e o que conferir antes de fechar.",
    href: "/guias",
    link: "Abrir Checklists",
  },
];

export default function PaginaComoUsar() {
  return (
    <>
      <TituloPagina
        subtitulo="Do cadastro da situação até salvar um imóvel, em sete passos."
        acoes={
          <Botao variante="secundario" onClick={() => abrirTour()}>
            Rever o tour
          </Botao>
        }
      >
        Como usar
      </TituloPagina>
      <ol className="grid gap-x-4 lg:grid-cols-2">
        {PASSOS.map((p, i) => (
          <li key={p.href}>
            <Cartao>
              <div className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="numeros flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primaria-suave font-semibold text-primaria"
                >
                  {i + 1}
                </span>
                <div>
                  <h2 className="font-semibold">{p.titulo}</h2>
                  <p className="mt-1 text-texto-2">{p.texto}</p>
                  <Link
                    href={p.href}
                    className="mt-2 inline-block font-medium text-primaria hover:underline"
                  >
                    {p.link}
                  </Link>
                </div>
              </div>
            </Cartao>
          </li>
        ))}
      </ol>
      <Cartao titulo="Dicas">
        <ul className="list-disc space-y-1 pl-5 text-texto-2">
          <li>
            Os valores são estimativas. Confirmem sempre com a Caixa ou um correspondente bancário.
          </li>
          <li>Tudo pode ser mudado depois: os cálculos se atualizam na hora.</li>
          <li>O botão de interrogação no canto da tela reabre o tour quando quiserem.</li>
        </ul>
      </Cartao>
    </>
  );
}
