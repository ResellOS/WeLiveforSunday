/**
 * Resolve traded draft picks in trade_log to the players eventually selected
 * at those draft slots (Sleeper completed drafts).
 *
 * Matching rule (snake / linear drafts):
 * - trade_log pick key = pick:{season}:{round}:{original_roster_id}
 * - Sleeper draft.slot_to_roster_id maps draft_slot → original roster
 * - A completed DraftPick at (round, draft_slot) is the player that pick became
 *
 * Auction drafts are skipped (no stable slot mapping).
 */

import {
  getDraft,
  getDraftPicks,
  getAllPlayers,
  playerName,
} from "@/lib/sleeper";
import { getSeasonChain } from "@/lib/records";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { draftPickAssetId } from "@/lib/trades/tradeHelpers";
import type { TradeLogRow } from "@/lib/trades/tradeTreeTypes";
import type { Draft, DraftPick, League, PlayerMap } from "@/types/sleeper";

export interface PickResolution {
  playerId: string;
  playerName: string;
}

export interface ResolvePicksResult {
  /** asset_id → resolution */
  resolutions: Map<string, PickResolution>;
  /** Number of trade_log rows updated in Supabase (0 if unavailable). */
  rowsUpdated: number;
  /** Draft seasons inspected. */
  draftsChecked: number;
  /** Human-readable notes for logs. */
  notes: string[];
}

function pickLabelFromMetadata(pick: DraftPick, players: PlayerMap): string {
  const fromMap = playerName(players, pick.player_id);
  if (fromMap && fromMap !== pick.player_id) return fromMap;
  const meta = pick.metadata;
  if (meta?.first_name || meta?.last_name) {
    return [meta.first_name, meta.last_name].filter(Boolean).join(" ");
  }
  return pick.player_id;
}

/**
 * Build asset_id → drafted player for every completed non-auction draft
 * in the league season chain.
 */
export async function buildPickResolutionMap(
  leagueId: string,
): Promise<{ map: Map<string, PickResolution>; draftsChecked: number; notes: string[] }> {
  const notes: string[] = [];
  const map = new Map<string, PickResolution>();
  let draftsChecked = 0;

  const [chain, players] = await Promise.all([
    getSeasonChain(leagueId),
    getAllPlayers().catch((): PlayerMap => ({})),
  ]);

  for (const league of chain) {
    const resolutions = await resolveDraftForLeague(league, players, notes);
    draftsChecked += resolutions.checked ? 1 : 0;
    for (const [assetId, res] of resolutions.map) {
      map.set(assetId, res);
    }
  }

  return { map, draftsChecked, notes };
}

async function resolveDraftForLeague(
  league: League,
  players: PlayerMap,
  notes: string[],
): Promise<{ map: Map<string, PickResolution>; checked: boolean }> {
  const map = new Map<string, PickResolution>();
  if (!league.draft_id) {
    notes.push(`season ${league.season}: no draft_id`);
    return { map, checked: false };
  }

  let draft: Draft;
  try {
    draft = await getDraft(league.draft_id);
  } catch (err) {
    notes.push(
      `season ${league.season}: draft fetch failed (${(err as Error).message})`,
    );
    return { map, checked: false };
  }

  if (draft.status !== "complete") {
    notes.push(`season ${draft.season}: draft status=${draft.status} (skip)`);
    return { map, checked: false };
  }

  if (draft.type === "auction") {
    notes.push(`season ${draft.season}: auction draft (no slot mapping)`);
    return { map, checked: false };
  }

  let picks: DraftPick[];
  try {
    picks = await getDraftPicks(league.draft_id);
  } catch (err) {
    notes.push(
      `season ${draft.season}: picks fetch failed (${(err as Error).message})`,
    );
    return { map, checked: false };
  }

  const slotToRoster = draft.slot_to_roster_id ?? {};
  const season = Number(draft.season);

  for (const pick of picks ?? []) {
    if (!pick.player_id || !pick.round) continue;
    const originalRosterId = slotToRoster[String(pick.draft_slot)];
    if (originalRosterId == null) continue;

    const assetId = draftPickAssetId(season, pick.round, Number(originalRosterId));
    map.set(assetId, {
      playerId: pick.player_id,
      playerName: pickLabelFromMetadata(pick, players),
    });
  }

  notes.push(
    `season ${draft.season}: resolved ${map.size} pick slots from completed draft`,
  );
  return { map, checked: true };
}

/** Apply resolutions onto in-memory trade_log rows (does not write DB). */
export function applyPickResolutionsToRows(
  rows: TradeLogRow[],
  resolutions: Map<string, PickResolution>,
): TradeLogRow[] {
  if (resolutions.size === 0) return rows;
  const now = new Date().toISOString();
  return rows.map((row) => {
    if (row.asset_type !== "draft_pick") return row;
    if (row.resolved_player_id) return row;
    const hit = resolutions.get(row.asset_id);
    if (!hit) return row;
    return {
      ...row,
      resolved_player_id: hit.playerId,
      resolved_player_name: hit.playerName,
      resolved_at: row.resolved_at ?? now,
    };
  });
}

const RESOLVED_SCHEMA_FLAG = "__wlfsTradeLogResolvedColsMissing";

function resolvedColumnsUnavailable(): boolean {
  return Boolean((globalThis as Record<string, unknown>)[RESOLVED_SCHEMA_FLAG]);
}

function markResolvedColumnsUnavailable(): void {
  (globalThis as Record<string, unknown>)[RESOLVED_SCHEMA_FLAG] = true;
}

function isMissingResolvedColumnError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    (m.includes("resolved_player") || m.includes("resolved_at")) &&
    (m.includes("does not exist") ||
      m.includes("could not find the") ||
      m.includes("schema cache"))
  );
}

/**
 * Persist resolutions onto Supabase trade_log rows that are still unresolved.
 * No-op when the table / service role / migration 0003 columns are unavailable.
 */
export async function persistPickResolutions(
  leagueId: string,
  resolutions: Map<string, PickResolution>,
): Promise<number> {
  if (resolutions.size === 0) return 0;
  if (resolvedColumnsUnavailable()) return 0;
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return 0;
  }

  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("trade_log")
      .select("id, asset_id, resolved_player_id")
      .eq("league_id", leagueId)
      .eq("asset_type", "draft_pick")
      .is("resolved_player_id", null);

    if (error) {
      if (isMissingResolvedColumnError(error.message)) {
        markResolvedColumnsUnavailable();
        console.warn(
          "[pick-resolution] resolved_* columns missing — apply supabase/migrations/0003_pick_resolution_and_trade_aging.sql (persist disabled).",
        );
        return 0;
      }
      console.warn("[pick-resolution] select failed:", error.message);
      return 0;
    }

    const pending = (data ?? []).filter((r) => resolutions.has(r.asset_id as string));
    if (pending.length === 0) return 0;

    const now = new Date().toISOString();
    let updated = 0;

    // Update per-row so we only touch matched assets.
    for (const row of pending) {
      const res = resolutions.get(row.asset_id as string);
      if (!res) continue;
      const { error: upErr } = await admin
        .from("trade_log")
        .update({
          resolved_player_id: res.playerId,
          resolved_player_name: res.playerName,
          resolved_at: now,
        })
        .eq("id", row.id);

      if (upErr) {
        if (isMissingResolvedColumnError(upErr.message)) {
          markResolvedColumnsUnavailable();
          console.warn(
            "[pick-resolution] resolved_* columns missing — apply supabase/migrations/0003_pick_resolution_and_trade_aging.sql (persist disabled).",
          );
          return updated;
        }
        console.warn("[pick-resolution] update failed:", upErr.message);
        continue;
      }
      updated += 1;
    }

    return updated;
  } catch (err) {
    console.warn(
      "[pick-resolution] persist unavailable:",
      err instanceof Error ? err.message : err,
    );
    return 0;
  }
}

/**
 * Full job: build resolution map from Sleeper drafts, persist to trade_log,
 * return the map for in-memory enrichment.
 */
export async function resolveTradedPicks(
  leagueId: string,
): Promise<ResolvePicksResult> {
  const { map, draftsChecked, notes } = await buildPickResolutionMap(leagueId);
  const rowsUpdated = await persistPickResolutions(leagueId, map);
  notes.push(`supabase rows updated: ${rowsUpdated}`);
  return {
    resolutions: map,
    rowsUpdated,
    draftsChecked,
    notes,
  };
}
