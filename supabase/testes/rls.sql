-- Testes de segurança (RLS). Rodam no CI depois das migrations. Qualquer falha interrompe.
-- Usuários: A (cria família FA), B (convidado de A), C (outra família).
\set ON_ERROR_STOP on

insert into auth.users values
  ('00000000-0000-0000-0000-00000000000a', 'a@exemplo.com'),
  ('00000000-0000-0000-0000-00000000000b', 'b@exemplo.com'),
  ('00000000-0000-0000-0000-00000000000c', 'c@exemplo.com');

-- ---------- A cria a família ----------
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false),
       set_config('request.jwt.claims', '{"email":"a@exemplo.com"}', false);
select public.criar_familia('Família A', '{"versao":1,"pessoas":[]}'::jsonb);

do $$ begin
  if (select count(*) from public.familias) <> 1 then raise exception 'FALHA: A deveria ver 1 família'; end if;
  if (select papel from public.membros where usuario_id = auth.uid()) <> 'dono' then raise exception 'FALHA: A deveria ser dono'; end if;
end $$;

-- A não pode criar uma segunda família
do $$ begin
  perform public.criar_familia('Outra', '{}'::jsonb);
  raise exception 'FALHA: A criou duas famílias';
exception when others then
  if sqlerrm like 'FALHA%' then raise; end if;
end $$;

-- A convida B
insert into public.convites (familia_id, email, criado_por)
values (public.minha_familia(), 'b@exemplo.com', auth.uid());

-- ---------- B, antes de aceitar ----------
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false),
       set_config('request.jwt.claims', '{"email":"b@exemplo.com"}', false);

do $$
declare n integer;
begin
  if (select count(*) from public.familias) <> 0 then raise exception 'FALHA: B viu família sem ser membro'; end if;
  if (select count(*) from public.membros) <> 0 then raise exception 'FALHA: B viu membros sem ser membro'; end if;
  if (select count(*) from public.convites) <> 1 then raise exception 'FALHA: B deveria ver o convite para o seu e-mail'; end if;
  update public.familias set dados = '{"invadido":true}'::jsonb;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FALHA: B alterou família alheia'; end if;
end $$;

do $$ begin
  perform public.salvar_dados('{"invadido":true}'::jsonb, 1);
  raise exception 'FALHA: B salvou dados sem família';
exception when others then
  if sqlerrm like 'FALHA%' then raise; end if;
end $$;

-- B não consegue se convidar para outra família nem criar convite para a família de A
do $$ begin
  insert into public.convites (familia_id, email, criado_por)
  select familia_id, 'c@exemplo.com', auth.uid() from public.convites limit 1;
  raise exception 'FALHA: B criou convite para família alheia';
exception when others then
  if sqlerrm like 'FALHA%' then raise; end if;
end $$;

-- ---------- C não vê o convite de B ----------
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000c', false),
       set_config('request.jwt.claims', '{"email":"c@exemplo.com"}', false);
do $$ begin
  if (select count(*) from public.convites) <> 0 then raise exception 'FALHA: C viu convite de outra pessoa'; end if;
end $$;
do $$ begin
  perform public.aceitar_convite((select id from public.convites limit 1));
  raise exception 'FALHA: C aceitou convite alheio';
exception when others then
  if sqlerrm like 'FALHA%' then raise; end if;
end $$;

-- ---------- B aceita o convite ----------
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false),
       set_config('request.jwt.claims', '{"email":"b@exemplo.com"}', false);
select public.aceitar_convite((select id from public.convites limit 1));
do $$ begin
  if (select count(*) from public.familias) <> 1 then raise exception 'FALHA: B deveria ver a família depois de aceitar'; end if;
  if (select count(*) from public.membros) <> 2 then raise exception 'FALHA: B deveria ver 2 membros'; end if;
end $$;

-- ---------- Controle de versão ----------
do $$
declare v integer;
begin
  v := public.salvar_dados('{"versao":1,"de":"B"}'::jsonb, 1);
  if v <> 2 then raise exception 'FALHA: versão deveria ser 2, veio %', v; end if;
end $$;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false),
       set_config('request.jwt.claims', '{"email":"a@exemplo.com"}', false);
do $$ begin
  perform public.salvar_dados('{"de":"A"}'::jsonb, 1);
  raise exception 'FALHA: salvou com versão desatualizada';
exception when others then
  if sqlerrm like 'FALHA%' then raise; end if;
  if sqlerrm <> 'conflito' then raise exception 'FALHA: erro inesperado: %', sqlerrm; end if;
end $$;

-- ---------- C cria a própria família e não vê a de A ----------
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000c', false),
       set_config('request.jwt.claims', '{"email":"c@exemplo.com"}', false);
select public.criar_familia('Família C', '{}'::jsonb);
do $$ begin
  if (select count(*) from public.familias) <> 1 then raise exception 'FALHA: C deveria ver só a própria família'; end if;
  if (select nome from public.familias) <> 'Família C' then raise exception 'FALHA: C viu a família errada'; end if;
end $$;

-- ---------- B (membro) não remove ninguém; A (dono) pode remover B ----------
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false),
       set_config('request.jwt.claims', '{"email":"b@exemplo.com"}', false);
do $$
declare n integer;
begin
  delete from public.membros where usuario_id = '00000000-0000-0000-0000-00000000000a';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FALHA: membro comum removeu o dono'; end if;
end $$;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false),
       set_config('request.jwt.claims', '{"email":"a@exemplo.com"}', false);
do $$
declare n integer;
begin
  delete from public.membros where usuario_id = '00000000-0000-0000-0000-00000000000b';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FALHA: dono deveria remover membro'; end if;
end $$;

-- ---------- Cache de geocodificação: fechado para usuários ----------
do $$ begin
  insert into public.cache_geocodificacao (consulta, lat, lon) values ('x', 1, 1);
  raise exception 'FALHA: usuário gravou no cache';
exception when others then
  if sqlerrm like 'FALHA%' then raise; end if;
end $$;

-- ---------- Visitante sem login (anon) não vê nada nem executa funções ----------
reset role;
set role anon;
select set_config('request.jwt.claim.sub', '', false), set_config('request.jwt.claims', '{}', false);
do $$ begin
  if (select count(*) from public.familias) <> 0 then raise exception 'FALHA: anônimo viu famílias'; end if;
  if (select count(*) from public.membros) <> 0 then raise exception 'FALHA: anônimo viu membros'; end if;
end $$;
do $$ begin
  perform public.criar_familia('Anon', '{}'::jsonb);
  raise exception 'FALHA: anônimo criou família';
exception when others then
  if sqlerrm like 'FALHA%' then raise; end if;
end $$;

reset role;
select 'RLS: todos os testes passaram' as resultado;
