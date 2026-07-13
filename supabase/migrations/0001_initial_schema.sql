-- We Live for Sundays (WLFS) — initial schema
-- Run against your Supabase project (SQL Editor, Supabase MCP, or CLI).
--
-- RLS model: every table has Row Level Security ENABLED with a single
-- permissive SELECT policy (public read). No INSERT/UPDATE/DELETE policies
-- exist, so the anon/public key can only read. Writes must use the service
-- role key, which bypasses RLS.

-- Needed for gen_random_uuid()
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'notable_moment_category') then
    create type notable_moment_category as enum (
      'championship',
      'comeback',
      'blowout',
      'record',
      'trade'
    );
  end if;
end$$;

-- ---------------------------------------------------------------------------
-- seasons
-- ---------------------------------------------------------------------------
create table if not exists public.seasons (
  id                          uuid primary key default gen_random_uuid(),
  year                        integer not null unique,
  champion_roster_id          integer,
  runner_up_roster_id         integer,
  championship_score_winner   numeric(6, 2),
  championship_score_loser    numeric(6, 2),
  final_standings             jsonb,
  created_at                  timestamptz not null default now()
);

create index if not exists seasons_year_idx on public.seasons (year desc);

-- ---------------------------------------------------------------------------
-- notable_moments
-- ---------------------------------------------------------------------------
create table if not exists public.notable_moments (
  id              uuid primary key default gen_random_uuid(),
  season_year     integer,
  week            integer,
  title           text not null,
  description     text,
  category        notable_moment_category,
  stat_highlight  text,
  roster_id       integer,
  created_at      timestamptz not null default now()
);

create index if not exists notable_moments_season_year_idx on public.notable_moments (season_year);
create index if not exists notable_moments_category_idx on public.notable_moments (category);
create index if not exists notable_moments_created_at_idx on public.notable_moments (created_at desc);

-- ---------------------------------------------------------------------------
-- league_milestones
-- ---------------------------------------------------------------------------
create table if not exists public.league_milestones (
  id           uuid primary key default gen_random_uuid(),
  date         date,
  title        text not null,
  description  text,
  created_at   timestamptz not null default now()
);

create index if not exists league_milestones_date_idx on public.league_milestones (date desc);

-- ---------------------------------------------------------------------------
-- championship_jerseys
-- ---------------------------------------------------------------------------
create table if not exists public.championship_jerseys (
  id             uuid primary key default gen_random_uuid(),
  season_year    integer,
  player_name    text,
  jersey_number  integer,
  nfl_team       text,
  image_url      text
);

create index if not exists championship_jerseys_season_year_idx on public.championship_jerseys (season_year);

-- ---------------------------------------------------------------------------
-- retired_members
-- ---------------------------------------------------------------------------
create table if not exists public.retired_members (
  id                   uuid primary key default gen_random_uuid(),
  manager_name         text not null,
  years_active_start   integer,
  years_active_end     integer,
  championships_won    integer not null default 0,
  legacy_note          text
);

-- ---------------------------------------------------------------------------
-- ktc_values
-- ---------------------------------------------------------------------------
create table if not exists public.ktc_values (
  id            uuid primary key default gen_random_uuid(),
  player_name   text not null unique,
  value         integer not null,
  last_updated  timestamptz not null default now()
);

-- Case-insensitive lookups when joining Sleeper player names -> KTC values.
create index if not exists ktc_values_player_name_lower_idx on public.ktc_values (lower(player_name));

-- ---------------------------------------------------------------------------
-- manager_metadata
-- ---------------------------------------------------------------------------
create table if not exists public.manager_metadata (
  id                   uuid primary key default gen_random_uuid(),
  roster_id            integer not null unique,
  years_active_start   integer,
  display_name         text
);

create index if not exists manager_metadata_roster_id_idx on public.manager_metadata (roster_id);

-- ---------------------------------------------------------------------------
-- Row Level Security: public read, no public writes
-- ---------------------------------------------------------------------------
alter table public.seasons              enable row level security;
alter table public.notable_moments      enable row level security;
alter table public.league_milestones    enable row level security;
alter table public.championship_jerseys enable row level security;
alter table public.retired_members      enable row level security;
alter table public.ktc_values           enable row level security;
alter table public.manager_metadata     enable row level security;

-- Public SELECT policies (drop-if-exists keeps this migration re-runnable).
drop policy if exists "Public read seasons"              on public.seasons;
drop policy if exists "Public read notable_moments"      on public.notable_moments;
drop policy if exists "Public read league_milestones"    on public.league_milestones;
drop policy if exists "Public read championship_jerseys" on public.championship_jerseys;
drop policy if exists "Public read retired_members"      on public.retired_members;
drop policy if exists "Public read ktc_values"           on public.ktc_values;
drop policy if exists "Public read manager_metadata"     on public.manager_metadata;

create policy "Public read seasons"              on public.seasons              for select using (true);
create policy "Public read notable_moments"      on public.notable_moments      for select using (true);
create policy "Public read league_milestones"    on public.league_milestones    for select using (true);
create policy "Public read championship_jerseys" on public.championship_jerseys for select using (true);
create policy "Public read retired_members"      on public.retired_members      for select using (true);
create policy "Public read ktc_values"           on public.ktc_values           for select using (true);
create policy "Public read manager_metadata"     on public.manager_metadata     for select using (true);
