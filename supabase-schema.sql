-- ─────────────────────────────────────────────────────────────────────────────
--  ACTAS DE OBRA — Schema Supabase
--  Corre esto en: Supabase Dashboard → SQL Editor → New Query
-- ─────────────────────────────────────────────────────────────────────────────

-- Perfil del contratista (extiende auth.users de Supabase)
create table if not exists public.perfiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  nombre      text,
  nit         text,
  representante text,
  tel         text,
  direccion   text,
  ciudad      text,
  tipo        text default 'Obra civil',
  logo_url    text,
  aiu_admin   numeric default 10,
  aiu_imp     numeric default 3,
  aiu_util    numeric default 10,
  iva         numeric default 19,
  created_at  timestamptz default now()
);

-- Clientes guardados por contratista
create table if not exists public.clientes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  nombre      text not null,
  nit         text,
  director    text,
  cargo       text default 'Director de Obra',
  tel         text,
  ciudad      text,
  created_at  timestamptz default now()
);

-- Catálogo de actividades por contratista
create table if not exists public.catalogo (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  codigo      text,
  actividad   text not null,
  und         text default 'M2',
  valor       numeric default 0,
  created_at  timestamptz default now()
);

-- Actas guardadas (historial)
create table if not exists public.actas (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  numero      text,
  fecha       date,
  periodo     text,
  contrato    text,
  obra        text,
  ubicacion   text,
  empresa_c   text,
  nit_cl      text,
  director    text,
  cargo       text,
  tel_cl      text,
  observaciones text,
  grupos      jsonb default '[]',
  total_bruto numeric default 0,
  total_final numeric default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
--  Row Level Security (RLS) — cada usuario solo ve sus datos
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.perfiles  enable row level security;
alter table public.clientes  enable row level security;
alter table public.catalogo  enable row level security;
alter table public.actas     enable row level security;

-- Perfiles
create policy "usuario ve su perfil"
  on public.perfiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Clientes
create policy "usuario ve sus clientes"
  on public.clientes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Catálogo
create policy "usuario ve su catálogo"
  on public.catalogo for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Actas
create policy "usuario ve sus actas"
  on public.actas for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
--  Trigger: crear perfil vacío cuando se registra un usuario
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.perfiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────────
--  Storage bucket para logos
-- ─────────────────────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

create policy "usuario sube su logo"
  on storage.objects for insert
  with check (bucket_id = 'logos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "logos son públicos"
  on storage.objects for select
  using (bucket_id = 'logos');

create policy "usuario borra su logo"
  on storage.objects for delete
  using (bucket_id = 'logos' and auth.uid()::text = (storage.foldername(name))[1]);
