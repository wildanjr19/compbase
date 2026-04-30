-- Rapikan policy audit log agar tidak saling bertabrakan.
-- Catatan: by default, operasi selain yang diizinkan policy akan ditolak oleh RLS.

alter table public.admin_audit_logs enable row level security;

drop policy if exists "Allow select for authenticated admin" on public.admin_audit_logs;
drop policy if exists "Deny all modifications from client" on public.admin_audit_logs;

create policy "Allow select for authenticated admin"
  on public.admin_audit_logs
  for select
  to authenticated
  using (true);

create policy "Allow service role all"
  on public.admin_audit_logs
  for all
  to service_role
  using (true)
  with check (true);
