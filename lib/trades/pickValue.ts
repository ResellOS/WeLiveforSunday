/**
 * Shared pick / asset valuation helpers.
 *
 * Trade History tug-of-war always uses these estimates for unresolved-style
 * pick value (never the resolved player's live KTC). Aging may substitute
 * resolved-player KTC for the *current* leg of the comparison only.
 */

import type { TradeLogRow } from "@/lib/trades/tradeTreeTypes";

export type AgingValueSource =
  | "player_ktc"
  | "resolved_player_ktc"
  | "pick_estimate"
  | "unknown";

/** Rough dynasty pick anchors when KTC has no pick rows. */
export function estimatePickValue(
  round: number | null | undefined,
  season: number | null | undefined,
  asOfYear: number = new Date().getFullYear(),
): number {
  const base =
    round === 1
      ? 6200
      : round === 2
        ? 3800
        : round === 3
          ? 2200
          : round === 4
            ? 1400
            : 900;
  const year = season ?? asOfYear;
  const yearsOut = Math.max(0, year - asOfYear);
  return Math.round(base * Math.max(0.72, 1 - yearsOut * 0.08));
}

export function playerKtcValue(
  playerName: string | null | undefined,
  ktc: Map<string, number>,
): number {
  const name = playerName?.toLowerCase().trim();
  if (!name) return 0;
  return ktc.get(name) ?? 0;
}

/** Frozen at-trade value — identical methodology to Trade History tug bar. */
export function valueAtTrade(
  row: TradeLogRow,
  ktc: Map<string, number>,
  asOfYear?: number,
): number {
  if (row.asset_type === "draft_pick") {
    return estimatePickValue(row.draft_round, row.draft_season, asOfYear);
  }
  return playerKtcValue(row.player_name, ktc);
}

/**
 * Current aging-time value. Resolved picks use the drafted player's live KTC.
 */
export function valueAtAging(
  row: TradeLogRow,
  ktc: Map<string, number>,
  asOfYear?: number,
): { value: number; source: AgingValueSource } {
  if (row.asset_type === "player") {
    const v = playerKtcValue(row.player_name, ktc);
    return { value: v, source: v > 0 ? "player_ktc" : "unknown" };
  }

  if (row.resolved_player_id && row.resolved_player_name) {
    const v = playerKtcValue(row.resolved_player_name, ktc);
    if (v > 0) {
      return { value: v, source: "resolved_player_ktc" };
    }
  }

  return {
    value: estimatePickValue(row.draft_round, row.draft_season, asOfYear),
    source: "pick_estimate",
  };
}
