# Progresso do projeto "apts"

> Atualize este arquivo ao fim de cada fase. Ele deve bastar para qualquer pessoa ou IA continuar o
> trabalho sem o histórico do chat. Pedido completo: `docs/PROMPT-ORIGINAL.md`.

Última atualização: 14/11/2026 — Fase 8 concluída; todas as fases com código pronto.

## Ordem de execução combinada com o dono (14/11/2026)

O dono pediu para executar tudo em sequência, sem parar entre fases, fazendo primeiro o que não
depende de contas externas:

| Ordem | Fase | Conteúdo                                                                     | Situação                                         |
| ----- | ---- | ---------------------------------------------------------------------------- | ------------------------------------------------ |
| 1     | 0    | Setup: Next.js, TS, Tailwind, Vitest, ESLint/Prettier, CI, docs              | Concluída                                        |
| 2     | 1    | Motor de cálculo (`regras-mcmv.ts` + funções + testes)                       | Concluída                                        |
| 3     | 2    | F1, F2, F3, F11, F12 com localStorage                                        | Concluída                                        |
| 4     | 4    | F4 busca guiada, F5 imóveis salvos, F6 mapa (localStorage)                   | Concluída                                        |
| 5     | 5    | F8 checklists, F10 tela inicial, PWA instalável (Windows e celular)          | Concluída                                        |
| 6     | 3    | Supabase + login + família + RLS (F9) — código pronto + passo a passo        | Código pronto; aguarda o dono (docs/SUPABASE.md) |
| 7     | 6    | Gemini (F7) — código pronto + passo a passo da chave                         | Não iniciada                                     |
| 8     | 7    | Deploy Vercel + revisão geral — passo a passo                                | Não iniciada                                     |
| 9     | 8    | Executável Windows (Tauri) gerado no GitHub Actions e publicado numa Release | Concluída                                        |

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

## Fase 5 — Checklists, tela inicial e PWA (pronto)

- `src/lib/dominio/checklists.ts`: documentos (gerais + por tipo de renda de cada comprador),
  conferir o imóvel, limpar o nome, caminho da Faixa 1 pela prefeitura (com anotações; inclui a
  reserva de 3% para idosos do Estatuto da Pessoa Idosa), segurança do repasse. Tela `/guias`.
- Tela inicial: semáforo, preço máximo (hoje e depois de limpar o nome), imóveis que cabem,
  recusas, próximo passo sugerido, data de atenção e atalhos.
- PWA: `src/app/manifest.ts`, ícones gerados por `scripts/gerar-icones.mjs` (sem dependências) em
  `public/icones/` + `src/app/icon.png` e `apple-icon.png`, service worker `public/sw.js` (rede
  primeiro, cache offline; registrado só em produção e fora do app de Windows), botão
  "Instalar no aparelho" + instruções (Android, iPhone, Windows) em `/mais`.
- `src/app/error.tsx` e `not-found.tsx`; cabeçalhos de segurança em `next.config.ts`.
- `EXPORTAR_ESTATICO=1` já gera `output: "export"` (para o app de Windows).

## Fase 3 — Supabase, login e família (código pronto; falta o dono criar o projeto)

- **Passo a passo para o dono: `docs/SUPABASE.md`.** Sem as variáveis, o app segue em modo
  "só neste aparelho" (testado no E2E).
- Banco: `supabase/migrations/20261114000000_inicial.sql` — `familias` (documento `dados` jsonb +
  `versao`), `membros` (dono/membro, 1 família por usuário), `convites` (por e-mail),
  `cache_geocodificacao` (só service key). Funções `criar_familia`, `aceitar_convite`,
  `salvar_dados` (erro "conflito" se a versão estiver desatualizada), `sair_da_familia`. RLS em
  todas as tabelas; Realtime ligado em `familias`. Migration idempotente.
- **Testes de RLS no CI** (job "Banco"): Postgres 16 + simulação do `auth` do Supabase
  (`supabase/testes/auth-simulado.sql`) + `supabase/testes/rls.sql` (isolamento entre famílias,
  convites, versão/conflito, anônimo sem acesso, cache fechado).
- App: `src/lib/supabase/cliente.ts` (navegador, chave pública, fluxo "implicit" para o link
  funcionar em outro aparelho), `servidor.ts` (service key, só em rotas de API),
  `sincronizacao.ts` (sessão, carregar família, enviar com debounce de 800 ms, conflito,
  tempo real, reenvio ao voltar a internet). Telas `/entrar` (link mágico **ou código de 6
  dígitos** — necessário no PWA e no app de Windows) e `/familia` (criar, convites com aviso por
  WhatsApp, membros, sair). Ao criar a família, os dados do aparelho sobem (migração do
  localStorage); ao aceitar convite, os dados locais são trocados pelos da família (cópia em
  `apts:estado:v1:antes-de-entrar`).
- Geocodificação usa também o cache do banco quando `SUPABASE_SERVICE_ROLE_KEY` existe.

## Fase 6 — Gemini (código pronto; falta o dono criar a chave)

- **Passo a passo para o dono: `docs/GEMINI.md`.** Sem `GEMINI_API_KEY`, os botões de IA não
  aparecem (testado no E2E).
- `src/lib/ia/gemini.ts`: chamada REST ao `generateContent` (sem SDK), modelo em `GEMINI_MODELO`
  (padrão `gemini-flash-latest`), erro de cota (429) tratado, limpeza de CPF/e-mail do texto.
- `src/lib/ia/anuncio.ts`: prompt, `responseSchema` e validação Zod tolerante (campo inválido é
  descartado, não quebra). `src/lib/ia/anonimizar.ts`: situação SEM nomes ("Pessoa 1"), validada
  também no servidor (rejeita rótulos que não sejam "Pessoa N").
- Rotas: `/api/ia/status`, `/api/ia/anuncio`, `/api/ia/explicar` — limite por IP em memória
  (`src/lib/ia/limitador.ts`), CORS só para as origens do app de Windows (`src/lib/api.ts`).
- Interface: `src/components/ia/Ia.tsx` (`BotaoPreencherIA` no formulário de imóvel e
  `ExplicarSituacao` no Diagnóstico).

## Fase 7 — Deploy e revisão geral (código pronto; falta o dono publicar)

- **Passo a passo para o dono: `docs/VERCEL.md`** (conta Hobby, importar o repositório,
  variáveis, ajustar URL no Supabase, instalar no celular).
- README reescrito com tudo o que o app faz e links para os passos a passo.
- Revisão de segurança:
  - nenhum segredo versionado (`.env*` ignorado, só `.env.example`); `SUPABASE_SERVICE_ROLE_KEY`
    só em `src/lib/supabase/servidor.ts` (lança erro se usado no navegador) e rotas de API;
    `GEMINI_API_KEY` só em `src/lib/ia/gemini.ts`;
  - entradas das rotas de API validadas com Zod; limite por IP nas rotas de IA;
  - RLS testado no CI (job "Banco");
  - links digitados por usuários só viram link se forem http(s) (`src/lib/seguranca.ts`);
  - cabeçalhos de segurança (`nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`,
    `Permissions-Policy`). CSP não foi ativada (o Next usa scripts inline; avaliar com nonce no
    futuro).
- Revisão de acessibilidade: teste automático com axe (WCAG 2/2.1 A e AA) em 14 telas
  (`e2e/acessibilidade.spec.ts`), além de rótulos em todos os campos, foco visível, alvos de toque
  ≥ 48 px, fonte base 18 px, cor nunca como única informação.

## Fase 8 — App de Windows (Tauri)

- `src-tauri/`: projeto Tauri 2 mínimo (janela que abre o site estático `out/`, sem comandos
  nativos, permissões `core:default`), instalador NSIS em português, só para o usuário atual.
  Ícones gerados no CI a partir de `public/icones/icone-512.png` (não versionados).
- Site estático: `EXPORTAR_ESTATICO=1` (`output: "export"`, `trailingSlash: true`) +
  `NEXT_PUBLIC_DESKTOP=1` (geocodificação direto no Nominatim, sem service worker, sem botão
  instalar PWA). As rotas `src/app/api` são removidas antes do build estático.
- CI: job "Site estático do app de Windows" confere a exportação em todo PR.
- `.github/workflows/windows.yml` (runner `windows-latest`): Node + Rust + `tauri-action`, publica
  `apts_<versão>_x64-setup.exe` na Release `v<versão>` (versão vem do `package.json`). Dispara
  manualmente (Actions → App Windows → Run workflow) ou por tag `v*`.
- Login no app de Windows: pelo **código** do e-mail (o link mágico abriria no navegador).
  Variáveis opcionais do repositório: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `NEXT_PUBLIC_URL_API` (rotas de IA da Vercel, com CORS liberado para as origens do Tauri).
- O instalador não é assinado → o SmartScreen avisa (instruções no README e na Release).

## Decisões tomadas

- **Juros nominais ÷ 12** para a taxa mensal (como a Caixa divulga).
- **Preço máximo "oficial" usa SAC** (mais conservador); Price aparece como alternativa.
- **Renda familiar** (define faixa e subsídio) = renda de todos que vão morar, comprovada ou não.
  **Renda para a parcela** = só renda comprovada dos compradores do cenário.
- Quem já tem imóvel no nome → cenário calculado "fora do MCMV" (juros maiores, sem subsídio).
- `cacheComponents` DESLIGADO (as telas são componentes de cliente; facilita a exportação estática do app de Windows).
- `@types/node` 24 (Vitest 5 exige ≥ 22); fonte do sistema (sem Google Fonts).
- Build e E2E não rodam localmente (notebook fraco) — o CI faz.
- Dados da família = 1 documento JSON por família (simples; o formato é validado pelo Zod no app). Concorrência: versão otimista; em conflito, vale a versão do banco e o usuário é avisado.
- Convites não enviam e-mail próprio (exigiria service key/SMTP): a pessoa é avisada pelo WhatsApp e entra com o e-mail convidado.

## Próximos passos (dependem do dono)

1. Publicar na Vercel — `docs/VERCEL.md`.
2. (Opcional) Supabase para login e dados da família — `docs/SUPABASE.md`.
3. (Opcional) Chave do Gemini — `docs/GEMINI.md`.
4. Conferir com a Caixa/correspondente os valores marcados "A CONFIRMAR" em
   `src/config/regras-mcmv.ts` (juros por faixa, teto F1/F2 na cidade, cota de financiamento,
   seguro MIP, subsídio) e ajustar lá.

## Ideias para depois

- Tabela de MIP real da seguradora e seguro DFI (danos ao imóvel) no cálculo da parcela.
- Teto do imóvel por cidade (lista de municípios) em vez de um valor único.
- Notificações no PWA (ex.: quando o score já deve ter atualizado).
- Assinatura digital do instalador de Windows (remove o aviso do SmartScreen; certificado pago).
- CSP com nonce.
