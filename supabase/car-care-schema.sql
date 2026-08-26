-- Care Car 2.0 - esquema inicial para Supabase
-- Diseñado para Supabase Auth + PostgreSQL + RLS.

begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  identification text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  make text not null,
  model text not null,
  year integer check (year is null or year between 1886 and 2200),
  plate text,
  vin text,
  current_mileage integer not null default 0 check (current_mileage >= 0),
  nickname text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists vehicles_user_plate_unique
  on public.vehicles (user_id, lower(plate))
  where plate is not null and btrim(plate) <> '';

create index if not exists vehicles_user_id_idx
  on public.vehicles(user_id);

create table if not exists public.maintenances (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  maintenance_type text not null,
  service_date date not null default current_date,
  mileage integer check (mileage is null or mileage >= 0),
  cost numeric(12,2) check (cost is null or cost >= 0),
  notes text,
  performed_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists maintenances_vehicle_id_idx
  on public.maintenances(vehicle_id);

create index if not exists maintenances_service_date_idx
  on public.maintenances(service_date desc);

create table if not exists public.mileage_logs (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  mileage integer not null check (mileage >= 0),
  recorded_at timestamptz not null default now(),
  notes text
);

create index if not exists mileage_logs_vehicle_id_idx
  on public.mileage_logs(vehicle_id);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, identification)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'identification', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function private.set_updated_at() from public, anon, authenticated;
revoke all on function private.handle_new_user() from public, anon, authenticated;

insert into public.profiles (id, email, full_name, identification)
select
  id,
  email,
  nullif(raw_user_meta_data ->> 'full_name', ''),
  nullif(raw_user_meta_data ->> 'identification', '')
from auth.users
on conflict (id) do nothing;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

drop trigger if exists vehicles_set_updated_at on public.vehicles;
create trigger vehicles_set_updated_at
before update on public.vehicles
for each row execute function private.set_updated_at();

drop trigger if exists maintenances_set_updated_at on public.maintenances;
create trigger maintenances_set_updated_at
before update on public.maintenances
for each row execute function private.set_updated_at();

alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.maintenances enable row level security;
alter table public.mileage_logs enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "vehicles_select_own" on public.vehicles;
create policy "vehicles_select_own"
on public.vehicles for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "vehicles_insert_own" on public.vehicles;
create policy "vehicles_insert_own"
on public.vehicles for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "vehicles_update_own" on public.vehicles;
create policy "vehicles_update_own"
on public.vehicles for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "vehicles_delete_own" on public.vehicles;
create policy "vehicles_delete_own"
on public.vehicles for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "maintenances_select_owned_vehicle" on public.maintenances;
create policy "maintenances_select_owned_vehicle"
on public.maintenances for select
to authenticated
using (
  exists (
    select 1
    from public.vehicles v
    where v.id = maintenances.vehicle_id
      and v.user_id = (select auth.uid())
  )
);

drop policy if exists "maintenances_insert_owned_vehicle" on public.maintenances;
create policy "maintenances_insert_owned_vehicle"
on public.maintenances for insert
to authenticated
with check (
  exists (
    select 1
    from public.vehicles v
    where v.id = maintenances.vehicle_id
      and v.user_id = (select auth.uid())
  )
);

drop policy if exists "maintenances_update_owned_vehicle" on public.maintenances;
create policy "maintenances_update_owned_vehicle"
on public.maintenances for update
to authenticated
using (
  exists (
    select 1
    from public.vehicles v
    where v.id = maintenances.vehicle_id
      and v.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.vehicles v
    where v.id = maintenances.vehicle_id
      and v.user_id = (select auth.uid())
  )
);

drop policy if exists "maintenances_delete_owned_vehicle" on public.maintenances;
create policy "maintenances_delete_owned_vehicle"
on public.maintenances for delete
to authenticated
using (
  exists (
    select 1
    from public.vehicles v
    where v.id = maintenances.vehicle_id
      and v.user_id = (select auth.uid())
  )
);

drop policy if exists "mileage_logs_select_owned_vehicle" on public.mileage_logs;
create policy "mileage_logs_select_owned_vehicle"
on public.mileage_logs for select
to authenticated
using (
  exists (
    select 1
    from public.vehicles v
    where v.id = mileage_logs.vehicle_id
      and v.user_id = (select auth.uid())
  )
);

drop policy if exists "mileage_logs_insert_owned_vehicle" on public.mileage_logs;
create policy "mileage_logs_insert_owned_vehicle"
on public.mileage_logs for insert
to authenticated
with check (
  exists (
    select 1
    from public.vehicles v
    where v.id = mileage_logs.vehicle_id
      and v.user_id = (select auth.uid())
  )
);

drop policy if exists "mileage_logs_update_owned_vehicle" on public.mileage_logs;
create policy "mileage_logs_update_owned_vehicle"
on public.mileage_logs for update
to authenticated
using (
  exists (
    select 1
    from public.vehicles v
    where v.id = mileage_logs.vehicle_id
      and v.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.vehicles v
    where v.id = mileage_logs.vehicle_id
      and v.user_id = (select auth.uid())
  )
);

drop policy if exists "mileage_logs_delete_owned_vehicle" on public.mileage_logs;
create policy "mileage_logs_delete_owned_vehicle"
on public.mileage_logs for delete
to authenticated
using (
  exists (
    select 1
    from public.vehicles v
    where v.id = mileage_logs.vehicle_id
      and v.user_id = (select auth.uid())
  )
);

-- Los proyectos nuevos de Supabase pueden no exponer automáticamente las tablas
-- al Data API. Estos GRANT habilitan el acceso del rol authenticated; RLS sigue
-- controlando qué filas puede ver o modificar cada usuario.
grant usage on schema public to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.vehicles to authenticated;
grant select, insert, update, delete on public.maintenances to authenticated;
grant select, insert, update, delete on public.mileage_logs to authenticated;

commit;
