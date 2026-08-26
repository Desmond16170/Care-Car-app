-- Care Car 2.0 - extensión de vehículos y mantenimientos
-- Ejecutar después de car-care-schema.sql si el esquema inicial ya fue aplicado.

begin;

alter table public.vehicles
  add column if not exists generation text;

alter table public.maintenances
  add column if not exists details jsonb not null default '{}'::jsonb;

-- Los permisos son por tabla, por lo que los GRANT existentes cubren estas columnas.
-- RLS existente sigue restringiendo cada fila al propietario del vehículo.

commit;
