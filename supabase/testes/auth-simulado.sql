-- Simula o mínimo do Supabase (papéis, auth.users, auth.uid(), auth.jwt()) num Postgres comum,
-- para testar as migrations e o RLS no CI (GitHub Actions). NÃO rode isto no Supabase de verdade.

create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;

create schema auth;
create table auth.users (id uuid primary key, email text);

create function auth.uid() returns uuid
language sql stable
as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

create function auth.jwt() returns jsonb
language sql stable
as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;

grant usage on schema public to anon, authenticated, service_role;
grant usage on schema auth to anon, authenticated, service_role;

-- O Supabase dá estes privilégios por padrão nas tabelas do schema public (o RLS é que protege).
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
