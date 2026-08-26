-- Care Car 2.0 - endurecimiento de ownership para Tramado
-- Ejecutar inmediatamente después de tramado-schema.sql.
-- Evita relaciones cruzadas entre usuarios aunque alguien conozca UUIDs ajenos.

begin;

drop policy if exists customer_vehicles_insert_own on public.customer_vehicles;
drop policy if exists customer_vehicles_update_own on public.customer_vehicles;

create policy customer_vehicles_insert_own
on public.customer_vehicles for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.customers c
    where c.id = customer_id and c.user_id = (select auth.uid())
  )
  and exists (
    select 1 from public.vehicles v
    where v.id = vehicle_id and v.user_id = (select auth.uid())
  )
);

create policy customer_vehicles_update_own
on public.customer_vehicles for update to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.customers c
    where c.id = customer_id and c.user_id = (select auth.uid())
  )
  and exists (
    select 1 from public.vehicles v
    where v.id = vehicle_id and v.user_id = (select auth.uid())
  )
);

drop policy if exists workshop_receptions_insert_own on public.workshop_receptions;
drop policy if exists workshop_receptions_update_own on public.workshop_receptions;

create policy workshop_receptions_insert_own
on public.workshop_receptions for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.customers c
    where c.id = customer_id and c.user_id = (select auth.uid())
  )
  and exists (
    select 1 from public.vehicles v
    where v.id = vehicle_id
      and v.user_id = (select auth.uid())
      and v.is_active = true
  )
);

create policy workshop_receptions_update_own
on public.workshop_receptions for update to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.customers c
    where c.id = customer_id and c.user_id = (select auth.uid())
  )
  and exists (
    select 1 from public.vehicles v
    where v.id = vehicle_id and v.user_id = (select auth.uid())
  )
);

drop policy if exists reception_inspections_insert_own on public.reception_inspections;
drop policy if exists reception_inspections_update_own on public.reception_inspections;

create policy reception_inspections_insert_own
on public.reception_inspections for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.workshop_receptions r
    where r.id = reception_id and r.user_id = (select auth.uid())
  )
);

create policy reception_inspections_update_own
on public.reception_inspections for update to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.workshop_receptions r
    where r.id = reception_id and r.user_id = (select auth.uid())
  )
);

drop policy if exists reception_photos_insert_own on public.reception_photos;
drop policy if exists reception_photos_update_own on public.reception_photos;

create policy reception_photos_insert_own
on public.reception_photos for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.workshop_receptions r
    where r.id = reception_id and r.user_id = (select auth.uid())
  )
);

create policy reception_photos_update_own
on public.reception_photos for update to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.workshop_receptions r
    where r.id = reception_id and r.user_id = (select auth.uid())
  )
);

commit;
