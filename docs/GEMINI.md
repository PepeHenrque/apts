# Passo a passo: ligar a IA (Google Gemini, nível gratuito) — opcional

Com a chave, aparecem dois botões:

- **"✨ Preencher com IA"** no cadastro de imóvel: lê o texto colado do anúncio e preenche os campos
  (você sempre revisa antes de salvar).
- **"✨ Explicar minha situação"** no Diagnóstico: um resumo em linguagem simples.

Sem a chave, os botões simplesmente não aparecem e o app funciona igual (o botão "Preencher a
partir do texto", sem IA, continua lá).

## Privacidade (importante)

No nível gratuito, o Google pode usar o que é enviado para melhorar os produtos dele. Por isso o
app envia **somente**:

- o **texto do anúncio** (e ainda apaga do texto qualquer coisa parecida com CPF ou e-mail);
- no "Explicar", **só números e categorias** ("Pessoa 1, 61 anos, renda R$ 1.950, nome
  negativado") — **nunca** nomes, CPF, credores ou valores de dívidas. O servidor recusa dados
  com nomes.

## 1. Criar a chave

1. Acesse **https://aistudio.google.com** e entre com uma conta Google.
2. Aceite os termos, se pedir.
3. Clique em **Get API key** (menu da esquerda) → **Create API key**.
4. Se pedir um projeto, deixe o Google criar um (**Create API key in new project**).
5. Copie a chave (começa com `AIza...`). **Não compartilhe** essa chave com ninguém.

Não é preciso cadastrar cartão. Sem cartão, a conta fica no nível gratuito (com limites por
minuto e por dia — quando passar do limite, o app avisa "Limite diário da IA atingido, preencha
manualmente").

## 2. Colocar a chave na Vercel

1. Vercel → seu projeto → **Settings → Environment Variables**.
2. Adicione:
   - **Key:** `GEMINI_API_KEY` — **Value:** a chave copiada. Marque Production, Preview e
     Development.
   - (Opcional) **Key:** `GEMINI_MODELO` — **Value:** `gemini-flash-latest` (é o padrão; troque só
     se o Google mudar os nomes dos modelos).
3. **Não** use `NEXT_PUBLIC_` no nome: a chave fica só no servidor.
4. Vá em **Deployments** → no último → **⋯ → Redeploy**.

## 3. Testar

Abra o app → Imóveis → **+ Adicionar imóvel** → cole o texto de um anúncio → **✨ Preencher com IA**.

No computador (opcional): ponha `GEMINI_API_KEY=...` no `.env.local` e rode `npm run dev`.

## Se a chave vazar

No AI Studio → **Get API key** → apague a chave antiga e crie outra; atualize na Vercel e faça
Redeploy.
