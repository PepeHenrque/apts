# Passo a passo: ligar o Supabase (login e dados compartilhados da família)

Sem o Supabase o app funciona normalmente, mas os dados ficam só em cada aparelho. Com ele, a
família entra com o e-mail (sem senha) e todos veem e editam os mesmos dados.

Tempo: uns 15 minutos. Custo: zero (plano Free).

## 1. Criar a conta e o projeto

1. Acesse **https://supabase.com** e clique em **Start your project**.
2. Entre com a sua conta do **GitHub** (botão "Continue with GitHub").
3. Clique em **New project**.
   - **Name:** `apts`
   - **Database Password:** clique em **Generate a password** e **guarde essa senha** num lugar
     seguro (não vai para o app, mas pode ser útil um dia).
   - **Region:** **South America (São Paulo)**.
   - **Plan:** Free.
4. Clique em **Create new project** e espere uns 2 minutos até terminar.

## 2. Criar as tabelas e a segurança (RLS)

1. No menu da esquerda, abra **SQL Editor**.
2. Clique em **New query**.
3. Abra no GitHub o arquivo
   `supabase/migrations/20261114000000_inicial.sql`, clique em **Raw**, copie tudo
   (Ctrl+A, Ctrl+C) e cole no editor do Supabase.
4. Clique em **Run** (canto inferior direito). Deve aparecer **"Success. No rows returned"**.

Pode rodar de novo sem problema (o arquivo foi feito para isso). Esse mesmo arquivo é testado
automaticamente no GitHub a cada mudança (job "Banco" do CI), incluindo os testes de segurança.

## 3. Configurar o login por e-mail

1. Menu **Authentication** → **Sign In / Providers** (ou **Providers**) → **Email**:
   deixe **Enable Email provider** ligado. Pode deixar "Confirm email" ligado.
2. Menu **Authentication** → **URL Configuration**:
   - **Site URL:** o endereço do app na Vercel, por exemplo `https://apts-xxxx.vercel.app`
     (se ainda não tiver, ponha `http://localhost:3000` e troque depois do passo do Vercel).
   - **Redirect URLs** → **Add URL**, adicione as duas:
     - `http://localhost:3000/**`
     - `https://SEU-APP.vercel.app/**`
3. Menu **Authentication** → **Emails** (ou **Email Templates**) → **Magic Link**:
   no campo do corpo do e-mail, **acrescente** esta linha (para o código de 6 dígitos funcionar
   no app instalado e no app de Windows):

   ```html
   <p>Ou digite este código no app: <strong>{{ .Token }}</strong></p>
   ```

   Clique em **Save**.

> **Limite de e-mails:** o envio de e-mail embutido do Supabase é limitado (poucos e-mails por
> hora). Para uma família costuma bastar. Se os links pararem de chegar, espere uma hora ou
> configure um SMTP gratuito em **Authentication → Emails → SMTP Settings**.

## 4. Copiar as chaves

Menu **Project Settings** (engrenagem) → **API Keys** (em alguns painéis, **API**):

| O que copiar                                                | Nome da variável                |
| ----------------------------------------------------------- | ------------------------------- |
| **Project URL** (em Project Settings → Data API, ou na API) | `NEXT_PUBLIC_SUPABASE_URL`      |
| **Publishable key** (`sb_publishable_...`) ou **anon**      | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| **Secret key** (`sb_secret_...`) ou **service_role**        | `SUPABASE_SERVICE_ROLE_KEY`     |

⚠️ A **secret/service_role** ignora toda a segurança: **nunca** coloque em lugar público, nunca
com `NEXT_PUBLIC_` na frente, e nunca no app de Windows. Ela só vai na Vercel.

## 5. Testar no computador (opcional)

Na pasta do projeto, crie o arquivo `.env.local` (ele não vai para o GitHub):

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxxx
SUPABASE_SERVICE_ROLE_KEY=sb_secret_xxxx
```

Rode `npm run dev`, abra http://localhost:3000/familia → **Entrar com e-mail**.

## 6. Colocar as variáveis na Vercel

Veja `docs/VERCEL.md` (passo 4). Resumo — em **Settings → Environment Variables**:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Depois faça **Redeploy**.

## 7. Usar com a família

1. Quem tem os dados mais completos abre o app → **Mais → Família e login** → **Entrar com
   e-mail** → toca no link do e-mail (ou digita o código).
2. **Criar família**: os dados daquele aparelho vão para a nuvem.
3. Em **Convidar alguém**, digite o e-mail de cada pessoa e toque em **Avisar pelo WhatsApp**.
4. A pessoa convidada entra com aquele e-mail e toca em **Entrar na família**.

A partir daí, toda mudança aparece para todos (em tempo real) e o histórico mostra quem mudou o quê.

## Observações

- Projetos gratuitos do Supabase **pausam depois de 7 dias sem uso**. Se o app disser "sem
  conexão com a nuvem", entre no painel do Supabase e clique em **Restore project**. Os dados do
  aparelho continuam lá enquanto isso.
- Se duas pessoas salvarem ao mesmo tempo, o app carrega a versão mais nova e avisa para conferir
  a última alteração.
