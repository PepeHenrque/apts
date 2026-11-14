# Prompt — apts, etapa 2: visual, automação e manutenção

> Cole tudo abaixo no Claude Code (VS Code), com o repositório `PepeHenrque/apts` aberto.
> Modelo: **Opus 5.5, esforço alto**.

---

## Contexto

O app `apts` já existe e está publicado na Vercel. As fases 0 a 8 do prompt original (`docs/PROMPT-ORIGINAL.md`) estão prontas: motor de cálculo, situação da família, diagnóstico, simulador, repasse, empréstimo, imóveis salvos, busca guiada, mapa, checklists, PWA, código do Supabase e do Gemini, e o .exe do Windows. Leia `docs/PROGRESSO.md`, `CLAUDE.md` e o código antes de começar.

Agora o objetivo é:

1. Refazer o visual: ele precisa parecer um produto profissional, **sem cara de app feito por IA**.
2. Explicar o app para quem usa pela primeira vez.
3. Deixar o app o **mais automático possível**.
4. Deixar a **manutenção fácil** para mim, que sou o administrador e não quero mexer em código por meses.

Tudo usando **só serviços gratuitos**: Vercel Hobby, Supabase Free, GitHub Actions, Gemini API no nível gratuito (`gemini-3.5-flash`) e Web Push. Nada pago, nenhuma assinatura.

## Regras gerais

- Execute **todas as etapas em sequência, sem parar entre elas**. Uma branch e um PR por etapa. Antes do merge: lint, typecheck e testes passando, e CI verde. Merge com squash. Atualize `docs/PROGRESSO.md` ao fim de cada etapa.
- Só pare se precisar de algo que só eu posso fazer (criar conta, gerar chave). Nesses casos, deixe o código pronto, siga para a próxima etapa e junte tudo numa lista no final.
- Se um CI falhar, investigue e corrija sozinho.
- **Sem atribuição**: nada de "Co-Authored-By: Claude", "Generated with Claude Code" ou parecido em commits, PRs ou código.
- **Proibido** fazer scraping de OLX, Facebook, Zap, VivaReal ou de qualquer site que não permita.
- **Nunca** mande dados pessoais da família (nomes, CPF, renda, dívidas) para o Gemini.
- Meu notebook é fraco: nada pesado localmente. E2E, screenshots e builds rodam no GitHub Actions.

---

## ETAPA 1 — Visual profissional, sem cara de IA

### O que eliminar

- **Todos os emojis**, da interface e dos textos (botões, títulos, toasts, checklists, estados vazios).
- Tudo que denuncia "feito por IA": degradês roxo/azul, ícones de brilho ou estrela mágica, glassmorphism, sombras coloridas, cards com borda colorida à esquerda em toda parte, excesso de badges, títulos com "✨", textos como "Desbloqueie", "Potencialize", "Sua jornada", "Vamos lá!", excesso de exclamações, e frases genéricas de marketing.
- Ícones decorativos em todo título. Use ícone só onde ajuda a entender ou a clicar.

### Direção visual

- Referência de tom: apps de imóveis e bancos brasileiros sérios (QuintoAndar, Nubank, app da Caixa), mais sóbrio que divertido. **Não copie** marca, logotipo ou cores registradas de nenhum deles.
- Fundo claro e neutro (branco ou cinza muito claro), texto quase preto, uma **única cor principal** sóbria (por exemplo, um azul-petróleo ou um verde-escuro) usada em botões principais e links. Verde, amarelo e vermelho **só** para o status do orçamento e para alertas.
- Fonte Inter, via `next/font`. Hierarquia clara: um título por tela, subtítulos discretos e números importantes em destaque (preço máximo, parcela).
- Ícones: `lucide-react`, mesmo tamanho e mesma espessura de traço em todo o app.
- Bordas finas cinza, raio pequeno (6–8px), sombras quase imperceptíveis. Muito espaço em branco.
- Números em formato brasileiro (`R$ 140.000,00`, `12,5 km`), com algarismos alinhados (`tabular-nums`) em tabelas.
- Textos curtos, diretos, em português simples, na voz de quem explica para os pais. Exemplo: em vez de "Desbloqueie seu potencial de compra!", use "Até quanto vocês podem pagar".

### Layout

- **Desktop**: o layout atual está apertado e com zoom grande demais. Use um container central com largura máxima de ~1100–1200px e margens laterais, navegação em barra lateral fixa à esquerda (ou barra superior) e grids de 2–3 colunas para cards. O simulador fica com o formulário à esquerda e os resultados fixos à direita. Fonte base de 15–16px e componentes compactos.
- **Celular**: barra inferior de navegação, fonte base de 17–18px, botões grandes (mínimo de 44px de altura), confortável para pessoas de 61 anos.
- Espaçamento consistente entre seções (escala de 4/8px) e paddings padronizados.

### Design system

- Tokens no Tailwind: cores, tipografia, espaçamentos, raios e sombras.
- Componentes base reutilizáveis: Button, Input, Select, Card, Badge (status), Tabs, Dialog, Toast, EmptyState e PageHeader. Aplique em **todas** as telas.

### Verificação

- Screenshots do Playwright (no CI) em 390px, 768px e 1440px de todas as telas principais, **antes e depois**, salvos como artefato do CI. Me diga onde ver.
- Acessibilidade (axe) continua sem erros e o contraste segue o WCAG AA.

---

## ETAPA 2 — Explicação para os primeiros usos

- **Tour guiado** no primeiro acesso, com 5 a 7 passos destacando cada área (Situação, Diagnóstico, Simulador, Busca, Imóveis, Checklists), cada um com uma frase simples. Botões "Próximo", "Voltar", "Pular" e "Não mostrar de novo". O tour segue o design system, sem emojis.
- Botão de ajuda fixo (ícone de interrogação) para rever o tour a qualquer momento.
- Página **"Como usar"** com um passo a passo, do cadastro da situação até salvar um imóvel.
- No topo de cada tela, um texto curto de ajuda que dá para recolher, e que lembra se foi recolhido.
- Estados vazios explicativos. Exemplo: "Vocês ainda não salvaram nenhum imóvel. Toque em Adicionar ou compartilhe um anúncio para o app."

---

## ETAPA 3 — Busca automática: imóveis da Caixa

- Pesquise a lista pública de imóveis à venda da Caixa por estado (venda-imoveis.caixa.gov.br).
- Crie um **GitHub Action diário** que:
  - baixa a lista do(s) estado(s) configurado(s) no app;
  - normaliza os dados (preço, valor de avaliação, desconto, tipo, quartos, área, endereço, cidade, bairro, se aceita financiamento/FGTS, modalidade de venda e link oficial);
  - geocodifica com cache, respeitando o limite do Nominatim (1 requisição por segundo, User-Agent identificável);
  - salva no Supabase (ou num JSON versionado no repositório, enquanto o Supabase não estiver configurado);
  - marca os imóveis novos e os que saíram da lista.
- Aba **"Encontrados automaticamente"**, filtrada pelas preferências da família e pelo preço máximo do melhor cenário, com selo "Novo", distância da casa atual, se cabe no orçamento (verde/amarelo/vermelho) e botão "Salvar nos meus imóveis".
- Se existir outra fonte **pública e permitida** de imóveis (lista de imóveis de outros bancos, por exemplo), avalie e adicione do mesmo jeito.
- Se a lista da Caixa não puder ser baixada automaticamente, explique o motivo e implemente a melhor alternativa possível.
- Testes do parser com uma amostra real salva como fixture.

---

## ETAPA 4 — Notificações gratuitas (Web Push)

- Web Push no app instalado (PWA), com chaves VAPID e a biblioteca `web-push`.
- Avisos possíveis:
  - imóvel novo que cabe no orçamento;
  - contrato de trabalho perto do fim;
  - mudança relevante no diagnóstico (ex.: "Com a dívida paga, o pai volta a poder ser comprador");
  - alertas do administrador (ver Etapa 7).
- Cada pessoa liga e desliga cada tipo de aviso nas configurações.
- Gere as chaves VAPID e me diga onde colocar.

---

## ETAPA 5 — Compartilhar anúncio para o app

- **Web Share Target** no manifest do PWA: no celular, ao tocar em "Compartilhar" num anúncio da OLX, Facebook ou Zap e escolher o apts, abre a tela de novo imóvel com o link preenchido.
- Campo para colar o texto do anúncio e botão "Preencher automaticamente" (Gemini). O usuário revisa antes de salvar.
- Na busca guiada, um passo a passo de como ativar o alerta de e-mail da OLX e do Zap para as buscas já filtradas.

---

## ETAPA 6 — Gemini (nível gratuito)

- O modelo vem de configuração, com padrão `gemini-3.5-flash` e editável no painel do administrador (Etapa 7).
- **Não use** grounding nem busca do Google: não estão disponíveis no nível gratuito para esse modelo.
- Use o Gemini só para:
  1. extrair os campos de anúncios colados (JSON validado com Zod);
  2. explicar a situação em linguagem simples, com dados **anonimizados**;
  3. resumir os imóveis da Caixa que passaram no filtro.
- Cache das respostas, rate limit por usuário e erro 429 tratado com mensagem amigável ("Limite diário da IA atingido. Tente amanhã ou preencha manualmente.").
- O app funciona 100% sem a chave: os recursos de IA simplesmente somem.
- Nos textos da interface, não chame de "IA mágica" nem use ícone de brilho. Use "Preencher automaticamente".

---

## ETAPA 7 — Painel do administrador e manutenção fácil

Eu, o administrador, preciso manter o app funcionando por meses sem mexer em código nem na Vercel.

1. **Papel de administrador**: só o usuário definido em `ADMIN_EMAIL` (variável na Vercel) acessa `/admin`. A proteção é no servidor e por RLS, não só escondendo o botão.

2. **Chave do Gemini editável no app**:
   - campo para colar a chave nova, com os botões "Testar" (faz uma chamada mínima) e "Salvar";
   - a chave fica guardada **criptografada** no Supabase (AES-GCM, com o segredo `ENCRYPTION_SECRET` existindo só na Vercel);
   - o servidor usa a chave do banco; se não houver, usa a `GEMINI_API_KEY` da Vercel como reserva;
   - a chave nunca vai para o navegador e aparece só pelos 4 últimos caracteres;
   - as trocas ficam registradas (data e quem trocou);
   - o nome do modelo também é editável aqui.

3. **Saúde do sistema**: um card por serviço, com status verde/amarelo/vermelho e a data da última verificação:
   - Supabase;
   - robô da Caixa (última execução, sucesso ou erro, quantos imóveis);
   - Gemini (chave válida? cota estourada?);
   - Web Push.

   Inclua também um botão "Rodar busca da Caixa agora", que dispara o workflow pela API do GitHub com um token guardado como segredo no servidor.

4. **Alertas automáticos para mim** (Web Push e, se for simples e gratuito, e-mail):
   - chave do Gemini inválida ou vencida;
   - robô da Caixa falhou ou não roda há mais de 2 dias;
   - banco inacessível.

   Cada alerta traz um link direto para a correção.

5. **Nada pode parar sozinho**:
   - o workflow diário gera atividade no repositório (commit do JSON de status ou dos imóveis), para o GitHub não desativar workflows agendados por inatividade;
   - o mesmo job acessa o Supabase todo dia, para evitar a pausa do plano gratuito;
   - se mesmo assim algo for desativado, o painel mostra o aviso e o link para reativar.

6. **Página "Manutenção"**: guia em linguagem simples com "o que fazer se…" (chave venceu, robô parou, Supabase pausou, app fora do ar), com os passos e os links diretos.

7. **Testes**:
   - unitários da criptografia e do fallback da chave;
   - proteção da rota `/admin`: usuário comum recebe 403.

---

## ETAPA 8 — Fechamento

- Atualize as actions do CI para as versões que usam Node 24 (`checkout`, `setup-node` etc.).
- Rode tudo: lint, typecheck, testes unitários, E2E, acessibilidade e screenshots. Confirme o deploy da main na Vercel.
- Atualize `docs/PROGRESSO.md`, `CLAUDE.md`, `AGENTS.md` e `GEMINI.md`. Copie este prompt para `docs/PROMPT-ETAPA-2.md`.
- Me entregue, em português simples:
  1. **O que funciona sozinho** a partir de agora.
  2. **Lista numerada do que só eu preciso fazer**, com o caminho exato dos cliques e de onde copiar cada valor:
     - criar o projeto no Supabase e rodar as migrations;
     - chave do Gemini;
     - chaves VAPID;
     - `ENCRYPTION_SECRET`, `ADMIN_EMAIL` e o token do GitHub;
     - secrets do GitHub Actions;
     - Redeploy na Vercel.
  3. **O que testar**, no celular e no computador.
