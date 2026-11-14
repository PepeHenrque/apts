# Progresso do projeto "apts"

> Atualize este arquivo ao fim de cada fase. Ele deve bastar para qualquer pessoa ou IA continuar o
> trabalho sem o histórico do chat. Pedido completo: `docs/PROMPT-ORIGINAL.md`.

Última atualização: 14/11/2026 — Fase 4 concluída.

## Ordem de execução combinada com o dono (14/11/2026)

O dono pediu para executar tudo em sequência, sem parar entre fases, fazendo primeiro o que não
depende de contas externas:

| Ordem | Fase | Conteúdo                                                                     | Situação     |
| ----- | ---- | ---------------------------------------------------------------------------- | ------------ |
| 1     | 0    | Setup: Next.js, TS, Tailwind, Vitest, ESLint/Prettier, CI, docs              | Concluída    |
| 2     | 1    | Motor de cálculo (`regras-mcmv.ts` + funções + testes)                       | Concluída    |
| 3     | 2    | F1, F2, F3, F11, F12 com localStorage                                        | Concluída    |
| 4     | 4    | F4 busca guiada, F5 imóveis salvos, F6 mapa (localStorage)                   | Concluída    |
| 5     | 5    | F8 checklists, F10 tela inicial, PWA instalável (Windows e celular)          | Não iniciada |
| 6     | 3    | Supabase + login + família + RLS (F9) — código pronto + passo a passo        | Não iniciada |
| 7     | 6    | Gemini (F7) — código pronto + passo a passo da chave                         | Não iniciada |
| 8     | 7    | Deploy Vercel + revisão geral — passo a passo                                | Não iniciada |
| 9     | 8    | Executável Windows (Tauri) gerado no GitHub Actions e publicado numa Release | Não iniciada |

Regras combinadas: se o CI falhar, investigar e corrigir; valores do MCMV em dúvida ficam
configuráveis e marcados "A CONFIRMAR"; **nunca** colocar atribuição de IA em commits/PRs/código.

## Fase 0 — Setup (pronto)

- Next.js 16.4 (App Router, `src/`), React 19.3, TypeScript strict + `noUncheckedIndexedAccess`.
- Tailwind 4 (via `@tailwindcss/turbopack`, sem `postcss.config`), CSS base mobile-first (fonte 18px,
  foco visível). Layout pt-BR com aviso fixo de estimativa (`src/components/AvisoEstimativa.tsx`).
- Vitest (ambiente Node, alias `@/`); Playwright só no CI (perfil Pixel 7), teste em `e2e/`.
- CI `.github/workflows/ci.yml`: job `qualidade` (lint, format:check, typecheck, unitários) e job
  `build-e2e` (build + Playwright Chromium).
- `.claude/settings.json`: libera npm/npx/git/gh e desliga atribuição do Claude Code.

## Fase 1 — Motor de cálculo (pronto)

- `src/config/regras-mcmv.ts`: todas as regras, com data de referência (22/04/2026) e fontes.
  Confirmado em fontes públicas: faixas de renda (Portaria MCID 333/2026), teto de subsídio
  R$ 55 mil, tetos F3 R$ 400 mil / F4 R$ 600 mil, regra 80 anos e 6 meses, prazo 420 meses.
  **A CONFIRMAR** (marcados no arquivo): juros exatos por faixa, teto F1/F2 (R$ 275 mil), cota
  de financiamento (80%), tabela do seguro MIP, taxa de administração (R$ 25), curva do subsídio,
  prazo mínimo (60 meses), dias para o score atualizar (30), aceitação de jovem aprendiz.
- `src/lib/financiamento/` (funções puras, sem dados da família):
  - `basico.ts`: idade, prazo pela idade do mais velho, faixa, MIP, subsídio, meses para juntar.
  - `sistemas.ts`: SAC/Price — valor financiável pela parcela, 1ª parcela, evolução, empréstimo.
  - `capacidade.ts`: `calcularCenario()` → preço máximo (SAC/Price), impedimentos e avisos.
    Preço máximo = menor entre (financiável + subsídio + FGTS + dinheiro), (recursos ÷ (1 − cota))
    e teto da faixa.
  - `orcamento.ts`: `avaliarImovel()` (cor verde/amarelo/vermelho, entrada que falta, parcela,
    renda necessária), custo total de compra, custo de repasse.
- `src/lib/dominio/`:
  - `esquemas.ts`: Zod de tudo que é salvo (`EstadoFamilia`: pessoas, recusas, dinheiro,
    preferências, imóveis, checklists, histórico). Campos novos devem ter `.default()`.
  - `cenarios.ts`: renda na data (contrato que termina zera a renda), situação do CPF (negativado →
    aguardando score → limpo), geração automática de cenários (cada pessoa, duplas, todos),
    melhor cenário, mudanças futuras.
  - `dados-iniciais.ts`: exemplo da família (pai 61 anos, R$ 1.950 CLT, negativado; mãe 61 sem
    renda; Danielle 19, jovem aprendiz R$ 950 até 31/01/2027; 1 recusa de R$ 140 mil).
- 66 testes Vitest cobrindo todos os casos da seção 7 do prompt.

## Fase 2 — Telas com localStorage (pronto)

- Armazenamento: `src/lib/armazenamento/loja.ts` guarda o `EstadoFamilia` no localStorage
  (chave `apts:estado:v1`), validado por Zod; dados inválidos são copiados para
  `apts:estado:v1:corrompido:<data>` e o exemplo é recarregado. Telas leem com
  `useEstadoFamilia()` (useSyncExternalStore, sincroniza entre abas). Toda alteração passa por
  `atualizarEstado(descricao, fn)`, que registra no histórico "quem" (nome salvo no aparelho,
  chave `apts:quem`) e quando. `definirSincronizador()` já existe para a Fase 3 (Supabase).
- Telas: `/` (resumo provisório), `/situacao` (pessoas com renda, CPF/dívidas, FGTS,
  compromissos, imóvel), `/situacao/recusas` (contador + gráfico de causas), `/situacao/dinheiro`
  (quanto falta e meses para juntar), `/situacao/preferencias`, `/situacao/historico`,
  `/diagnostico` (semáforo, bloqueios com o que fazer e links), `/simulador` (cenários, "e se…",
  data simulada, tabela SAC/Price), `/repasse` (explicação, simulador, checklist), `/emprestimo`
  (parcela, antes/depois, comparação com guardar), `/mais` (links, nome do usuário, cópia de
  segurança JSON), `/imoveis` (provisória).
- Diagnóstico em `src/lib/dominio/diagnostico.ts` (função pura, testada). Semáforo: "pronto" se
  há cenário viável sem alertas de gravidade ≥ 2; "quase" se há cenário viável com alertas, ou se
  o único impedimento é aguardar o score; senão "ainda não".
- E2E (CI): tela inicial; cadastrar pessoa → diagnóstico "pronto" → simulador → histórico.

## Fase 4 — Imóveis, busca guiada e mapa (pronto, localStorage)

- `src/lib/dominio/imoveis.ts`: `avaliarImovelSalvo()` (cor do orçamento contra o melhor cenário,
  ou o potencial se nenhum for aprovável; entrada, parcela, custo mensal com condomínio e IPTU,
  distâncias, alertas de preferência), `ordenarImoveis()`, `extrairDoTexto()` (lê preço, quartos,
  m², condomínio, IPTU e link de um anúncio colado — sem IA).
- `src/lib/busca/links.ts`: links pré-filtrados para OLX, Zap, VivaReal, Imóveis Caixa (sem filtro
  por link) e Facebook Marketplace. Os formatos dos sites podem mudar — ajustar aqui.
- `src/lib/geo/`: Haversine, link de rota do Google Maps, Nominatim (`nominatim.ts`),
  geocodificação no cliente com fila de 1,1 s e cache em localStorage (`geocodificar.ts`).
  `src/app/api/geocodificar/route.ts` chama o Nominatim no servidor com User-Agent
  (`NOMINATIM_USER_AGENT`), 1 pedido/s e cache em memória. No app de Windows (sem servidor) o
  cliente chama o Nominatim direto (`NEXT_PUBLIC_DESKTOP=1`).
- Telas: `/imoveis` (lista, filtros, ordenação, formulário com "colar anúncio", prévia da cor),
  `/busca` (links + bairros com distância), `/mapa` (Leaflet + OpenStreetMap, legenda, "localizar
  todos").
- E2E: salvar imóvel barato (verde) e caro (vermelho).

## Decisões tomadas

- **Juros nominais ÷ 12** para a taxa mensal (como a Caixa divulga).
- **Preço máximo "oficial" usa SAC** (mais conservador); Price aparece como alternativa.
- **Renda familiar** (define faixa e subsídio) = renda de todos que vão morar, comprovada ou não.
  **Renda para a parcela** = só renda comprovada dos compradores do cenário.
- Quem já tem imóvel no nome → cenário calculado "fora do MCMV" (juros maiores, sem subsídio).
- `cacheComponents` DESLIGADO (as telas são componentes de cliente; facilita a exportação estática do app de Windows).
- `@types/node` 24 (Vitest 5 exige ≥ 22); fonte do sistema (sem Google Fonts).
- Build e E2E não rodam localmente (notebook fraco) — o CI faz.

## Próximos passos (Fase 5 — checklists, tela inicial, PWA)

1. Branch `feat/f5-checklists-inicio-pwa`.
2. `/guias`: checklists (documentos por tipo de renda, conferir o imóvel, limpar o nome, caminho da
   Faixa 1 pela prefeitura com anotações) usando `ListaVerificacao` e `src/lib/dominio/checklists.ts`.
3. Tela inicial completa: semáforo, preço máximo, nº de imóveis que cabem, próximo passo.
4. PWA: `src/app/manifest.ts`, ícones PNG, service worker simples; instalável no Windows e celular.
5. Estados de carregando/vazio/erro revisados; `error.tsx` global.
