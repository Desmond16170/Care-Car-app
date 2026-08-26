-- Care Car 2.0 - extensión de vehículos y mantenimientos
-- Ejecutar después de car-care-schema.sql si el esquema inicial ya fue aplicado.

begin;

alter table public.vehicles
  add column if not exists generation text,
  add column if not exists is_active boolean not null default true,
  add column if not exists archived_at timestamptz;

alter table public.maintenances
  add column if not exists details jsonb not null default '{}'::jsonb;

-- Una placa solo debe repetirse cuando el registro anterior ya fue archivado.
-- Esto permite conservar el historial de un vehículo antiguo sin bloquear un registro nuevo.
drop index if exists public.vehicles_user_plate_unique;
create unique index if not exists vehicles_user_active_plate_unique
  on public.vehicles (user_id, lower(plate))
  where is_active = true and plate is not null and btrim(plate) <> '';

create index if not exists vehicles_user_active_idx
  on public.vehicles (user_id, is_active);

-- Los permisos son por tabla, por lo que los GRANT existentes cubren estas columnas.
-- RLS existente sigue restringiendo cada fila al propietario del vehículo.

commit;
