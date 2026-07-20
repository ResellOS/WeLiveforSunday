/**
 * Group per-asset trade_log rows into deal summaries for Trade History.
 *
 * Value bar uses KeepTradeCut player values when available, plus a light
 * draft-pick heuristic. Raw KTC numbers are never surfaced in the UI —
 * only a signed -50…+50 tug score (positive = side A gained more value).
 */

import {
  getSortedTradeGroups,
  roundLabel,
} from "@/lib/trades/tradeHelpers";
import { estimatePickValue, playerKtcValue } from "@/lib/trades/pickValue";
import { sleeperPlayerThumb } from "@/lib/sleeperMedia";
import type {
  TradeLogRow,
  TradeTeamInfo,
} from "@/lib/trades/tradeTreeTypes";

export interface TradeHistoryAsset {
  assetId: string;
  assetType: "player" | "draft_pick";
  label: string;
  playerId: string | null;
  playerImageUrl: string | null;
  position: string | null;
  nflTeam: string | null;
  /** Internal value used only for tug scoring — never displayed. */
  value: number;
}

export interface TradeHistorySide {
  rosterId: number;
  teamName: string;
  managerName: string;
  avatar: string | null;
  accentColor: string;
  /** Assets this team gave away (from_roster_id). */
  assetsGiven: TradeHistoryAsset[];
}

export interface TradeHistoryDeal {
  tradeId: string;
  tradeDate: string;
  seasonYear: number;
  week: number | null;
  sideA: TradeHistorySide;
  sideB: TradeHistorySide;
  /**
   * Signed -50…+50. Positive pulls toward side A (A received more value).
   * Negative pulls toward side B. 0 = even.
   */
  tugScore: number;
  /** Asset to root the Trade Tree on when opening this deal. */
  primaryAssetId: string;
  primaryAssetType: "player" | "draft_pick";
  playerNames: string[];
}

/**
 * At-trade value for the tug-of-war bar.
 * Draft picks always use the pick estimate — never resolved_player KTC.
 */
function assetValue(row: TradeLogRow, ktc: Map<string, number>): number {
  if (row.asset_type === "draft_pick") {
    return estimatePickValue(row.draft_round, row.draft_season);
  }
  return playerKtcValue(row.player_name, ktc);
}

function assetLabel(row: TradeLogRow): string {
  if (row.asset_type === "draft_pick") {
    const season = row.draft_season ?? "????";
    return `${season} ${roundLabel(row.draft_round)}`;
  }
  return row.player_name ?? row.player_id ?? row.asset_id;
}

function toHistoryAsset(
  row: TradeLogRow,
  ktc: Map<string, number>,
): TradeHistoryAsset {
  return {
    assetId: row.asset_id,
    assetType: row.asset_type,
    label: assetLabel(row),
    playerId: row.player_id,
    playerImageUrl: row.player_id ? sleeperPlayerThumb(row.player_id) : null,
    position: row.player_position,
    nflTeam: row.nfl_team,
    value: assetValue(row, ktc),
  };
}

function buildSide(
  rosterId: number,
  assetsGiven: TradeHistoryAsset[],
  teams: Record<number, TradeTeamInfo>,
): TradeHistorySide {
  const t = teams[rosterId];
  return {
    rosterId,
    teamName: t?.teamName ?? `Roster #${rosterId}`,
    managerName: t?.managerName ?? `Roster #${rosterId}`,
    avatar: t?.avatar ?? null,
    accentColor: t?.accentColor ?? "#D4A94E",
    assetsGiven,
  };
}

/**
 * Convert received-value totals into a signed -50…+50 tug score.
 * Positive = side A received more dynasty value.
 */
export function computeTugScore(valueReceivedA: number, valueReceivedB: number): number {
  const total = valueReceivedA + valueReceivedB;
  if (total <= 0) return 0;
  const raw = ((valueReceivedA - valueReceivedB) / total) * 50;
  return Math.max(-50, Math.min(50, Math.round(raw * 10) / 10));
}

function pickPrimaryAsset(rows: TradeLogRow[], ktc: Map<string, number>): TradeLogRow {
  const scored = [...rows].sort((a, b) => {
    // Prefer players over picks, then higher value.
    const typeRank = (r: TradeLogRow) => (r.asset_type === "player" ? 1 : 0);
    const diff = typeRank(b) - typeRank(a);
    if (diff !== 0) return diff;
    return assetValue(b, ktc) - assetValue(a, ktc);
  });
  return scored[0];
}

/** Resolve the two primary sides of a deal (supports multi-team by top volume). */
function resolvePair(rows: TradeLogRow[]): [number, number] {
  const volume = new Map<number, number>();
  for (const r of rows) {
    volume.set(r.from_roster_id, (volume.get(r.from_roster_id) ?? 0) + 1);
    volume.set(r.to_roster_id, (volume.get(r.to_roster_id) ?? 0) + 1);
  }
  const ranked = [...volume.entries()].sort((a, b) => b[1] - a[1]);
  if (ranked.length === 0) return [0, 0];
  if (ranked.length === 1) return [ranked[0][0], ranked[0][0]];
  // Stable ordering: lower roster id as side A when volumes tie for display consistency
  // Prefer the earliest "from" roster as side A for chronological left/right feel.
  const a = rows[0]?.from_roster_id ?? ranked[0][0];
  const b =
    ranked.find(([id]) => id !== a)?.[0] ??
    ranked[1]?.[0] ??
    a;
  return [a, b];
}

export function buildTradeHistoryDeals(
  rows: TradeLogRow[],
  teams: Record<number, TradeTeamInfo>,
  ktc: Map<string, number>,
): TradeHistoryDeal[] {
  const groups = getSortedTradeGroups(rows);
  const deals: TradeHistoryDeal[] = [];

  for (const group of groups) {
    if (group.rows.length === 0) continue;
    const [rosterA, rosterB] = resolvePair(group.rows);
    // Skip malformed single-party rows.
    if (rosterA === rosterB) continue;

    const givenA = group.rows
      .filter((r) => r.from_roster_id === rosterA)
      .map((r) => toHistoryAsset(r, ktc));
    const givenB = group.rows
      .filter((r) => r.from_roster_id === rosterB)
      .map((r) => toHistoryAsset(r, ktc));

    // Value gained = value of assets received (to_roster).
    const receivedA = group.rows
      .filter((r) => r.to_roster_id === rosterA)
      .reduce((sum, r) => sum + assetValue(r, ktc), 0);
    const receivedB = group.rows
      .filter((r) => r.to_roster_id === rosterB)
      .reduce((sum, r) => sum + assetValue(r, ktc), 0);

    const primary = pickPrimaryAsset(group.rows, ktc);
    const playerNames = group.rows
      .filter((r) => r.asset_type === "player" && r.player_name)
      .map((r) => r.player_name as string);

    deals.push({
      tradeId: group.transactionId,
      tradeDate: group.tradeDate,
      seasonYear: group.rows[0].season_year,
      week: group.rows[0].week,
      sideA: buildSide(rosterA, givenA, teams),
      sideB: buildSide(rosterB, givenB, teams),
      tugScore: computeTugScore(receivedA, receivedB),
      primaryAssetId: primary.asset_id,
      primaryAssetType: primary.asset_type,
      playerNames,
    });
  }

  return deals;
}

export function resolveTradeDeepLink(
  rows: TradeLogRow[],
  tradeId: string,
  ktc: Map<string, number> = new Map(),
): {
  primaryAssetId: string;
  seasonYear: number;
  tradeDate: string;
} | null {
  const txnRows = rows.filter((r) => r.transaction_id === tradeId);
  if (txnRows.length === 0) return null;
  const primary = pickPrimaryAsset(txnRows, ktc);
  return {
    primaryAssetId: primary.asset_id,
    seasonYear: primary.season_year,
    tradeDate: primary.trade_date,
  };
}

export type TradeHistorySort = "newest" | "oldest";

export function filterTradeHistoryDeals(
  deals: TradeHistoryDeal[],
  opts: {
    season: number | "all";
    rosterId: number | "all";
    query: string;
    sort: TradeHistorySort;
  },
): TradeHistoryDeal[] {
  const q = opts.query.trim().toLowerCase();
  let out = deals.filter((d) => {
    if (opts.season !== "all" && d.seasonYear !== opts.season) return false;
    if (
      opts.rosterId !== "all" &&
      d.sideA.rosterId !== opts.rosterId &&
      d.sideB.rosterId !== opts.rosterId
    ) {
      return false;
    }
    if (q) {
      const hay = [
        d.sideA.teamName,
        d.sideB.teamName,
        d.sideA.managerName,
        d.sideB.managerName,
        ...d.playerNames,
        ...d.sideA.assetsGiven.map((a) => a.label),
        ...d.sideB.assetsGiven.map((a) => a.label),
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  out = [...out].sort((a, b) => {
    const cmp = a.tradeDate.localeCompare(b.tradeDate);
    if (cmp !== 0) return opts.sort === "newest" ? -cmp : cmp;
    return opts.sort === "newest"
      ? b.tradeId.localeCompare(a.tradeId)
      : a.tradeId.localeCompare(b.tradeId);
  });

  return out;
}
