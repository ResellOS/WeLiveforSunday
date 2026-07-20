-- Pick → player resolution on trade_log + year-end trade_aging snapshots.
-- RLS: public SELECT; writes via service role only.

-- ---------------------------------------------------------------------------
-- trade_log: resolved drafted player (null until that pick's draft completes)
-- ---------------------------------------------------------------------------
alter table public.trade_log
  add column if not exists resolved_player_id   text,
  add column if not exists resolved_player_name text,
  add column if not exists resolved_at          timestamptz;

create index if not exists trade_log_unresolved_picks_idx
  on public.trade_log (draft_season, draft_round, original_roster_id)
  where asset_type = 'draft_pick' and resolved_player_id is null;

create index if not exists trade_log_resolved_player_id_idx
  on public.trade_log (resolved_player_id)
  where resolved_player_id is not null;

-- ---------------------------------------------------------------------------
-- trade_aging: year-end value comparison per traded asset
-- value_at_trade is frozen to the original tug-of-war methodology
-- (player KTC / pick estimate). value_at_aging may use resolved player KTC.
-- ---------------------------------------------------------------------------
create table if not exists public.trade_aging (
  id                     uuid primary key default gen_random_uuid(),
  league_id              text not null,
  aging_year             integer not null,
  trade_log_id           text,
  transaction_id         text not null,
  asset_id               text not null,
  asset_type             text not null check (asset_type in ('player', 'draft_pick')),
  trade_date             timestamptz not null,
  -- Frozen "at trade" value (same basis as Trade History tug bar)
  value_at_trade         numeric not null default 0,
  -- Current value at aging time
  value_at_aging         numeric not null default 0,
  value_source           text not null check (
    value_source in ('player_ktc', 'resolved_player_ktc', 'pick_estimate', 'unknown')
  ),
  resolved_player_id     text,
  resolved_player_name   text,
  delta                  numeric not null default 0,
  created_at             timestamptz not null default now(),
  unique (league_id, aging_year, transaction_id, asset_id)
);

create index if not exists trade_aging_league_year_idx
  on public.trade_aging (league_id, aging_year desc);

create index if not exists trade_aging_asset_id_idx
  on public.trade_aging (asset_id);

alter table public.trade_aging enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'trade_aging'
      and policyname = 'trade_aging_public_read'
  ) then
    create policy trade_aging_public_read
      on public.trade_aging
      for select
      to anon, authenticated
      using (true);
  end if;
end$$;

grant select on public.trade_aging to anon, authenticated;
