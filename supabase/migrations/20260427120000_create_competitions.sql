create table if not exists public.competitions (
  id text primary key,
  name text not null,
  slug text not null,
  organizer text not null,
  category text not null,
  "regStart" date not null,
  "regEnd" date not null,
  "eventStart" date not null,
  "eventEnd" date not null,
  "isPriority" boolean not null default false,
  "hasGuidebook" boolean not null default false,
  links jsonb not null default '{}'::jsonb,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists competitions_regend_idx
on public.competitions ("regEnd");

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new."updatedAt" = now();
  return new;
end;
$$;

drop trigger if exists competitions_set_updated_at on public.competitions;

create trigger competitions_set_updated_at
before update on public.competitions
for each row
execute function public.set_updated_at();
