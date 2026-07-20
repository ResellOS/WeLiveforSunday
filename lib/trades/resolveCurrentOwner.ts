/**
 * Resolve who currently owns a trade-tree asset for the Current Owner badge.
 *
 * - Resolved draft picks → live roster of the drafted player (falls back to
 *   that player's latest trade recipient, then who won the pick).
 * - Players → live roster, else latest trade recipient, else this deal's to_roster.
 * - Unresolved picks → latest pick trade recipient, else this deal's to_roster.
 */

import {
  getLatestTradeForAsset,
  resolveAssetOwnerAtTransaction,
} from "@/lib/trades/tradeHelpers";
import type { TradeLogRow } from "@/lib/trades/tradeTreeTypes";

export function resolveCurrentOwnerRosterId(
  row: TradeLogRow,
  allRows: TradeLogRow[],
  liveOwnerByPlayerId: ReadonlyMap<string, number>,
): number {
  if (row.asset_type === "draft_pick" && row.resolved_player_id) {
    const live = liveOwnerByPlayerId.get(row.resolved_player_id);
    if (live != null) return live;
    const latestPlayerMove = getLatestTradeForAsset(
      allRows,
      row.resolved_player_id,
    );
    if (latestPlayerMove) return latestPlayerMove.to_roster_id;
    return resolveAssetOwnerAtTransaction(row);
  }

  if (row.asset_type === "player") {
    const playerId = row.player_id ?? row.asset_id;
    const live = liveOwnerByPlayerId.get(playerId);
    if (live != null) return live;
    const latest = getLatestTradeForAsset(allRows, row.asset_id);
    if (latest) return latest.to_roster_id;
    return resolveAssetOwnerAtTransaction(row);
  }

  // Unresolved pick
  const latestPick = getLatestTradeForAsset(allRows, row.asset_id);
  if (latestPick) return latestPick.to_roster_id;
  return resolveAssetOwnerAtTransaction(row);
}
