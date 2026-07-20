/**
 * Interactive Trade Tree web: Trade #1 first, then expand assets on demand.
 */

import {
  formatTradeDate,
  getSortedTradeGroups,
  roundLabel,
} from "@/lib/trades/tradeHelpers";
import { sleeperPlayerThumb } from "@/lib/sleeperMedia";
import { teamColorForRoster } from "@/lib/config/teamColors";
import { rowsMatchingAsset } from "@/lib/trades/buildTradeSpine";
import type {
  TradeLogRow,
  TradePlayerOption,
  TradeTeamInfo,
} from "@/lib/trades/tradeTreeTypes";

export const TRADE_WEB_MAX_DEPTH = 15;

export function expandKey(transactionId: string, assetId: string): string {
  return `${transactionId}::${assetId}`;
}

export interface WebAssetItem {
  assetId: string;
  traceIds: string[];
  assetType: "player" | "draft_pick";
  label: string;
  meta: string | null;
  imageUrl: string | null;
  pickBadge: string | null;
  accentColor: string;
  isRootAsset: boolean;
  /** Which bilateral panel this asset sits in. */
  side: "left" | "right";
  /** Further trade exists after this deal. */
  canExpand: boolean;
  /** User has expanded this asset from this deal. */
  isExpanded: boolean;
  /** Child txn node id when expanded. */
  nextTxnNodeId: string | null;
}

export interface WebTxnNode {
  id: string;
  kind: "transaction";
  tradeIndex: number;
  transactionId: string;
  tradeDate: string;
  tradeDateLabel: string;
  leftRosterId: number;
  rightRosterId: number;
  leftTeamName: string;
  rightTeamName: string;
  /** Assets the left team received. */
  leftReceived: WebAssetItem[];
  /** Assets the right team received. */
  rightReceived: WebAssetItem[];
  depth: number;
  focalAssetId: string;
}

export type WebNode = WebTxnNode;

export interface WebEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  assetId?: string;
  kind: "asset-to-txn";
}

export interface TradeWeb {
  rootAssetId: string;
  nodes: WebNode[];
  edges: WebEdge[];
  noTrades: boolean;
  rootPathTxnIds: string[];
}

export interface BuildTradeWebInput {
  rootAssetId: string;
  seasonYear: number;
  rows: TradeLogRow[];
  teams: Record<number, TradeTeamInfo>;
  /** Kept for call-site compatibility; not used by the web graph. */
  players?: TradePlayerOption[];
  rootTransactionId?: string | null;
  maxDepth?: number;
  /** Keys from expandKey(transactionId, assetId). Empty = only first trade. */
  expandedKeys?: ReadonlySet<string>;
}

function teamName(
  teams: Record<number, TradeTeamInfo>,
  rosterId: number,
): string {
  return teams[rosterId]?.teamName ?? `Team ${rosterId}`;
}

function teamAccent(
  teams: Record<number, TradeTeamInfo>,
  rosterId: number,
): string {
  return teams[rosterId]?.accentColor ?? teamColorForRoster(rosterId);
}

function assetDisplayLabel(row: TradeLogRow): string {
  if (row.asset_type === "draft_pick") {
    if (row.resolved_player_name) {
      const round = row.draft_round != null ? roundLabel(row.draft_round) : "Pick";
      return `${round} ${row.draft_season ?? ""} → ${row.resolved_player_name}`.trim();
    }
    const round = row.draft_round != null ? roundLabel(row.draft_round) : "Pick";
    return `${round} ${row.draft_season ?? ""}`.trim();
  }
  return row.player_name ?? row.asset_id;
}

function assetMeta(row: TradeLogRow): string | null {
  if (row.asset_type === "draft_pick") {
    return row.resolved_player_name ? "Resolved pick" : "Draft pick";
  }
  const parts = [row.player_position, row.nfl_team].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

function assetImage(row: TradeLogRow): string | null {
  if (row.asset_type === "player" && (row.player_id || row.asset_id)) {
    return sleeperPlayerThumb(row.player_id ?? row.asset_id);
  }
  if (row.resolved_player_id) return sleeperPlayerThumb(row.resolved_player_id);
  return null;
}

function pickBadge(row: TradeLogRow): string | null {
  if (row.asset_type !== "draft_pick" || row.resolved_player_id) return null;
  const round = row.draft_round != null ? roundLabel(row.draft_round) : "Pick";
  return `${round}\n${row.draft_season ?? ""}`.trim();
}

function formatLongDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return formatTradeDate(iso);
  return d
    .toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    })
    .toUpperCase();
}

function traceIdsForRow(row: TradeLogRow): string[] {
  const ids = new Set<string>([row.asset_id]);
  if (row.player_id) ids.add(row.player_id);
  if (row.resolved_player_id) ids.add(row.resolved_player_id);
  return [...ids];
}

function rowMatchesTrace(row: TradeLogRow, traceIds: string[]): boolean {
  return traceIds.some(
    (id) =>
      row.asset_id === id ||
      row.player_id === id ||
      row.resolved_player_id === id,
  );
}

export function getNextTradeForTrace(
  rows: TradeLogRow[],
  traceIds: string[],
  afterTradeDate: string,
  afterTransactionId: string,
): TradeLogRow | null {
  const candidates = rows
    .filter((r) => rowMatchesTrace(r, traceIds))
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

function groupLookup(rows: TradeLogRow[]): Map<string, TradeLogRow[]> {
  const map = new Map<string, TradeLogRow[]>();
  for (const group of getSortedTradeGroups(rows)) {
    map.set(group.transactionId, group.rows);
  }
  return map;
}

function toWebAsset(
  row: TradeLogRow,
  teams: Record<number, TradeTeamInfo>,
  rootAssetId: string,
  side: "left" | "right",
  canExpand: boolean,
  isExpanded: boolean,
): WebAssetItem {
  const isRoot =
    row.asset_id === rootAssetId ||
    row.player_id === rootAssetId ||
    row.resolved_player_id === rootAssetId;

  return {
    assetId: row.asset_id,
    traceIds: traceIdsForRow(row),
    assetType: row.asset_type,
    label: assetDisplayLabel(row),
    meta: assetMeta(row),
    imageUrl: assetImage(row),
    pickBadge: pickBadge(row),
    accentColor: teamAccent(teams, row.to_roster_id),
    isRootAsset: isRoot,
    side,
    canExpand,
    isExpanded,
    nextTxnNodeId: null,
  };
}

function firstMoveInWindow(
  matched: TradeLogRow[],
  seasonYear: number,
  rootTransactionId?: string | null,
): TradeLogRow | null {
  const seasonStart = `${seasonYear}-01-01T00:00:00.000Z`;
  const moves = matched
    .filter((r) => r.season_year >= seasonYear || r.trade_date >= seasonStart)
    .sort((a, b) => {
      if (a.trade_date !== b.trade_date) return a.trade_date.localeCompare(b.trade_date);
      return a.transaction_id.localeCompare(b.transaction_id);
    });

  // Deep-links no longer slice the chain — they expand + camera-focus instead.
  // rootTransactionId is ignored for the start window so Trade #N numbering stays chronological.
  void rootTransactionId;
  return moves[0] ?? null;
}

/**
 * Expand keys needed so the root asset's chain reveals `targetTransactionId`.
 */
export function expandKeysToRevealTrade(
  rows: TradeLogRow[],
  rootAssetId: string,
  seasonYear: number,
  targetTransactionId: string,
): Set<string> {
  const matched = rowsMatchingAsset(rows, rootAssetId);
  const seasonStart = `${seasonYear}-01-01T00:00:00.000Z`;
  const moves = matched
    .filter((r) => r.season_year >= seasonYear || r.trade_date >= seasonStart)
    .sort((a, b) => {
      if (a.trade_date !== b.trade_date) return a.trade_date.localeCompare(b.trade_date);
      return a.transaction_id.localeCompare(b.transaction_id);
    });

  // Dedupe to one row per transaction (root asset's move in that deal).
  const seen = new Set<string>();
  const ordered: TradeLogRow[] = [];
  for (const m of moves) {
    if (seen.has(m.transaction_id)) continue;
    seen.add(m.transaction_id);
    ordered.push(m);
  }

  const keys = new Set<string>();
  const targetIdx = ordered.findIndex(
    (m) => m.transaction_id === targetTransactionId,
  );
  if (targetIdx <= 0) return keys;

  for (let i = 0; i < targetIdx; i++) {
    keys.add(expandKey(ordered[i].transaction_id, ordered[i].asset_id));
  }
  return keys;
}

export function buildTradeWeb(input: BuildTradeWebInput): TradeWeb {
  const {
    rootAssetId,
    seasonYear,
    rows,
    teams,
    rootTransactionId,
    maxDepth = TRADE_WEB_MAX_DEPTH,
    expandedKeys = new Set<string>(),
  } = input;

  const matched = rowsMatchingAsset(rows, rootAssetId);
  const byTxn = groupLookup(rows);
  const first = firstMoveInWindow(matched, seasonYear, rootTransactionId);

  const nodes: WebNode[] = [];
  const edges: WebEdge[] = [];
  const txnById = new Map<string, WebTxnNode>();
  const building = new Set<string>();
  let tradeCounter = 0;
  const rootPathTxnIds: string[] = [];

  function ensureTxn(
    move: TradeLogRow,
    focalAssetId: string,
    depth: number,
  ): string | null {
    const existing = txnById.get(move.transaction_id);
    if (existing) return existing.id;
    if (depth > maxDepth) return null;
    if (building.has(move.transaction_id)) return null;

    building.add(move.transaction_id);
    tradeCounter += 1;
    const nodeId = `txn:${move.transaction_id}`;

    // Bilateral panels from the focal asset's two sides.
    const leftRosterId = move.from_roster_id;
    const rightRosterId = move.to_roster_id;
    const dealRows = byTxn.get(move.transaction_id) ?? [move];

    const makeSide = (
      side: "left" | "right",
      rosterId: number,
    ): WebAssetItem[] =>
      dealRows
        .filter((r) => r.to_roster_id === rosterId)
        .map((r) => {
          const next = getNextTradeForTrace(
            rows,
            traceIdsForRow(r),
            move.trade_date,
            move.transaction_id,
          );
          const key = expandKey(move.transaction_id, r.asset_id);
          const isExpanded = Boolean(next && expandedKeys.has(key));
          return toWebAsset(
            r,
            teams,
            rootAssetId,
            side,
            Boolean(next),
            isExpanded,
          );
        });

    const leftReceived = makeSide("left", leftRosterId);
    const rightReceived = makeSide("right", rightRosterId);

    const node: WebTxnNode = {
      id: nodeId,
      kind: "transaction",
      tradeIndex: tradeCounter,
      transactionId: move.transaction_id,
      tradeDate: move.trade_date,
      tradeDateLabel: formatLongDate(move.trade_date),
      leftRosterId,
      rightRosterId,
      leftTeamName: teamName(teams, leftRosterId),
      rightTeamName: teamName(teams, rightRosterId),
      leftReceived,
      rightReceived,
      depth,
      focalAssetId,
    };

    txnById.set(move.transaction_id, node);
    nodes.push(node);

    const expandSide = (items: WebAssetItem[]) => {
      for (const item of items) {
        if (!item.canExpand || !item.isExpanded) continue;
        const next = getNextTradeForTrace(
          rows,
          item.traceIds,
          move.trade_date,
          move.transaction_id,
        );
        if (!next) continue;
        const childId = ensureTxn(next, item.assetId, depth + 1);
        if (!childId) continue;
        item.nextTxnNodeId = childId;
        edges.push({
          id: `e:${nodeId}:${item.side}:${item.assetId}->${childId}`,
          source: nodeId,
          target: childId,
          sourceHandle: `asset-${item.side}-${item.assetId}`,
          targetHandle: "in",
          assetId: item.assetId,
          kind: "asset-to-txn",
        });
      }
    };

    expandSide(leftReceived);
    expandSide(rightReceived);

    building.delete(move.transaction_id);
    return nodeId;
  }

  if (!first) {
    return {
      rootAssetId,
      nodes,
      edges,
      noTrades: true,
      rootPathTxnIds,
    };
  }

  const firstTxnId = ensureTxn(first, rootAssetId, 1);
  if (firstTxnId) {
    // Visible root-asset path only (expanded chain) — used for layout hints.
    const rootTrace = [rootAssetId];
    let walk: TradeLogRow | null = first;
    while (walk) {
      if (!txnById.has(walk.transaction_id)) break;
      rootPathTxnIds.push(`txn:${walk.transaction_id}`);
      const next = getNextTradeForTrace(
        rows,
        rootTrace,
        walk.trade_date,
        walk.transaction_id,
      );
      if (!next) break;
      // Root asset id in packages may be player id — also try matched asset ids on that txn.
      const txnNode = txnById.get(walk.transaction_id);
      const rootItem = txnNode
        ? [...txnNode.leftReceived, ...txnNode.rightReceived].find((a) =>
            a.traceIds.includes(rootAssetId),
          )
        : null;
      const expandId = rootItem?.assetId ?? rootAssetId;
      if (!expandedKeys.has(expandKey(walk.transaction_id, expandId))) break;
      walk = next;
    }
  }

  return {
    rootAssetId,
    nodes,
    edges,
    noTrades: false,
    rootPathTxnIds,
  };
}

export function collectAssetForwardPath(
  web: TradeWeb,
  assetId: string,
  fromTxnNodeId: string | null,
): { nodeIds: Set<string>; edgeIds: Set<string>; assetKeys: Set<string> } {
  const nodeIds = new Set<string>();
  const edgeIds = new Set<string>();
  const assetKeys = new Set<string>();

  if (!fromTxnNodeId) return { nodeIds, edgeIds, assetKeys };

  const txnNodes = web.nodes.filter(
    (n): n is WebTxnNode => n.kind === "transaction",
  );
  if (!txnNodes.some((n) => n.id === fromTxnNodeId)) {
    return { nodeIds, edgeIds, assetKeys };
  }

  const queue: string[] = [fromTxnNodeId];
  const seen = new Set<string>();

  while (queue.length) {
    const id = queue.shift()!;
    if (seen.has(id)) continue;
    seen.add(id);
    nodeIds.add(id);

    const node = txnNodes.find((n) => n.id === id);
    if (!node) continue;

    const items = [...node.leftReceived, ...node.rightReceived].filter(
      (a) => a.traceIds.includes(assetId) || a.assetId === assetId,
    );
    for (const item of items) {
      assetKeys.add(`${node.id}:${item.side}:${item.assetId}`);
      if (item.nextTxnNodeId) {
        const edge = web.edges.find(
          (e) =>
            e.source === node.id &&
            e.target === item.nextTxnNodeId &&
            e.assetId === item.assetId,
        );
        if (edge) edgeIds.add(edge.id);
        queue.push(item.nextTxnNodeId);
      }
    }
  }

  for (const e of web.edges) {
    if (e.target === fromTxnNodeId && e.assetId === assetId) {
      edgeIds.add(e.id);
      nodeIds.add(e.source);
    }
  }

  return { nodeIds, edgeIds, assetKeys };
}
