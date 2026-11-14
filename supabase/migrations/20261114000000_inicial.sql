-- =====================================================================
-- apts — estrutura inicial do banco (Supabase / Postgres)
--
-- Modelo simples: cada FAMÍLIA tem um documento JSON (`dados`) com tudo o que o app guarda
-- (pessoas, recusas, dinheiro, preferências, imóveis, checklists, histórico). O formato do
-- documento é validado no app (src/lib/dominio/esquemas.ts).
--
-- Segurança (RLS): cada usuário só enxerga e altera a própria família.
-- Como aplicar: Supabase → SQL Editor → cole este arquivo inteiro → Run.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------

create table if not exists public.familias (
  id uuid primary key default gen_random_uuid(),
  nome text not null default 'Nossa família' check (char_length(nome) between 1 and 80),
  dados jsonb not null default '{}'::jsonb,
  versao integer not null default 0,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid references auth.users (id) on delete set null
);

create table if not exists public.membros (
  familia_id uuid not null references public.familias (id) on delete cascade,
  usuario_id uuid not null references auth.users (id) on delete cascade,
  email text not null,
  papel text not null default 'membro' check (papel in ('dono', 'membro')),
  criado_em timestamptz not null default now(),
  primary key (familia_id, usuario_id)
);

-- Para manter simples: cada pessoa participa de uma família só.
create unique index if not exists membros_um_por_usuario on public.membros (usuario_id);

create table if not exists public.convites (
  id uuid primary key default gen_random_uuid(),
  familia_id uuid not null references public.familias (id) on delete cascade,
  email text not null check (position('@' in email) > 1),
  criado_por uuid not null references auth.users (id) on delete cascade,
  criado_em timestamptz not null default now(),
  unique (familia_id, email)
);

-- Cache de endereços → coordenadas (usado só pelo servidor, com a service key).
create table if not exists public.cache_geocodificacao (
  consulta text primary key,
  lat double precision,
  lon double precision,
  criado_em timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Funções auxiliares
-- ---------------------------------------------------------------------

-- Família do usuário logado (null se não tiver). SECURITY DEFINER evita recursão nas policies.
create or replace function public.minha_familia()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.familia_id from public.membros m where m.usuario_id = auth.uid() limit 1;
$$;

-- O usuário logado é dono da família? (SECURITY DEFINER para usar dentro das policies de membros.)
create or replace function public.sou_dono()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.membros m where m.usuario_id = auth.uid() and m.papel = 'dono'
  );
$$;

create or replace function public.meu_email()
returns text
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

-- Cria uma família com o usuário como dono e os dados atuais do aparelho.
create or replace function public.criar_familia(nome_familia text, dados_iniciais jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  nova uuid;
begin
  if auth.uid() is null then
    raise exception 'Faça login primeiro.';
  end if;
  if public.minha_familia() is not null then
    raise exception 'Você já participa de uma família.';
  end if;
  insert into public.familias (nome, dados, versao, atualizado_por)
  values (coalesce(nullif(trim(nome_familia), ''), 'Nossa família'), coalesce(dados_iniciais, '{}'::jsonb), 1, auth.uid())
  returning id into nova;
  insert into public.membros (familia_id, usuario_id, email, papel)
  values (nova, auth.uid(), public.meu_email(), 'dono');
  return nova;
end;
$$;

-- Aceita um convite feito para o e-mail do usuário logado.
create or replace function public.aceitar_convite(convite uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  fam uuid;
begin
  if auth.uid() is null then
    raise exception 'Faça login primeiro.';
  end if;
  if public.minha_familia() is not null then
    raise exception 'Você já participa de uma família.';
  end if;
  select c.familia_id into fam
  from public.convites c
  where c.id = convite and lower(c.email) = public.meu_email();
  if fam is null then
    raise exception 'Convite não encontrado para este e-mail.';
  end if;
  insert into public.membros (familia_id, usuario_id, email, papel)
  values (fam, auth.uid(), public.meu_email(), 'membro');
  delete from public.convites where id = convite;
  return fam;
end;
$$;

-- Salva os dados da família se ninguém salvou antes (controle de versão).
-- Retorna a nova versão; erro "conflito" se a versão esperada estiver desatualizada.
create or replace function public.salvar_dados(novos_dados jsonb, versao_esperada integer)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  nova_versao integer;
begin
  if pg_column_size(novos_dados) > 5000000 then
    raise exception 'Dados grandes demais.';
  end if;
  update public.familias f
  set dados = novos_dados,
      versao = f.versao + 1,
      atualizado_em = now(),
      atualizado_por = auth.uid()
  where f.id = public.minha_familia() and f.versao = versao_esperada
  returning f.versao into nova_versao;
  if nova_versao is null then
    raise exception 'conflito';
  end if;
  return nova_versao;
end;
$$;

-- Sai da família (o dono só sai se for o último membro; aí a família é apagada).
create or replace function public.sair_da_familia()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  fam uuid := public.minha_familia();
  restantes integer;
begin
  if fam is null then
    return;
  end if;
  delete from public.membros where familia_id = fam and usuario_id = auth.uid();
  select count(*) into restantes from public.membros where familia_id = fam;
  if restantes = 0 then
    delete from public.familias where id = fam;
  elsif not exists (select 1 from public.membros where familia_id = fam and papel = 'dono') then
    update public.membros set papel = 'dono'
    where familia_id = fam
      and usuario_id = (select usuario_id from public.membros where familia_id = fam order by criado_em limit 1);
  end if;
end;
$$;

revoke all on function public.criar_familia(text, jsonb) from public, anon;
revoke all on function public.aceitar_convite(uuid) from public, anon;
revoke all on function public.salvar_dados(jsonb, integer) from public, anon;
revoke all on function public.sair_da_familia() from public, anon;
grant execute on function public.criar_familia(text, jsonb) to authenticated;
grant execute on function public.aceitar_convite(uuid) to authenticated;
grant execute on function public.salvar_dados(jsonb, integer) to authenticated;
grant execute on function public.sair_da_familia() to authenticated;
grant execute on function public.minha_familia() to authenticated;
grant execute on function public.meu_email() to authenticated;
grant execute on function public.sou_dono() to authenticated;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------

alter table public.familias enable row level security;
alter table public.membros enable row level security;
alter table public.convites enable row level security;
alter table public.cache_geocodificacao enable row level security;

-- Famílias: ver e renomear só a própria. Criar/salvar dados só pelas funções acima.
drop policy if exists "ver a propria familia" on public.familias;
create policy "ver a propria familia" on public.familias
  for select to authenticated using (id = public.minha_familia());

drop policy if exists "renomear a propria familia" on public.familias;
create policy "renomear a propria familia" on public.familias
  for update to authenticated using (id = public.minha_familia()) with check (id = public.minha_familia());

-- Membros: ver os da própria família; o dono pode remover outros membros.
drop policy if exists "ver membros da familia" on public.membros;
create policy "ver membros da familia" on public.membros
  for select to authenticated using (familia_id = public.minha_familia());

drop policy if exists "dono remove membro" on public.membros;
create policy "dono remove membro" on public.membros
  for delete to authenticated using (
    familia_id = public.minha_familia() and public.sou_dono() and usuario_id <> auth.uid()
  );

-- Convites: a família vê e cria os seus; a pessoa convidada vê os convites para o seu e-mail.
drop policy if exists "ver convites" on public.convites;
create policy "ver convites" on public.convites
  for select to authenticated using (
    familia_id = public.minha_familia() or lower(email) = public.meu_email()
  );

drop policy if exists "criar convite" on public.convites;
create policy "criar convite" on public.convites
  for insert to authenticated with check (
    familia_id = public.minha_familia() and criado_por = auth.uid()
  );

drop policy if exists "cancelar convite" on public.convites;
create policy "cancelar convite" on public.convites
  for delete to authenticated using (familia_id = public.minha_familia());

-- cache_geocodificacao: sem policies → só a service key (servidor) acessa.

-- ---------------------------------------------------------------------
-- Tempo real: avisa os outros aparelhos da família quando os dados mudam.
-- ---------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'familias'
     ) then
    alter publication supabase_realtime add table public.familias;
  end if;
end;
$$;
