# Prompt para o Claude Code — App "apts" (busca de imóvel + financiamento Caixa / MCMV)

> Cole tudo abaixo no Claude Code (VS Code), com o repositório `PepeHenrque/apts` aberto.
> Modelo recomendado: **Opus 5.5, esforço alto**. Peça **uma fase por vez** (ex.: "execute a Fase 1").

---

## 1. Contexto

Você vai construir, do zero, uma aplicação web completa no repositório `PepeHenrque/apts`. https://github.com/PepeHenrque/apts

A aplicação é para uma família que quer comprar um apartamento/casa financiado pela Caixa (Minha Casa Minha Vida — MCMV). Situação real:

- Pai: ~61 anos, única renda da casa (~R$ 1.950/mês), **CPF negativado** (está tentando limpar o nome).
- Mãe: ~61 anos, desempregada, CPF limpo.
- Filha (Danielle): jovem aprendiz, contrato perto do fim.
- Já tiveram ~5 financiamentos negados por falta de crédito (ex.: apto 2 quartos de R$ 140 mil).
- Hoje procuram imóveis manualmente em OLX, Facebook e sites diversos.

**Importante:** a situação acima é só o **ponto de partida** (use como dados de exemplo/seed). **Nada disso pode ficar fixo no código.** Tudo — pessoas, rendas, empregos, nomes sujos, recusas, preferências de imóvel, localização, repasse, empréstimo — deve ser **editável pela própria família dentro do app**, e todos os cálculos, diagnósticos e filtros devem se recalcular na hora quando algo muda. A situação vai mudar (alguém limpa o nome, arruma emprego, junta entrada) e o app tem que acompanhar.

O objetivo do app **não** é só listar imóveis: é mostrar **quanto a família consegue financiar de verdade**, **o que está bloqueando a aprovação**, **qual cenário de comprador funciona** e organizar a busca só dentro do que cabe no orçamento.

O público é leigo e vai usar principalmente **pelo celular**. Toda a interface em **português do Brasil**, linguagem simples, sem jargão (ou com explicação do jargão).

## 2. Restrições importantes

- O notebook do desenvolvedor é **fraco**. Evite tudo que seja pesado localmente: nada de Docker, nada de banco local, nada de Playwright rodando local. Testes pesados/E2E rodam no **GitHub Actions**. Localmente, só `npm run dev`, `npm test` (unitários) e `npm run lint`.
- Hospedagem e serviços **gratuitos**: Vercel (deploy), Supabase (banco + auth, plano free), OpenStreetMap (mapa/geocodificação), Gemini API (nível gratuito, opcional).
- **Proibido** fazer scraping de OLX, Facebook, Zap, VivaReal etc. (viola os termos e quebra fácil). A busca é por **links de busca pré-filtrados** + **cadastro manual/colado** de anúncios.
- **Nunca** expor chaves no frontend. A chave do Gemini e a service key do Supabase ficam só em variáveis de ambiente do servidor (Vercel). Crie `.env.example` sem valores reais e garanta `.env*` no `.gitignore`.
- Todos os valores de simulação são **estimativas**. A interface deve deixar claro em todas as telas de cálculo: "Estimativa — o valor final é definido pela Caixa".

## 3. Stack

- **Next.js (App Router) + TypeScript (strict) + Tailwind CSS**
- **Supabase** (Postgres + Auth por link mágico no e-mail, com Row Level Security)
- **Leaflet + tiles do OpenStreetMap** para mapa; **Nominatim** para geocodificar endereços (respeitar limite de 1 req/s e enviar User-Agent identificável; cachear resultados no banco)
- Distância: linha reta (Haversine) calculada no app + botão "ver rota no Google Maps" (link)
- **Vitest** para testes unitários; **Playwright** só no CI (GitHub Actions)
- **Zod** para validar formulários e dados
- PWA simples (manifest + ícone) para "instalar" no celular

## 4. Regras de negócio (deixe TUDO em um arquivo de configuração, ex. `src/config/regras-mcmv.ts`, com data de referência e fonte em comentário)

Valores de referência 2026 (confirme e documente; devem ser fáceis de atualizar sem mexer na lógica):

- Faixas MCMV urbano por renda familiar bruta mensal: Faixa 1 até R$ 3.200; Faixa 2 até R$ 5.000; Faixa 3 até R$ 9.600; Faixa 4 até R$ 13.000.
- Subsídio: até R$ 55.000 (Faixas 1 e 2; varia por cidade, renda e imóvel — tratar como **teto**, e calcular estimativa decrescente com a renda; deixar a fórmula isolada e configurável).
- Teto de valor do imóvel Faixas 1 e 2: até ~R$ 275.000 (varia por localidade — configurável).
- Juros por faixa: valores configuráveis (ex.: Faixa 1 ~4–4,5% a.a.; Faixa 2 ~4,75–7%; Faixa 3 ~7,66–8,16%; Faixa 4 ~10%).
- **Regra da idade**: idade do proponente **mais velho** + prazo ≤ **80 anos e 6 meses**. Prazo máximo geral: 420 meses.
- Comprometimento máximo de renda: **30%** da renda bruta com a parcela.
- Seguro MIP (morte e invalidez) cresce com a idade: modelar como percentual configurável sobre o saldo, por faixa etária, e **descontar da parcela disponível**. Taxa de administração também configurável.
- Calcular nos dois sistemas: **SAC** (primeira parcela é a maior — é a que limita) e **Price**.
- CPF negativado: proponente **não aprovável** enquanto negativado (bloqueio).
- Sem renda comprovada: proponente **não pode** ser o titular sozinho.
- FGTS pode compor entrada (considerar regra de 3 anos de trabalho sob FGTS — perguntar no formulário).

## 5. Funcionalidades

### F1 — Contexto da família (tudo editável, a qualquer momento)
Uma área "Nossa situação" com abas, onde tudo pode ser adicionado, editado e removido:

**Pessoas** (adicionar/remover quantas quiser):
- Nome, data de nascimento (idade calculada), vai morar no imóvel (sim/não), pode ser comprador (sim/não).
- **Emprego e renda atual**: situação (CLT, aposentado/pensionista, MEI, autônomo informal, jovem aprendiz, estágio, desempregado), empresa/ocupação, salário bruto, data de início, data prevista de fim (ex.: fim do contrato de aprendiz → o app avisa e recalcula o cenário a partir dessa data).
- **Nome sujo**: CPF limpo/negativado; se negativado, lista de dívidas (credor, valor, status: em aberto / negociando / acordo / pago, data do pagamento). Quando todas estiverem pagas, o app mostra "aguardando atualização do score" e depois considera a pessoa aprovável.
- FGTS: saldo e se tem 3+ anos de contribuição.
- Outros compromissos mensais (empréstimos, cartão, consignado) — reduzem a parcela possível.
- Já tem imóvel no nome (sim/não) — afeta MCMV.

**Histórico de recusas** (adicionar quantas quiser):
- Data, banco/canal (agência, correspondente, feirão, construtora), imóvel (link/valor/endereço), quem estava como comprador, **causa informada** (lista: restrição no CPF, renda insuficiente, falta de entrada, idade/prazo, imóvel não aceito, documentação, não informada, outra + texto), observações.
- Contador de recusas e gráfico simples de causas mais frequentes. O diagnóstico (F2) usa esse histórico.

**Dinheiro disponível**: entrada em dinheiro, quanto conseguem guardar por mês (o app estima em quantos meses chegam na entrada que falta), outros recursos.

**Preferências de imóvel** (usadas em F3, F4 e F5):
- Tipo: apartamento, casa, casa em condomínio, sobrado, terreno, qualquer.
- Novo / usado / na planta / tanto faz.
- Quartos mínimos, banheiros, vaga, área mínima, aceita térreo/escada (importante para idosos), condomínio máximo.
- Localização: endereço atual (ponto de referência), cidades/bairros desejados (lista), **distância máxima** da casa atual (km), pontos importantes opcionais (trabalho, posto de saúde, parente) com distância de cada imóvel até eles.
- Aceita **repasse**? (sim / não / talvez) — ver F11.
- Considera **empréstimo** para a entrada? (sim / não / talvez) — ver F12.

Tudo salvo no Supabase, compartilhado pela família, com histórico de alterações ("Mãe mudou salário em 14/11").

### F2 — Diagnóstico ("Por que estão negando?")
- Usa o contexto atual **e o histórico de recusas** (ex.: "4 das 5 recusas foram por restrição no CPF").
- Analisa o perfil e lista **bloqueios** em ordem de gravidade, cada um com explicação simples e **o que fazer**:
  - CPF negativado → links Serasa Limpa Nome / Desenrola, explicação de que o score demora a subir depois de pagar.
  - Sem renda comprovada → opções (CLT, MEI, aposentadoria).
  - Idade → prazo curto, parcela maior; explicar que o mais velho define o prazo.
  - Entrada insuficiente para os imóveis que estão procurando.
- Mostrar um "semáforo" geral: **Pronto para pedir crédito / Quase / Ainda não**.

### F3 — Simulador de cenários de comprador
- Gera automaticamente cenários a partir do perfil, ex.:
  - A) Pai sozinho (se limpar o nome)
  - B) Mãe titular (se tiver renda)
  - C) Pai + mãe (composição de renda)
  - D) Danielle sozinha (se tiver emprego CLT) — prazo longo
  - E) Danielle + pai (mostrar que o prazo cai pela idade do mais velho)
- Para cada cenário: faixa MCMV, prazo máximo, parcela máxima, valor financiável (SAC e Price), subsídio estimado, FGTS, entrada → **PREÇO MÁXIMO DE IMÓVEL**.
- Campos editáveis "e se…" (ex.: e se a Danielle ganhar R$ 1.800 CLT?).
- Destacar o melhor cenário viável e marcar os inviáveis com o motivo.
- Tabela de evolução das parcelas (primeiros meses e total pago).

### F4 — Busca guiada
- Gera **links de busca pré-filtrados** (preço máximo do melhor cenário, quartos, cidade/bairro) para: OLX, Zap Imóveis, VivaReal, Imóveis Caixa (venda de imóveis da Caixa) e Facebook Marketplace (quando possível por URL).
- Lista de bairros/cidades vizinhas configurável pela família, com distância da casa atual.

### F5 — Imóveis salvos
- Adicionar imóvel colando link e/ou texto do anúncio. Campos: título, link, preço, quartos, banheiros, vaga, área, endereço/bairro, condomínio, IPTU, aceita financiamento (sim/não/não sei), observações, fotos (só link), status (interessado, visitado, proposta, descartado, negado pela Caixa).
- Para cada imóvel, mostrar automaticamente:
  - **Cabe no orçamento?** verde / amarelo (até +10%) / vermelho — comparando com o melhor cenário.
  - Entrada necessária estimada e parcela estimada.
  - **Distância da casa atual** (km em linha reta) + link de rota.
- Filtros e ordenação (preço, distância, status).
- Histórico: quem adicionou / quando.

### F6 — Mapa
- Mapa com a casa atual e todos os imóveis salvos, com cor por "cabe no orçamento". Clique abre o card do imóvel.

### F7 — Leitura de anúncio com IA (Gemini, opcional)
- Botão "Preencher com IA": a pessoa cola o texto do anúncio (ex. do Facebook) e o servidor (rota API do Next) chama o Gemini (nível gratuito) para extrair os campos em JSON validado por Zod. Usuário revisa antes de salvar.
- Se não houver chave configurada, o botão some (o app funciona 100% sem IA).
- Rate limit simples por usuário e tratamento do erro de cota do nível gratuito ("limite diário da IA atingido, preencha manualmente").
- **Privacidade**: no nível gratuito o Google pode usar os dados enviados. Mandar para o Gemini **somente o texto do anúncio** — nunca nomes, CPF, rendas ou dívidas da família.
- Opcional: botão "Explicar minha situação" que manda ao Gemini só números anonimizados (idades, rendas, bloqueios) e devolve um resumo em linguagem simples.

### F8 — Checklists e guias
- Documentos para a Caixa (por tipo de renda).
- O que conferir no imóvel antes de fechar (matrícula, se aceita financiamento, regularização, débitos de condomínio/IPTU).
- Passo a passo para limpar o nome.
- Caminho da Faixa 1 pela prefeitura: CadÚnico, inscrição em programas municipais/estaduais (inclusive programas para idosos), com campo para a família anotar o que já fez.
- Checkboxes salvos e compartilhados.

### F9 — Acesso e compartilhamento
- Login por **link mágico no e-mail** (Supabase Auth), sem senha.
- Conceito de "família": o primeiro usuário cria a família e convida os outros por e-mail. Todos os dados são da família.
- **RLS** no Supabase: cada usuário só lê/escreve dados da própria família. Escreva as policies em migrations SQL versionadas (`supabase/migrations/`).

### F11 — Repasse
- Explicar em linguagem simples o que é repasse (assumir o financiamento de outra pessoa / comprar imóvel ainda financiado pagando o "ágio"), e os riscos: **"contrato de gaveta" sem transferência no banco é arriscado**; o caminho seguro é a transferência formal do financiamento, que exige aprovação de crédito do novo comprador (ou seja, nome sujo também bloqueia aqui).
- Simulador de repasse: valor do ágio pedido, saldo devedor, parcela atual, parcelas restantes → custo total vs. comprar outro imóvel financiado.
- Imóveis salvos (F5) podem ser marcados como "repasse", com campos próprios (ágio, saldo devedor, parcela, banco).
- Checklist de segurança do repasse.

### F12 — Empréstimo para a entrada
- Simulador: valor, taxa mensal, número de parcelas → parcela do empréstimo.
- Mostra o **efeito no financiamento**: a parcela do empréstimo reduz a renda disponível, então o preço máximo de imóvel cai. Mostrar o antes e o depois lado a lado.
- Alertas claros: empréstimo com nome sujo costuma ter juros muito altos; consignado de aposentado tem limite; comparar com "guardar X por mês por N meses" (do F1).
- Não recomendar nenhuma instituição específica; deixar claro que não é aconselhamento financeiro.

### F10 — Qualidade de uso
- Mobile-first, fontes grandes, botões grandes, alto contraste, acessível (labels, foco visível).
- Estados de carregamento, vazio e erro em todas as telas.
- Tela inicial com resumo: semáforo do diagnóstico, preço máximo atual, nº de imóveis salvos que cabem no orçamento, próximo passo sugerido.
- Aviso fixo discreto: "Simulações são estimativas. Não é aconselhamento financeiro. Confirme com a Caixa ou um correspondente bancário."

## 6. Fluxo de trabalho Git (obrigatório)

- Branch `main` sempre estável e com deploy.
- Uma branch por funcionalidade: `feat/f1-perfil`, `feat/f3-simulador`, `fix/...`, `chore/...`.
- Commits pequenos, mensagens no padrão **Conventional Commits** em português (ex.: `feat(simulador): calcula prazo máximo pela idade`).
- Antes de cada merge: `npm run lint`, `npm run typecheck`, `npm test` passando.
- Abrir **Pull Request** com `gh pr create` (descrição do que mudou e como testar), esperar o CI verde e fazer merge (`gh pr merge --squash`). Apagar a branch depois.
- GitHub Actions: workflow de CI com lint, typecheck, testes unitários, build e Playwright (E2E básico).
- Nunca commitar segredos.

## 7. Testes (prioridade máxima na lógica financeira)

- Toda a lógica de cálculo fica em funções puras em `src/lib/financiamento/` e tem testes Vitest com casos reais, incluindo:
  - Pessoa de 61 anos → prazo máximo correto (meses).
  - Composição pai (61) + filha (18) → prazo pelo mais velho.
  - Renda R$ 1.950 → parcela máxima 30% e enquadramento Faixa 1.
  - SAC vs Price → valor financiável diferente, SAC menor.
  - CPF negativado → cenário marcado inviável com motivo.
  - Imóvel de R$ 140.000 com o perfil atual → mostra quanto falta.
  - Limites de faixa (renda exatamente no limite).
- Testes de validação Zod dos formulários.
- E2E (só no CI): criar perfil → ver diagnóstico → salvar imóvel → ver cor do orçamento.

## 8. Fases de entrega (faça uma por vez e me mostre o resultado)

- **Fase 0 — Setup**: Next.js + TS + Tailwind + Vitest + ESLint/Prettier, estrutura de pastas, CI no GitHub Actions, README com como rodar, `.env.example`. PR + merge.
- **Fase 1 — Motor de cálculo**: `regras-mcmv.ts` + funções de financiamento + testes completos. Sem UI ainda. PR + merge.
- **Fase 2 — Contexto editável completo, diagnóstico e simulador (F1, F2, F3, F11, F12)** funcionando com dados salvos localmente (localStorage) para eu testar sem contas. PR + merge.
- **Fase 3 — Supabase + login + família (F9)**: migrations, RLS, migração do localStorage para o banco. Me diga **exatamente** o passo a passo para criar o projeto no Supabase e quais variáveis colocar na Vercel. PR + merge.
- **Fase 4 — Imóveis salvos, busca guiada e mapa (F4, F5, F6)**. PR + merge.
- **Fase 5 — Checklists, tela inicial, PWA (F8, F10)**. PR + merge.
- **Fase 6 — Gemini (F7)**. Passo a passo para pegar a chave gratuita no Google AI Studio. PR + merge.
- **Fase 7 — Deploy final na Vercel** e revisão geral: acessibilidade, celular, textos, segurança (RLS, segredos, validação no servidor).

Ao final de cada fase: rode lint, typecheck e testes, mostre o resultado, faça o PR/merge e me diga **o que testar** e **qual o próximo passo**.

## 9. Continuidade (o projeto pode ser continuado por outra IA)

O desenvolvedor terá acesso ao Claude por tempo limitado e depois pode continuar com o **Gemini** (Gemini CLI ou Gemini Code Assist no VS Code). Por isso:

- Mantenha `CLAUDE.md` **e** um `AGENTS.md`/`GEMINI.md` com o mesmo conteúdo: stack, estrutura de pastas, regras de negócio, fluxo Git, comandos, e onde cada funcionalidade está.
- Mantenha um `docs/PROGRESSO.md` atualizado ao fim de cada fase: o que está pronto, o que falta, decisões tomadas e próximos passos detalhados — de forma que qualquer pessoa ou IA consiga continuar sem este chat.
- Copie este prompt para `docs/PROMPT-ORIGINAL.md`.
- Código simples e bem nomeado, sem abstrações desnecessárias.

## 10. Ao começar

1. Leia este prompt inteiro e o estado atual do repositório.
2. Crie `CLAUDE.md`, `AGENTS.md`, `docs/PROGRESSO.md` e `docs/PROMPT-ORIGINAL.md` conforme a seção 9.
3. Me mostre um plano curto da **Fase 0** e execute.
4. Se algo deste prompt estiver ambíguo ou conflitante, pergunte antes de decidir algo difícil de desfazer.
