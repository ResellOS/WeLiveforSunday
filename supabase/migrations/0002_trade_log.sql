-- We Live for Sundays (WLFS) — per-asset trade log
--
-- One row per asset moved in a completed trade. Group by transaction_id to
-- reconstruct the full deal. Populated from Sleeper transactions (or a future
-- sync job). Same RLS model as 0001: public SELECT, service-role writes.

create table if not exists public.trade_log (
  id                  uuid primary key default gen_random_uuid(),
  league_id           text not null,
  season_year         integer not null,
  week                integer,
  transaction_id      text not null,
  trade_date          timestamptz not null,
  asset_type          text not null check (asset_type in ('player', 'draft_pick')),
  -- Stable asset key: Sleeper player_id, or pick:{season}:{round}:{original_roster_id}
  asset_id            text not null,
  player_id           text,
  player_name         text,
  player_position     text,
  nfl_team            text,
  draft_season        integer,
  draft_round         integer,
  -- For picks: the roster that originally owned the pick (Sleeper roster_id)
  original_roster_id  integer,
  -- Fantasy roster that sent the asset in this trade
  from_roster_id      integer not null,
  -- Fantasy roster that received the asset in this trade
  to_roster_id        integer not null,
  created_at          timestamptz not null default now(),
  unique (transaction_id, asset_id, to_roster_id)
);

create index if not exists trade_log_asset_id_idx
  on public.trade_log (asset_id);

create index if not exists trade_log_transaction_id_idx
  on public.trade_log (transaction_id);

create index if not exists trade_log_season_year_idx
  on public.trade_log (season_year desc);

create index if not exists trade_log_trade_date_idx
  on public.trade_log (trade_date asc);

create index if not exists trade_log_player_id_idx
  on public.trade_log (player_id)
  where player_id is not null;

create index if not exists trade_log_league_season_idx
  on public.trade_log (league_id, season_year);

alter table public.trade_log enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'trade_log'
      and policyname = 'trade_log_public_read'
  ) then
    create policy trade_log_public_read
      on public.trade_log
      for select
      to anon, authenticated
      using (true);
  end if;
end$$;

grant select on public.trade_log to anon, authenticated;
