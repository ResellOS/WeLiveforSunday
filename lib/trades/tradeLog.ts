/**
 * Load / normalize league trade_log rows.
 *
 * Prefer Supabase `trade_log` when populated. When the table is missing or
 * empty, derive the same per-asset shape from Sleeper completed trades across
 * the season chain (live production data — not a fixture).
 */

import { supabase, isSupabaseConfigured, getSupabaseAdmin } from "@/lib/supabase";
import {
  getTransactions,
  getAllPlayers,
  playerName,
  getRosters,
  getUsers,
} from "@/lib/sleeper";
import { getSeasonChain } from "@/lib/records";
import { buildTeams } from "@/lib/league";
import { teamColorForRoster } from "@/lib/config/teamColors";
import { sleeperPlayerThumb } from "@/lib/sleeperMedia";
import { draftPickAssetId } from "@/lib/trades/tradeHelpers";
import {
  applyPickResolutionsToRows,
  buildPickResolutionMap,
  persistPickResolutions,
} from "@/lib/pick-resolution";
import type {
  TradeLogRow,
  TradePlayerOption,
  TradeTeamInfo,
} from "@/lib/trades/tradeTreeTypes";
import type { PlayerMap, Transaction } from "@/types/sleeper";

export type TradeLogSource = "supabase" | "sleeper";

export interface TradeLogBundle {
  rows: TradeLogRow[];
  source: TradeLogSource;
  teams: Record<number, TradeTeamInfo>;
  players: TradePlayerOption[];
  seasons: number[];
}

function txnToRows(
  txn: Transaction,
  leagueId: string,
  seasonYear: number,
  players: PlayerMap,
): TradeLogRow[] {
  if (txn.type !== "trade" || txn.status !== "complete") return [];

  const tradeDate = new Date(txn.created).toISOString();
  const week = txn.leg ?? null;
  const out: TradeLogRow[] = [];

  const adds = txn.adds ?? {};
  const drops = txn.drops ?? {};

  for (const [playerId, toRoster] of Object.entries(adds)) {
    const fromRoster = drops[playerId];
    // Skip if we can't identify a sender (malformed / non-trade add).
    if (fromRoster == null || fromRoster === toRoster) continue;
    const p = players[playerId];
    out.push({
      id: `${txn.transaction_id}:${playerId}:${toRoster}`,
      league_id: leagueId,
      season_year: seasonYear,
      week,
      transaction_id: txn.transaction_id,
      trade_date: tradeDate,
      asset_type: "player",
      asset_id: playerId,
      player_id: playerId,
      player_name: playerName(players, playerId),
      player_position: p?.position ?? p?.fantasy_positions?.[0] ?? null,
      nfl_team: p?.team ?? null,
      draft_season: null,
      draft_round: null,
      original_roster_id: null,
      from_roster_id: fromRoster,
      to_roster_id: toRoster,
      resolved_player_id: null,
      resolved_player_name: null,
      resolved_at: null,
    });
  }

  for (const pick of txn.draft_picks ?? []) {
    const season = Number(pick.season);
    const assetId = draftPickAssetId(pick.season, pick.round, pick.roster_id);
    if (pick.previous_owner_id === pick.owner_id) continue;
    out.push({
      id: `${txn.transaction_id}:${assetId}:${pick.owner_id}`,
      league_id: leagueId,
      season_year: seasonYear,
      week,
      transaction_id: txn.transaction_id,
      trade_date: tradeDate,
      asset_type: "draft_pick",
      asset_id: assetId,
      player_id: null,
      player_name: null,
      player_position: null,
      nfl_team: null,
      draft_season: Number.isFinite(season) ? season : null,
      draft_round: pick.round,
      original_roster_id: pick.roster_id,
      from_roster_id: pick.previous_owner_id,
      to_roster_id: pick.owner_id,
      resolved_player_id: null,
      resolved_player_name: null,
      resolved_at: null,
    });
  }

  return out;
}

async function loadRowsFromSleeper(leagueId: string): Promise<TradeLogRow[]> {
  const [chain, players] = await Promise.all([
    getSeasonChain(leagueId),
    getAllPlayers().catch((): PlayerMap => ({})),
  ]);

  const rows: TradeLogRow[] = [];
  for (const league of chain) {
    const seasonYear = Number(league.season);
    for (let week = 1; week <= 18; week++) {
      const txns = await getTransactions(league.league_id, week).catch(() => []);
      for (const txn of txns ?? []) {
        rows.push(...txnToRows(txn, league.league_id, seasonYear, players));
      }
    }
  }
  return rows;
}

/** True once we know migration 0003 columns are absent (avoids upsert/log spam). */
const RESOLVED_SCHEMA_FLAG = "__wlfsTradeLogResolvedColsMissing";

function tradeLogResolvedSchemaMissing(): boolean {
  return Boolean((globalThis as Record<string, unknown>)[RESOLVED_SCHEMA_FLAG]);
}

function markTradeLogResolvedSchemaMissing(): void {
  (globalThis as Record<string, unknown>)[RESOLVED_SCHEMA_FLAG] = true;
}

function isMissingColumnError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("does not exist") ||
    m.includes("could not find the") ||
    m.includes("schema cache")
  );
}

/** Upsert payload matching live trade_log schema (uuid id + optional resolved_*). */
function toTradeLogUpsertRow(row: TradeLogRow): Record<string, unknown> {
  const base: Record<string, unknown> = {
    league_id: row.league_id,
    season_year: row.season_year,
    week: row.week,
    transaction_id: row.transaction_id,
    trade_date: row.trade_date,
    asset_type: row.asset_type,
    asset_id: row.asset_id,
    player_id: row.player_id,
    player_name: row.player_name,
    player_position: row.player_position,
    nfl_team: row.nfl_team,
    draft_season: row.draft_season,
    draft_round: row.draft_round,
    original_roster_id: row.original_roster_id,
    from_roster_id: row.from_roster_id,
    to_roster_id: row.to_roster_id,
  };
  // Never send synthetic sleeper ids — DB id is uuid with gen_random_uuid().
  if (!tradeLogResolvedSchemaMissing()) {
    if (row.resolved_player_id != null) {
      base.resolved_player_id = row.resolved_player_id;
    }
    if (row.resolved_player_name != null) {
      base.resolved_player_name = row.resolved_player_name;
    }
    if (row.resolved_at != null) {
      base.resolved_at = row.resolved_at;
    }
  }
  return base;
}

async function loadRowsFromSupabase(leagueId: string): Promise<TradeLogRow[]> {
  if (!isSupabaseConfigured()) return [];

  // select('*') returns whatever columns exist — safe before/after migration 0003.
  const { data, error } = await supabase
    .from("trade_log")
    .select("*")
    .eq("league_id", leagueId)
    .order("trade_date", { ascending: true });

  if (error) {
    // Table missing / RLS / network — caller falls back to Sleeper.
    console.warn("[trade_log] supabase read failed:", error.message);
    return [];
  }
  if (!data?.length) return [];
  return data as unknown as TradeLogRow[];
}

/** Best-effort upsert so future reads can hit Supabase. Never throws. */
async function maybeSyncToSupabase(rows: TradeLogRow[]): Promise<void> {
  if (!rows.length) return;
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  try {
    const admin = getSupabaseAdmin();
    const chunkSize = 200;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize).map(toTradeLogUpsertRow);
      const { error } = await admin.from("trade_log").upsert(chunk, {
        onConflict: "transaction_id,asset_id,to_roster_id",
        ignoreDuplicates: false,
      });
      if (error) {
        if (isMissingColumnError(error.message)) {
          markTradeLogResolvedSchemaMissing();
          // Retry once without resolved_* fields.
          const baseOnly = chunk.map((row) => {
            const {
              resolved_player_id: _a,
              resolved_player_name: _b,
              resolved_at: _c,
              ...rest
            } = row;
            return rest;
          });
          const retry = await admin.from("trade_log").upsert(baseOnly, {
            onConflict: "transaction_id,asset_id,to_roster_id",
            ignoreDuplicates: false,
          });
          if (retry.error) {
            console.warn("[trade_log] sync skipped:", retry.error.message);
            return;
          }
          continue;
        }
        console.warn("[trade_log] sync skipped:", error.message);
        return;
      }
    }
  } catch (err) {
    console.warn(
      "[trade_log] sync unavailable:",
      err instanceof Error ? err.message : err,
    );
  }
}

async function loadTeamMap(leagueId: string): Promise<Record<number, TradeTeamInfo>> {
  const [rosters, users] = await Promise.all([
    getRosters(leagueId),
    getUsers(leagueId),
  ]);
  const teams = buildTeams(rosters, users);
  const map: Record<number, TradeTeamInfo> = {};
  for (const t of teams) {
    map[t.rosterId] = {
      rosterId: t.rosterId,
      teamName: t.teamName,
      managerName: t.managerName,
      avatar: t.avatar,
      accentColor: teamColorForRoster(t.rosterId),
    };
  }
  return map;
}

function buildPlayerCatalog(
  rows: TradeLogRow[],
  teams: Record<number, TradeTeamInfo>,
  rosterPlayerIds: string[],
  players: PlayerMap,
): TradePlayerOption[] {
  const ownerByPlayer = new Map<string, number>();
  // Latest recipient in chronological order wins as "current trade-tree owner hint".
  const sorted = [...rows]
    .filter((r) => r.asset_type === "player" && r.player_id)
    .sort((a, b) => a.trade_date.localeCompare(b.trade_date));
  for (const r of sorted) {
    if (r.player_id) ownerByPlayer.set(r.player_id, r.to_roster_id);
  }

  const ids = new Set<string>([
    ...rosterPlayerIds,
    ...sorted.map((r) => r.player_id!).filter(Boolean),
  ]);

  const options: TradePlayerOption[] = [];
  for (const playerId of ids) {
    const p = players[playerId];
    const name = p ? playerName(players, playerId) : playerId;
    const ownerRosterId = ownerByPlayer.get(playerId) ?? null;
    // Prefer live roster ownership when present.
    let liveOwner: number | null = null;
    // liveOwner filled by caller via rosterPlayerIds mapping separately if needed
    void liveOwner;
    options.push({
      playerId,
      fullName: name,
      position: p?.position ?? p?.fantasy_positions?.[0] ?? null,
      nflTeam: p?.team ?? null,
      imageUrl: sleeperPlayerThumb(playerId),
      ownerRosterId,
      ownerName: ownerRosterId != null ? teams[ownerRosterId]?.teamName ?? null : null,
    });
  }

  options.sort((a, b) => a.fullName.localeCompare(b.fullName));
  return options;
}

/**
 * Load trade_log for the league plus team/player catalogs for the Trade Tree UI.
 *
 * Sleeper completed trades are the canonical history. Supabase is a write-through
 * cache — a partial table must not hide the full Sleeper chain.
 */
export async function loadTradeLogBundle(leagueId: string): Promise<TradeLogBundle> {
  const [supabaseRows, sleeperRows, teams, players, rosters, chain] =
    await Promise.all([
      loadRowsFromSupabase(leagueId),
      loadRowsFromSleeper(leagueId).catch(() => [] as TradeLogRow[]),
      loadTeamMap(leagueId),
      getAllPlayers().catch((): PlayerMap => ({})),
      getRosters(leagueId).catch(() => []),
      getSeasonChain(leagueId).catch(() => []),
    ]);

  let rows: TradeLogRow[];
  let source: TradeLogSource;

  if (sleeperRows.length > 0) {
    rows = sleeperRows;
    source = "sleeper";
    void maybeSyncToSupabase(sleeperRows);
  } else if (supabaseRows.length > 0) {
    rows = supabaseRows;
    source = "supabase";
  } else {
    rows = [];
    source = "sleeper";
  }

  // Resolve drafted players onto pick rows (in-memory + best-effort DB persist).
  rows = await enrichRowsWithPickResolutions(leagueId, rows);

  const rosterPlayerIds = rosters.flatMap((r) => r.players ?? []);
  // Overlay live roster ownership onto catalog.
  const liveOwner = new Map<string, number>();
  for (const r of rosters) {
    for (const pid of r.players ?? []) liveOwner.set(pid, r.roster_id);
  }

  const catalog = buildPlayerCatalog(rows, teams, rosterPlayerIds, players).map(
    (opt) => {
      const rid = liveOwner.get(opt.playerId) ?? opt.ownerRosterId;
      return {
        ...opt,
        ownerRosterId: rid,
        ownerName: rid != null ? teams[rid]?.teamName ?? opt.ownerName : opt.ownerName,
      };
    },
  );

  const seasons = [
    ...new Set([
      ...chain.map((l) => Number(l.season)).filter((n) => Number.isFinite(n)),
      ...rows.map((r) => r.season_year),
    ]),
  ].sort((a, b) => b - a);

  if (seasons.length === 0) {
    seasons.push(new Date().getFullYear());
  }

  return { rows, source, teams, players: catalog, seasons };
}

/**
 * When any draft-pick row is still unresolved, match Sleeper completed drafts
 * and stamp resolved_player_* onto the in-memory rows. Persistence is
 * best-effort so page loads still work without the migration applied.
 */
async function enrichRowsWithPickResolutions(
  leagueId: string,
  rows: TradeLogRow[],
): Promise<TradeLogRow[]> {
  const needsResolve = rows.some(
    (r) => r.asset_type === "draft_pick" && !r.resolved_player_id,
  );
  if (!needsResolve) return rows;

  try {
    const { map } = await buildPickResolutionMap(leagueId);
    if (map.size === 0) return rows;
    const enriched = applyPickResolutionsToRows(rows, map);
    void persistPickResolutions(leagueId, map);
    return enriched;
  } catch (err) {
    console.warn(
      "[trade_log] pick resolution skipped:",
      err instanceof Error ? err.message : err,
    );
    return rows;
  }
}

/** Debounced player search helper (server). */
export function searchTradePlayers(
  catalog: TradePlayerOption[],
  query: string,
  limit = 12,
): TradePlayerOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return catalog.slice(0, limit);
  return catalog
    .filter((p) => {
      const hay = `${p.fullName} ${p.position ?? ""} ${p.nflTeam ?? ""}`.toLowerCase();
      return hay.includes(q);
    })
    .slice(0, limit);
}
