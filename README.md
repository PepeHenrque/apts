# apts — nossa casa própria

App web, pensado para o celular, que ajuda uma família a descobrir **quanto consegue financiar pela
Caixa (Minha Casa Minha Vida)**, **o que está bloqueando a aprovação**, **qual combinação de
compradores funciona** e a organizar a busca de imóveis dentro do orçamento.

> Simulações são estimativas. Não é aconselhamento financeiro. Confirme com a Caixa ou um
> correspondente bancário.

## Como rodar no seu computador

Pré-requisito: [Node.js 24](https://nodejs.org/) (ou mais novo).

```bash
npm install          # instala as dependências (só na primeira vez ou quando mudar o package.json)
cp .env.example .env.local   # opcional por enquanto; preencha quando chegar na Fase 3
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

O **build** e os **testes de ponta a ponta (Playwright)** rodam automaticamente no GitHub Actions a
cada Pull Request — não é preciso rodá-los localmente.

## Tecnologias

Next.js 16 (App Router) · TypeScript · Tailwind CSS · Zod · Vitest · Playwright (CI) · Supabase ·
Leaflet/OpenStreetMap · Gemini (opcional) · Vercel.

## Documentação

- [`docs/PROGRESSO.md`](docs/PROGRESSO.md) — o que já está pronto e os próximos passos.
- [`CLAUDE.md`](CLAUDE.md) / [`AGENTS.md`](AGENTS.md) / [`GEMINI.md`](GEMINI.md) — guia para
  assistentes de IA (mesmo conteúdo).
- [`docs/PROMPT-ORIGINAL.md`](docs/PROMPT-ORIGINAL.md) — pedido completo do projeto.

## Fluxo de trabalho

Uma branch por funcionalidade, commits no padrão Conventional Commits em português, Pull Request com
CI verde e merge com squash. Detalhes em `CLAUDE.md`.
