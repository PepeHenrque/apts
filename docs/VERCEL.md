# Passo a passo: colocar o app no ar (Vercel, gratuito)

Depois disto o app terá um endereço como `https://apts-xxxx.vercel.app`, que a família abre no
celular e pode "instalar". A cada merge na `main`, a Vercel publica a versão nova sozinha.

Tempo: uns 10 minutos. Custo: zero (plano Hobby).

## 1. Criar a conta

1. Acesse **https://vercel.com/signup**.
2. Escolha **Hobby** (uso pessoal) e entre com **Continue with GitHub** (conta `PepeHenrque`).
3. Autorize a Vercel a ver os repositórios (pode escolher só o `apts`).

## 2. Importar o projeto

1. No painel da Vercel: **Add New… → Project**.
2. Na lista, ache **`PepeHenrque/apts`** e clique em **Import**.
3. **Framework Preset:** Next.js (já vem detectado). Não mude Build/Output/Install.
4. **Antes de clicar em Deploy**, abra **Environment Variables** (passo 3 abaixo).

## 3. Variáveis de ambiente

Adicione uma por uma (**Key** e **Value**), deixando marcados Production, Preview e Development:

| Key                             | Value                                                 | Obrigatória?          |
| ------------------------------- | ----------------------------------------------------- | --------------------- |
| `NOMINATIM_USER_AGENT`          | `apts-app/1.0 (+https://apts-xxxx.vercel.app)`        | Recomendada (mapa)    |
| `NEXT_PUBLIC_SUPABASE_URL`      | Project URL do Supabase (`docs/SUPABASE.md`, passo 4) | Para login/família    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable/anon key do Supabase                      | Para login/família    |
| `SUPABASE_SERVICE_ROLE_KEY`     | Secret/service_role key do Supabase                   | Opcional (cache mapa) |
| `GEMINI_API_KEY`                | Chave do Google AI Studio (`docs/GEMINI.md`)          | Opcional (IA)         |

Sem nenhuma variável o app já funciona (dados só no aparelho, sem IA). Dá para adicionar
depois: **Settings → Environment Variables** e, em seguida, **Deployments → ⋯ → Redeploy**.

> Nunca coloque `NEXT_PUBLIC_` na frente de `SUPABASE_SERVICE_ROLE_KEY` ou `GEMINI_API_KEY`.

## 4. Publicar

1. Clique em **Deploy** e espere (2 a 4 minutos).
2. Clique em **Continue to Dashboard** → copie o endereço em **Domains**
   (ex.: `apts-xxxx.vercel.app`).
3. Se usou um endereço provisório no `NOMINATIM_USER_AGENT`, corrija agora e faça **Redeploy**.

## 5. Ajustar o Supabase com o endereço final

Supabase → **Authentication → URL Configuration**:

- **Site URL:** `https://apts-xxxx.vercel.app`
- **Redirect URLs:** confirme que tem `https://apts-xxxx.vercel.app/**`

## 6. Testar no celular

1. Abra o endereço no Chrome (Android) ou Safari (iPhone).
2. Confira a tela inicial, Situação e Simulador.
3. Instale: Mais → **Instalar o app** (ou menu do navegador → "Adicionar à tela inicial").
4. Se configurou o Supabase: Mais → **Família e login** → entre e crie a família.

## Dicas

- **Nome melhor:** Settings → Domains → Edit → por exemplo `nossacasa-apts.vercel.app` (se
  estiver livre). Depois atualize o Supabase (passo 5).
- **Prévia de mudanças:** cada Pull Request ganha um endereço de prévia automático.
- **Algo quebrou?** Deployments → abra o último → **Build Logs**. Para voltar à versão anterior:
  no deployment antigo → ⋯ → **Promote to Production**.
