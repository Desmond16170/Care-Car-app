-- Care Car 2.0 - Tramado / recepción de vehículos
-- Ejecutar después de car-care-schema.sql y vehicle-maintenance-extension.sql.

begin;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null,
  identification text,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customers_user_name_idx
  on public.customers (user_id, lower(full_name));

create index if not exists customers_user_identification_idx
  on public.customers (user_id, identification)
  where identification is not null and btrim(identification) <> '';

create table if not exists public.customer_vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, customer_id, vehicle_id)
);

create index if not exists customer_vehicles_customer_idx
  on public.customer_vehicles (customer_id);
create index if not exists customer_vehicles_vehicle_idx
  on public.customer_vehicles (vehicle_id);

create table if not exists public.workshop_receptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reception_number bigint not null,
  customer_id uuid not null references public.customers(id),
  vehicle_id uuid not null references public.vehicles(id),
  status text not null default 'received'
    check (status in ('received', 'in_progress', 'ready', 'delivered', 'cancelled')),
  received_at timestamptz not null default now(),
  mileage integer not null check (mileage >= 0),
  fuel_level smallint not null default 50 check (fuel_level between 0 and 100),
  reason text not null,
  estimated_delivery_at timestamptz,
  customer_notes text,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, reception_number)
);

create index if not exists workshop_receptions_user_received_idx
  on public.workshop_receptions (user_id, received_at desc);
create index if not exists workshop_receptions_vehicle_idx
  on public.workshop_receptions (vehicle_id, received_at desc);
create index if not exists workshop_receptions_customer_idx
  on public.workshop_receptions (customer_id, received_at desc);

create table if not exists public.reception_inspections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reception_id uuid not null unique references public.workshop_receptions(id) on delete cascade,
  accessories jsonb not null default '[]'::jsonb,
  damages jsonb not null default '[]'::jsonb,
  observations text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reception_inspections_user_idx
  on public.reception_inspections (user_id);

create table if not exists public.reception_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reception_id uuid not null references public.workshop_receptions(id) on delete cascade,
  storage_path text not null,
  photo_type text not null default 'entry'
    check (photo_type in ('entry', 'damage', 'document', 'other')),
  caption text,
  created_at timestamptz not null default now()
);

create index if not exists reception_photos_reception_idx
  on public.reception_photos (reception_id, created_at);
create index if not exists reception_photos_user_idx
  on public.reception_photos (user_id);

-- Consecutivo seguro por cuenta. El advisory lock evita números duplicados
-- si dos recepciones se guardan al mismo tiempo.
create or replace function private.set_next_reception_number()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtext(new.user_id::text));
  select coalesce(max(r.reception_number), 0) + 1
    into new.reception_number
  from public.workshop_receptions r
  where r.user_id = new.user_id;
  return new;
end;
$$;

revoke all on function private.set_next_reception_number() from public, anon, authenticated;

drop trigger if exists set_workshop_reception_number on public.workshop_receptions;
create trigger set_workshop_reception_number
before insert on public.workshop_receptions
for each row
execute function private.set_next_reception_number();

-- Reutiliza el trigger de updated_at creado por el esquema principal.
drop trigger if exists set_customers_updated_at on public.customers;
create trigger set_customers_updated_at
before update on public.customers
for each row execute function private.set_updated_at();

drop trigger if exists set_workshop_receptions_updated_at on public.workshop_receptions;
create trigger set_workshop_receptions_updated_at
before update on public.workshop_receptions
for each row execute function private.set_updated_at();

drop trigger if exists set_reception_inspections_updated_at on public.reception_inspections;
create trigger set_reception_inspections_updated_at
before update on public.reception_inspections
for each row execute function private.set_updated_at();

alter table public.customers enable row level security;
alter table public.customer_vehicles enable row level security;
alter table public.workshop_receptions enable row level security;
alter table public.reception_inspections enable row level security;
alter table public.reception_photos enable row level security;

-- El frontend no usa anon para datos del taller.
revoke all on public.customers from anon;
revoke all on public.customer_vehicles from anon;
revoke all on public.workshop_receptions from anon;
revoke all on public.reception_inspections from anon;
revoke all on public.reception_photos from anon;

grant select, insert, update, delete on public.customers to authenticated;
grant select, insert, update, delete on public.customer_vehicles to authenticated;
grant select, insert, update, delete on public.workshop_receptions to authenticated;
grant select, insert, update, delete on public.reception_inspections to authenticated;
grant select, insert, update, delete on public.reception_photos to authenticated;

-- Policies idempotentes.
drop policy if exists customers_select_own on public.customers;
drop policy if exists customers_insert_own on public.customers;
drop policy if exists customers_update_own on public.customers;
drop policy if exists customers_delete_own on public.customers;
create policy customers_select_own on public.customers for select to authenticated using (user_id = (select auth.uid()));
create policy customers_insert_own on public.customers for insert to authenticated with check (user_id = (select auth.uid()));
create policy customers_update_own on public.customers for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy customers_delete_own on public.customers for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists customer_vehicles_select_own on public.customer_vehicles;
drop policy if exists customer_vehicles_insert_own on public.customer_vehicles;
drop policy if exists customer_vehicles_update_own on public.customer_vehicles;
drop policy if exists customer_vehicles_delete_own on public.customer_vehicles;
create policy customer_vehicles_select_own on public.customer_vehicles for select to authenticated using (user_id = (select auth.uid()));
create policy customer_vehicles_insert_own on public.customer_vehicles for insert to authenticated with check (user_id = (select auth.uid()));
create policy customer_vehicles_update_own on public.customer_vehicles for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy customer_vehicles_delete_own on public.customer_vehicles for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists workshop_receptions_select_own on public.workshop_receptions;
drop policy if exists workshop_receptions_insert_own on public.workshop_receptions;
drop policy if exists workshop_receptions_update_own on public.workshop_receptions;
drop policy if exists workshop_receptions_delete_own on public.workshop_receptions;
create policy workshop_receptions_select_own on public.workshop_receptions for select to authenticated using (user_id = (select auth.uid()));
create policy workshop_receptions_insert_own on public.workshop_receptions for insert to authenticated with check (user_id = (select auth.uid()));
create policy workshop_receptions_update_own on public.workshop_receptions for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy workshop_receptions_delete_own on public.workshop_receptions for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists reception_inspections_select_own on public.reception_inspections;
drop policy if exists reception_inspections_insert_own on public.reception_inspections;
drop policy if exists reception_inspections_update_own on public.reception_inspections;
drop policy if exists reception_inspections_delete_own on public.reception_inspections;
create policy reception_inspections_select_own on public.reception_inspections for select to authenticated using (user_id = (select auth.uid()));
create policy reception_inspections_insert_own on public.reception_inspections for insert to authenticated with check (user_id = (select auth.uid()));
create policy reception_inspections_update_own on public.reception_inspections for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy reception_inspections_delete_own on public.reception_inspections for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists reception_photos_select_own on public.reception_photos;
drop policy if exists reception_photos_insert_own on public.reception_photos;
drop policy if exists reception_photos_update_own on public.reception_photos;
drop policy if exists reception_photos_delete_own on public.reception_photos;
create policy reception_photos_select_own on public.reception_photos for select to authenticated using (user_id = (select auth.uid()));
create policy reception_photos_insert_own on public.reception_photos for insert to authenticated with check (user_id = (select auth.uid()));
create policy reception_photos_update_own on public.reception_photos for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy reception_photos_delete_own on public.reception_photos for delete to authenticated using (user_id = (select auth.uid()));

-- Storage privado para fotografías de recepción.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'reception-photos',
  'reception-photos',
  false,
  10485760,
  array['image/jpeg','image/png','image/webp','image/heic','image/heif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists reception_photos_storage_select_own on storage.objects;
drop policy if exists reception_photos_storage_insert_own on storage.objects;
drop policy if exists reception_photos_storage_update_own on storage.objects;
drop policy if exists reception_photos_storage_delete_own on storage.objects;

create policy reception_photos_storage_select_own
on storage.objects for select to authenticated
using (
  bucket_id = 'reception-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy reception_photos_storage_insert_own
on storage.objects for insert to authenticated
with check (
  bucket_id = 'reception-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy reception_photos_storage_update_own
on storage.objects for update to authenticated
using (
  bucket_id = 'reception-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'reception-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy reception_photos_storage_delete_own
on storage.objects for delete to authenticated
using (
  bucket_id = 'reception-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

commit;
