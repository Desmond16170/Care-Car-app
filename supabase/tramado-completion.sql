-- Care Car 2.0 - Completion fields for Tramado
-- Execute after tramado-schema.sql and tramado-security-hardening.sql.

begin;

alter table public.workshop_receptions
  add column if not exists signature_path text,
  add column if not exists signed_at timestamptz,
  add column if not exists delivered_at timestamptz;

create index if not exists workshop_receptions_status_idx
  on public.workshop_receptions (user_id, status, received_at desc);

commit;
