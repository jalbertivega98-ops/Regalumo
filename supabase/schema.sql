-- Esquema de REGALUMO en Supabase (Postgres). Ejecutar en el editor SQL del proyecto.
-- El servidor usa la service role key; RLS activado sin políticas = el navegador no puede leer nada.

create table if not exists public.documents (
  collection text not null,
  id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (collection, id)
);
create index if not exists documents_collection_updated on public.documents (collection, updated_at desc);
alter table public.documents enable row level security;

create table if not exists public.counters (
  key text primary key,
  value bigint not null default 0
);
alter table public.counters enable row level security;

-- Incremento atómico (límites de uso y analítica agregada).
create or replace function public.increment_counter(p_key text, p_by bigint default 1)
returns bigint
language sql
security definer
set search_path = public
as $$
  insert into public.counters (key, value) values (p_key, p_by)
  on conflict (key) do update set value = public.counters.value + excluded.value
  returning value;
$$;
revoke all on function public.increment_counter(text, bigint) from public, anon, authenticated;

-- Permisos explícitos para el servidor (algunos proyectos nuevos de Supabase no los conceden solos).
grant usage on schema public to service_role;
grant select, insert, update, delete on public.documents, public.counters to service_role;
grant execute on function public.increment_counter(text, bigint) to service_role;

-- Limpieza de contadores de límites antiguos (opcional, ejecutar periódicamente).
-- delete from public.counters where key like 'rl:%' and substring(key from 4 for 10) < to_char(now() - interval '7 days', 'YYYY-MM-DD');

-- Almacenamiento privado de fotos y PDFs.
insert into storage.buckets (id, name, public, file_size_limit)
values ('private', 'private', false, 20971520)
on conflict (id) do nothing;
