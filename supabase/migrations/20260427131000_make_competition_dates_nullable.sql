alter table if exists public.competitions
  alter column "regStart" drop not null,
  alter column "regEnd" drop not null,
  alter column "eventStart" drop not null,
  alter column "eventEnd" drop not null;
