# Progresso do projeto "apts"

> Atualize este arquivo ao fim de cada fase. Ele deve bastar para qualquer pessoa ou IA continuar o
> trabalho sem o histórico do chat. Pedido completo: `docs/PROMPT-ORIGINAL.md`.

Última atualização: 14/11/2026 — Fase 0.

## Situação das fases

| Fase | Conteúdo                                                        | Situação     |
| ---- | --------------------------------------------------------------- | ------------ |
| 0    | Setup: Next.js, TS, Tailwind, Vitest, ESLint/Prettier, CI, docs | Concluída    |
| 1    | Motor de cálculo (`regras-mcmv.ts` + funções + testes)          | Não iniciada |
| 2    | F1, F2, F3, F11, F12 com localStorage                           | Não iniciada |
| 3    | Supabase + login + família + RLS (F9)                           | Não iniciada |
| 4    | Imóveis salvos, busca guiada, mapa (F4, F5, F6)                 | Não iniciada |
| 5    | Checklists, tela inicial, PWA (F8, F10)                         | Não iniciada |
| 6    | Gemini (F7)                                                     | Não iniciada |
| 7    | Deploy final na Vercel + revisão geral                          | Não iniciada |

## O que está pronto (Fase 0)

- Next.js 16.4 (App Router, `src/`), React 19.3, TypeScript strict + `noUncheckedIndexedAccess`.
- Tailwind 4 (via `@tailwindcss/turbopack`, sem `postcss.config`), CSS base mobile-first com fonte
  18px e foco visível.
- Layout em `pt-BR` com aviso fixo "Simulações são estimativas..." (`src/components/AvisoEstimativa.tsx`).
- Página inicial provisória (`src/app/page.tsx`).
- Vitest (ambiente Node, alias `@/`) — primeiro teste em `src/lib/formatar.test.ts`.
- Playwright configurado só para CI (`playwright.config.ts`, perfil de celular Pixel 7) com teste de
  fumaça em `e2e/inicio.spec.ts`.
- ESLint (config do Next + Prettier), Prettier, `.gitattributes` forçando LF.
- CI em `.github/workflows/ci.yml`: job `qualidade` (lint, format:check, typecheck, unitários) e job
  `build-e2e` (build + Playwright Chromium).
- `.env.example` com as variáveis futuras (Supabase, Gemini, Nominatim).
- Guias para IA: `CLAUDE.md` (fonte), `AGENTS.md` e `GEMINI.md` (cópias via
  `npm run sincronizar-guias`).

## Decisões tomadas

- **Next 16 com `cacheComponents: true`** (padrão do template). Componentes que leem dados dinâmicos
  (cookies do Supabase etc.) precisarão de `<Suspense>`. Consultar `node_modules/next/dist/docs/`.
- `@types/node` 24 (o Vitest 5 exige ≥ 22; Node local e CI usam 24 via `.nvmrc`).
- Fonte do sistema em vez de Google Fonts (sem download no build, mais leve no celular).
- Vitest em ambiente `node` (a lógica é pura). Se no futuro precisar testar componentes, adicionar
  `jsdom` + Testing Library só onde for necessário.
- Build não é rodado localmente (notebook fraco) — o CI faz.
- `package-lock.json` é commitado (o CI usa `npm ci`).

## Pendências / avisos

- O `gh` (GitHub CLI) precisa estar instalado e autenticado na máquina para o fluxo de PR.

## Próximos passos (Fase 1 — Motor de cálculo)

1. Branch `feat/f1-motor-calculo`.
2. Criar `src/config/regras-mcmv.ts` com: faixas de renda, teto de subsídio e fórmula decrescente,
   teto do imóvel por faixa, juros por faixa, idade máxima (80 anos e 6 meses), prazo máximo (420
   meses), comprometimento (30%), tabela MIP por faixa etária, taxa de administração, regra FGTS
   (3 anos). Cada valor com data de referência e fonte em comentário.
3. Funções puras em `src/lib/financiamento/`: idade, prazo máximo pelo mais velho, enquadramento de
   faixa, parcela máxima, valor financiável SAC/Price (descontando MIP e taxa), subsídio estimado,
   preço máximo do imóvel, viabilidade por proponente (CPF, renda), quanto falta para um imóvel,
   tabela de evolução de parcelas.
4. Testes Vitest com os casos da seção 7 do prompt.
