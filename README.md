# apts — nossa casa própria

App web, pensado para o celular, que ajuda uma família a descobrir **quanto consegue financiar pela
Caixa (Minha Casa Minha Vida)**, **o que está bloqueando a aprovação**, **qual combinação de
compradores funciona** e a organizar a busca de imóveis dentro do orçamento.

> Simulações são estimativas. Não é aconselhamento financeiro. Confirme com a Caixa ou um
> correspondente bancário.

## O que o app faz

- **Nossa situação** — pessoas, trabalho e renda (com data de fim de contrato), nome sujo e dívidas,
  FGTS, outras parcelas, recusas de financiamento, dinheiro guardado e imóvel desejado. Tudo
  editável, com histórico de quem mudou o quê.
- **Diagnóstico** — semáforo (Pronto / Quase / Ainda não), bloqueios do mais grave ao mais leve e o
  que fazer em cada um.
- **Simulador** — todas as combinações de compradores, preço máximo (SAC e Price), prazo pela idade,
  subsídio, FGTS, "e se…" e parcelas mês a mês.
- **Imóveis** — salve anúncios colando o texto ou o link e veja na hora se cabe no orçamento, a
  entrada, a parcela e a distância da casa atual. Mapa com OpenStreetMap.
- **Buscar nos sites** — links prontos para OLX, Zap, VivaReal, Imóveis Caixa e Facebook, já com o
  preço máximo.
- **Repasse** e **Empréstimo para a entrada** — simuladores com os riscos explicados.
- **Checklists** — documentos para a Caixa, o que conferir no imóvel, limpar o nome e o caminho da
  Faixa 1 pela prefeitura.
- **Família** (opcional, Supabase) — login por e-mail sem senha e dados compartilhados em tempo real.
- **IA** (opcional, Gemini) — preencher anúncio colado e explicar a situação em linguagem simples.
- **Instalável** no celular e no Windows (PWA), e versão desktop para Windows (veja abaixo).

## App para Windows

1. Abra **https://github.com/PepeHenrque/apts/releases/latest**.
2. Em **Assets**, baixe o arquivo que termina em **`_x64-setup.exe`**.
3. Abra o arquivo baixado. **O Windows vai mostrar um aviso** ("O Windows protegeu o computador"
   / SmartScreen), porque o app **não é assinado digitalmente** (o certificado é pago). Clique em
   **Mais informações** → **Executar assim mesmo**.
4. Siga o instalador. O app aparece no menu Iniciar como **apts**.

O instalador é gerado automaticamente pelo GitHub Actions (workflow "App Windows") — nada é
compilado no seu computador. Para gerar uma versão nova: aumente a `version` no `package.json` e
rode **Actions → App Windows → Run workflow** (ou crie uma tag `vX.Y.Z`).

Os dados do app de Windows ficam no computador. Para usar os dados da família (login), cadastre
em **Settings → Secrets and variables → Actions → Variables** do GitHub as variáveis
`NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` (e, para a IA, `NEXT_PUBLIC_URL_API`
com o endereço da Vercel) e gere uma versão nova. No app de Windows, entre com o **código** que
chega por e-mail. Alternativa sem instalar nada: abra o site no Edge/Chrome e use **Instalar app**.

## Colocar no ar / ligar os serviços

| O quê                         | Passo a passo                          | Obrigatório?              |
| ----------------------------- | -------------------------------------- | ------------------------- |
| Publicar na internet (Vercel) | [`docs/VERCEL.md`](docs/VERCEL.md)     | Sim, para usar no celular |
| Login e dados da família      | [`docs/SUPABASE.md`](docs/SUPABASE.md) | Não                       |
| IA Gemini                     | [`docs/GEMINI.md`](docs/GEMINI.md)     | Não                       |

Sem Supabase e sem Gemini o app funciona: os dados ficam no aparelho (dá para baixar uma cópia de
segurança em Mais) e os botões de IA não aparecem.

## Como rodar no seu computador

Pré-requisito: [Node.js 24](https://nodejs.org/) (ou mais novo).

```bash
npm install          # instala as dependências (só na primeira vez ou quando mudar o package.json)
cp .env.example .env.local   # opcional: preencha para usar Supabase/Gemini localmente
npm run dev          # abre em http://localhost:3000
```

Comandos leves para usar no dia a dia:

```bash
npm test             # testes unitários
npm run lint         # confere o estilo do código
npm run typecheck    # confere os tipos do TypeScript
npm run verificar    # os três acima de uma vez (rode antes de abrir um PR)
npm run format       # arruma a formatação
```

O **build**, os **testes de ponta a ponta (Playwright)** e os **testes de segurança do banco (RLS)**
rodam automaticamente no GitHub Actions a cada Pull Request — não é preciso rodá-los localmente.

## Tecnologias

Next.js 16 (App Router) · TypeScript · Tailwind CSS · Zod · Vitest · Playwright (CI) · Supabase ·
Leaflet/OpenStreetMap · Gemini (opcional) · Vercel.

## Documentação

- [`docs/PROGRESSO.md`](docs/PROGRESSO.md) — o que já está pronto, decisões e próximos passos.
- [`CLAUDE.md`](CLAUDE.md) / [`AGENTS.md`](AGENTS.md) / [`GEMINI.md`](GEMINI.md) — guia para
  assistentes de IA (mesmo conteúdo).
- [`docs/PROMPT-ORIGINAL.md`](docs/PROMPT-ORIGINAL.md) — pedido completo do projeto.
- [`src/config/regras-mcmv.ts`](src/config/regras-mcmv.ts) — todas as regras e valores do MCMV
  (com fontes e itens "A CONFIRMAR").

## Fluxo de trabalho

Uma branch por funcionalidade, commits no padrão Conventional Commits em português, Pull Request com
CI verde e merge com squash. Detalhes em `CLAUDE.md`.
