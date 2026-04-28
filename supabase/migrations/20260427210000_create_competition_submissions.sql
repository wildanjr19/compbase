create table if not exists public.competition_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  organizer text not null,
  category text not null,
  reg_start date,
  reg_end date,
  event_start date,
  event_end date,
  is_priority boolean default false,
  has_guidebook boolean default false,
  links jsonb default '{}',
  submitter_name text not null,
  submitter_email text not null,
  notes text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  payment_status text not null default 'waived' check (payment_status in ('unpaid', 'paid', 'waived')),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index untuk filter status
create index if not exists idx_competition_submissions_status on public.competition_submissions(status);

drop trigger if exists competition_submissions_set_updated_at on public.competition_submissions;
create trigger competition_submissions_set_updated_at
before update on public.competition_submissions
for each row
execute function public.set_updated_at();

-- RLS: insert publik diizinkan (tanpa auth), read/update/delete hanya service role
alter table public.competition_submissions enable row level security;

drop policy if exists "Allow public insert" on public.competition_submissions;
create policy "Allow public insert" on public.competition_submissions
  for insert to anon with check (true);

drop policy if exists "Allow service role all" on public.competition_submissions;
create policy "Allow service role all" on public.competition_submissions
  for all to service_role using (true) with check (true);
