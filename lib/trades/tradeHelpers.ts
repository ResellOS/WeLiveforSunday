/**
 * Pure helpers for trade_log ownership / grouping.
 *
 * Schema assumptions (from Sleeper-normalized trade_log rows):
 * - One row per asset moved in a completed trade.
 * - `from_roster_id` sent the asset; `to_roster_id` received it.
 * - Rows sharing `transaction_id` form one multi-asset deal.
 * - Draft picks use asset_id `pick:{season}:{round}:{original_roster_id}`.
 * - Player rows use Sleeper `player_id` as `asset_id`.
 */

import type { TradeLogRow } from "@/lib/trades/tradeTreeTypes";

/** Group trade_log rows by transaction_id (insertion order preserved per group). */
export function groupRowsByTransaction(
  rows: TradeLogRow[],
): Map<string, TradeLogRow[]> {
  const map = new Map<string, TradeLogRow[]>();
  for (const row of rows) {
    const list = map.get(row.transaction_id);
    if (list) list.push(row);
    else map.set(row.transaction_id, [row]);
  }
  return map;
}

/** Chronological unique transaction groups (earliest first). */
export function getSortedTradeGroups(
  rows: TradeLogRow[],
): Array<{ transactionId: string; tradeDate: string; rows: TradeLogRow[] }> {
  const groups = groupRowsByTransaction(rows);
  const list = [...groups.entries()].map(([transactionId, groupRows]) => {
    const tradeDate = groupRows.reduce(
      (min, r) => (r.trade_date < min ? r.trade_date : min),
      groupRows[0].trade_date,
    );
    return { transactionId, tradeDate, rows: groupRows };
  });
  list.sort((a, b) => {
    if (a.tradeDate !== b.tradeDate) return a.tradeDate.localeCompare(b.tradeDate);
    return a.transactionId.localeCompare(b.transactionId);
  });
  return list;
}

/** All asset rows in the same deal except the focal asset. */
export function getAssetsExchangedWithRoot(
  transactionRows: TradeLogRow[],
  rootAssetId: string,
): TradeLogRow[] {
  return transactionRows.filter((r) => r.asset_id !== rootAssetId);
}

/**
 * Next trade for an asset after a given trade date / transaction.
 * Prefers strictly later trade_date; ties broken by transaction_id.
 */
export function getNextTradeForAsset(
  rows: TradeLogRow[],
  assetId: string,
  afterTradeDate: string,
  afterTransactionId: string,
): TradeLogRow | null {
  const candidates = rows
    .filter((r) => r.asset_id === assetId)
    .filter((r) => {
      if (r.trade_date > afterTradeDate) return true;
      if (r.trade_date < afterTradeDate) return false;
      return r.transaction_id > afterTransactionId;
    })
    .sort((a, b) => {
      if (a.trade_date !== b.trade_date) {
        return a.trade_date.localeCompare(b.trade_date);
      }
      return a.transaction_id.localeCompare(b.transaction_id);
    });
  return candidates[0] ?? null;
}

/** First trade for an asset at or after the season window start. */
export function getFirstTradeForAsset(
  rows: TradeLogRow[],
  assetId: string,
  seasonYear: number,
): TradeLogRow | null {
  const seasonStart = `${seasonYear}-01-01T00:00:00.000Z`;
  const candidates = rows
    .filter((r) => r.asset_id === assetId)
    .filter(
      (r) => r.season_year >= seasonYear || r.trade_date >= seasonStart,
    )
    .sort((a, b) => {
      if (a.trade_date !== b.trade_date) {
        return a.trade_date.localeCompare(b.trade_date);
      }
      return a.transaction_id.localeCompare(b.transaction_id);
    });
  return candidates[0] ?? null;
}

/** Specific asset row within a transaction (for tradeId deep-links). */
export function getAssetRowInTransaction(
  rows: TradeLogRow[],
  assetId: string,
  transactionId: string,
): TradeLogRow | null {
  return (
    rows.find(
      (r) => r.asset_id === assetId && r.transaction_id === transactionId,
    ) ?? null
  );
}

/** Latest completed move for an asset (any season), or null. */
export function getLatestTradeForAsset(
  rows: TradeLogRow[],
  assetId: string,
): TradeLogRow | null {
  const candidates = rows
    .filter((r) => r.asset_id === assetId)
    .sort((a, b) => {
      if (a.trade_date !== b.trade_date) {
        return b.trade_date.localeCompare(a.trade_date);
      }
      return b.transaction_id.localeCompare(a.transaction_id);
    });
  return candidates[0] ?? null;
}

export function resolveReceivingRoster(row: TradeLogRow): number {
  return row.to_roster_id;
}

export function resolveSendingRoster(row: TradeLogRow): number {
  return row.from_roster_id;
}

/** Owner of the asset immediately after this transaction (recipient). */
export function resolveAssetOwnerAtTransaction(row: TradeLogRow): number {
  return row.to_roster_id;
}

export function visitedKey(assetId: string, transactionId: string): string {
  return `${assetId}::${transactionId}`;
}

export function makeNodeId(assetId: string, transactionId: string, isRoot = false): string {
  return isRoot
    ? `root::${assetId}::${transactionId}`
    : `node::${assetId}::${transactionId}`;
}

/** Stable draft-pick asset key matching the trade_log migration. */
export function draftPickAssetId(
  season: string | number,
  round: number,
  originalRosterId: number,
): string {
  return `pick:${season}:${round}:${originalRosterId}`;
}

export function formatTradeDate(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function roundLabel(round: number | undefined | null): string {
  if (round == null) return "Pick";
  if (round === 1) return "1st";
  if (round === 2) return "2nd";
  if (round === 3) return "3rd";
  return `${round}th`;
}
