create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_email text not null,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  payload_before jsonb null,
  payload_after jsonb null,
  ip_address text null,
  created_at timestamptz not null default now()
);

comment on table public.admin_audit_logs is 'Log perubahan data oleh admin panel';
comment on column public.admin_audit_logs.action is 'create, update, delete, approve, reject';
comment on column public.admin_audit_logs.entity_type is 'competition atau submission';

-- Index untuk query yang sering dipakai di panel admin
create index idx_audit_logs_admin_email on public.admin_audit_logs(admin_email);
create index idx_audit_logs_entity on public.admin_audit_logs(entity_type, entity_id);
create index idx_audit_logs_created_at on public.admin_audit_logs(created_at desc);

-- RLS policy: audit log hanya boleh dibaca (tidak dimodifikasi dari client)
alter table public.admin_audit_logs enable row level security;

create policy "Allow select for authenticated admin"
  on public.admin_audit_logs
  for select
  using (true);

create policy "Deny all modifications from client"
  on public.admin_audit_logs
  as restrictive
  for all
  to public
  using (false)
  with check (false);
