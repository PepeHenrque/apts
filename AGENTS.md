<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Guia do projeto "apts" para assistentes de IA

> **CLAUDE.md, AGENTS.md e GEMINI.md têm o mesmo conteúdo.** Edite o `CLAUDE.md` e rode
> `npm run sincronizar-guias` para copiar para os outros dois (o `AGENTS.md` mantém no topo o bloco
> do Next.js, que o `next dev` re-insere automaticamente).
>
> Antes de começar qualquer tarefa, leia também `docs/PROGRESSO.md` (estado atual e próximos passos)
> e, se precisar do pedido completo, `docs/PROMPT-ORIGINAL.md`.

## O que é

App web (celular primeiro, tudo em português do Brasil, linguagem simples) para uma família descobrir
**quanto consegue financiar pela Caixa (Minha Casa Minha Vida)**, **o que bloqueia a aprovação**,
**qual combinação de compradores funciona** e organizar a busca de imóveis dentro do orçamento.

Regra de ouro: **nada da situação da família fica fixo no código**. Pessoas, rendas, dívidas,
recusas, preferências etc. são editáveis no app; os dados reais iniciais servem só de exemplo/seed.
Todo cálculo é **estimativa** — telas de cálculo mostram "Estimativa — o valor final é definido pela
Caixa".

## Stack

- Next.js 16 (App Router, `src/`), React 19, TypeScript strict (`noUncheckedIndexedAccess`), Tailwind 4
- **Atenção:** o Next 16 tem mudanças grandes. A documentação da versão instalada está em
  `node_modules/next/dist/docs/` — consulte antes de usar APIs do Next. `cacheComponents` está ligado
  em `next.config.ts`.
- Zod 4 (validação), Vitest (unitários, ambiente Node), Playwright (E2E, **só no CI**)
- Supabase (Postgres + Auth por link mágico + RLS) — a partir da Fase 3
- Leaflet + OpenStreetMap, Nominatim (1 req/s, User-Agent identificável, cache no banco) — Fase 4
- Gemini API, nível gratuito, opcional — Fase 6
- Deploy: Vercel

## Restrições

- Notebook do desenvolvedor é fraco: **nada de Docker, banco local ou Playwright local**. Localmente só
  `npm run dev`, `npm test`, `npm run lint`, `npm run typecheck`. Build e E2E rodam no GitHub Actions.
- Só serviços gratuitos.
- **Proibido scraping** (OLX, Facebook, Zap, VivaReal...). Busca = links pré-filtrados + cadastro
  manual/colado.
- Segredos só em variáveis de ambiente do servidor. Nunca `NEXT_PUBLIC_` para chave do Gemini ou
  service role do Supabase. `.env*` está no `.gitignore` (exceto `.env.example`).
- Para o Gemini vai **somente o texto do anúncio** (ou números anonimizados) — nunca nomes, CPF,
  rendas ou dívidas da família.

## Comandos

| Comando                     | O que faz                                           |
| --------------------------- | --------------------------------------------------- |
| `npm run dev`               | Servidor de desenvolvimento (http://localhost:3000) |
| `npm test`                  | Testes unitários (Vitest, uma vez)                  |
| `npm run test:watch`        | Vitest em modo observação                           |
| `npm run lint`              | ESLint                                              |
| `npm run typecheck`         | Gera tipos de rota do Next + `tsc --noEmit`         |
| `npm run format`            | Prettier (corrige)                                  |
| `npm run format:check`      | Prettier (só confere — o CI usa este)               |
| `npm run verificar`         | lint + typecheck + testes (rode antes de cada PR)   |
| `npm run build`             | Build de produção (preferir deixar para o CI)       |
| `npm run test:e2e`          | Playwright (roda no CI; precisa de build antes)     |
| `npm run sincronizar-guias` | Copia CLAUDE.md para AGENTS.md e GEMINI.md          |

## Estrutura de pastas

```
src/
  app/                    Rotas (App Router). layout.tsx tem o aviso fixo de estimativa.
  components/             ui.tsx (botões, cartões, avisos), campos.tsx (formulários acessíveis),
                          calculo.tsx (semáforo, cenário, parcelas), ListaVerificacao, navegação
  config/
    regras-mcmv.ts        TODAS as regras/valores do MCMV, com data de referência e fonte
  lib/
    financiamento/        Funções PURAS de cálculo (sem dados da família) + testes ao lado
      basico.ts           idade, prazo pela idade, faixa, seguro MIP, subsídio, meses p/ juntar
      sistemas.ts         SAC/Price: valor financiável, 1ª parcela, evolução, parcela de empréstimo
      capacidade.ts       calcularCenario(): preço máximo + impedimentos + avisos de um grupo
      orcamento.ts        avaliarImovel() (cor/falta/renda necessária), custo compra, repasse
    dominio/              Dados da família (o que é salvo) e ponte para o motor
      esquemas.ts         Esquemas Zod + tipos de TUDO que é salvo (EstadoFamilia)
      cenarios.ts         pessoa→proponente na data, gerarCenarios(), melhorCenario(), mudanças futuras
      dados-iniciais.ts   Dados de exemplo (seed) carregados no 1º uso — editáveis no app
    armazenamento/        loja.ts (localStorage + histórico, via useSyncExternalStore), hooks.ts
    datas.ts              Datas "AAAA-MM-DD" sem erro de fuso
    formatar.ts           Formatação de moeda etc.
e2e/                      Testes Playwright (só CI), incluindo acessibilidade com axe
supabase/migrations/      SQL versionado: tabelas + funções + policies RLS (idempotente)
supabase/testes/          Testes de RLS rodados no CI (Postgres + auth simulado)
docs/
  PROGRESSO.md            Estado do projeto — atualizar ao fim de cada fase
  SUPABASE.md             Passo a passo para criar o projeto Supabase
  GEMINI.md               Passo a passo da chave do Gemini (opcional)
  VERCEL.md               Passo a passo para publicar na Vercel
  PROMPT-ORIGINAL.md      Pedido completo do projeto
.github/workflows/ci.yml  CI: lint, format, typecheck, unitários, build, E2E, RLS, site estático
.github/workflows/windows.yml  Gera o instalador .exe (Tauri) e publica numa Release
src-tauri/                App de Windows (Tauri 2) — só compila no GitHub Actions
```

## Regras de negócio (resumo — os valores ficam em `src/config/regras-mcmv.ts`)

- Faixas MCMV urbano (renda familiar bruta mensal): F1 ≤ R$ 3.200; F2 ≤ R$ 5.000; F3 ≤ R$ 9.600;
  F4 ≤ R$ 13.000. Renda exatamente no limite pertence à faixa.
- Subsídio: teto R$ 55.000 (F1 e F2), estimativa decrescente com a renda — fórmula isolada e
  configurável.
- Teto do imóvel F1/F2: ~R$ 275.000 (configurável por localidade).
- Juros por faixa configuráveis.
- **Idade do proponente mais velho + prazo ≤ 80 anos e 6 meses**; prazo máximo 420 meses.
- Parcela ≤ **30%** da renda bruta, já descontando outros compromissos mensais.
- Seguro MIP por faixa etária (% sobre saldo) + taxa de administração: descontados da parcela
  disponível.
- SAC (1ª parcela é a maior e limita) e Price — SAC financia menos.
- CPF negativado ⇒ proponente não aprovável. Sem renda comprovada ⇒ não pode ser titular sozinho.
- FGTS compõe entrada se tiver 3+ anos de contribuição.

## Onde está cada funcionalidade

| Funcionalidade                         | Local                                                                                                | Fase |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------- | ---- |
| Motor de cálculo (pronto)              | `src/lib/financiamento/`, `src/config/`, `src/lib/dominio/`                                          | 1    |
| F1 Nossa situação (pronto)             | `src/app/situacao/*`, `src/components/situacao/`                                                     | 2    |
| F2 Diagnóstico (pronto)                | `src/app/diagnostico`, `src/lib/dominio/diagnostico.ts`                                              | 2    |
| F3 Simulador (pronto)                  | `src/app/simulador`, `src/components/calculo.tsx`                                                    | 2    |
| F11 Repasse / F12 Empréstimo (pronto)  | `src/app/repasse`, `src/app/emprestimo`                                                              | 2    |
| Armazenamento local (localStorage)     | `src/lib/armazenamento/loja.ts` + `hooks.ts`                                                         | 2    |
| F9 Login, família, RLS (código pronto) | `src/app/entrar`, `src/app/familia`, `src/lib/supabase/`, `supabase/migrations/`, `supabase/testes/` | 3    |
| F4 Busca guiada (pronto)               | `src/app/busca`, `src/lib/busca/links.ts`                                                            | 4    |
| F5 Imóveis salvos (pronto)             | `src/app/imoveis`, `src/components/imoveis/`, `src/lib/dominio/imoveis.ts`                           | 4    |
| F6 Mapa (pronto)                       | `src/app/mapa`, `src/components/mapa/`, `src/lib/geo/`, `src/app/api/geocodificar`                   | 4    |
| F8 Checklists (pronto)                 | `src/app/guias`, `src/lib/dominio/checklists.ts`                                                     | 5    |
| F10 Tela inicial / PWA (pronto)        | `src/app/page.tsx`, `src/app/manifest.ts`, `public/sw.js`, `src/components/Pwa.tsx`                  | 5    |
| F7 Gemini (código pronto)              | `src/lib/ia/`, `src/app/api/ia/`, `src/components/ia/Ia.tsx`                                         | 6    |
| App de Windows (pronto)                | `src-tauri/`, `.github/workflows/windows.yml`                                                        | 8    |

(Atualize esta tabela sempre que criar uma funcionalidade.)

## Fluxo Git (obrigatório)

1. `main` sempre estável. Nunca commitar direto nela.
2. Uma branch por tarefa: `feat/f1-perfil`, `fix/...`, `chore/...`.
3. Commits pequenos, **Conventional Commits em português**: `feat(simulador): calcula prazo máximo
pela idade`.
4. Antes do PR: `npm run verificar` (e `npm run format`).
5. `gh pr create` com o que mudou e como testar → esperar CI verde → `gh pr merge --squash
--delete-branch`.
6. Ao fim de cada fase: atualizar `docs/PROGRESSO.md` e a tabela acima.
7. Nunca commitar segredos.
8. **Sem atribuição de IA**: nunca escrever "Co-Authored-By: Claude", "Generated with Claude Code"
   ou equivalente (de qualquer IA) em commits, PRs ou código. O dono do repositório não quer IA
   listada como colaboradora. (`.claude/settings.json` já desliga a atribuição do Claude Code.)
9. O `gh` desta máquina fica em `%LOCALAPPDATA%\Programs\gh\bin\gh.exe` (fora do PATH).
10. Modo de trabalho combinado: executar as fases em sequência sem pedir confirmação entre elas;
    parar só para ações que exigem contas do dono (Supabase, Gemini, Vercel).

## Convenções de código

- Código, nomes e comentários em português quando falam do domínio (ex.: `calcularPrazoMaximo`).
- Lógica financeira só em funções puras, testadas com Vitest. Componentes não fazem conta.
- Simples e bem nomeado; sem abstrações desnecessárias.
- Interface: botões e fontes grandes, alto contraste, `label` em todo campo, foco visível, estados de
  carregando/vazio/erro em toda tela.
