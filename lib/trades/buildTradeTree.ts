/**
 * buildTradeTree — pure genealogy builder over trade_log rows.
 *
 * Assumptions:
 * - Selected season finds the root asset's first trade at/after that season.
 * - Child nodes are the OTHER assets in that same transaction.
 * - Expanding a node reveals assets exchanged in that asset's NEXT trade.
 * - Visited key is assetId + transactionId (an asset may reappear later).
 * - Pick→player conversions are never fabricated.
 */

import {
  getAssetsExchangedWithRoot,
  getFirstTradeForAsset,
  getNextTradeForAsset,
  groupRowsByTransaction,
  makeNodeId,
  resolveAssetOwnerAtTransaction,
  roundLabel,
  visitedKey,
} from "@/lib/trades/tradeHelpers";
import { sleeperPlayerThumb } from "@/lib/sleeperMedia";
import type {
  BuildTradeTreeResult,
  TradeLogRow,
  TradeTeamInfo,
  TradeTreeNode,
  TradeTreeNodeData,
} from "@/lib/trades/tradeTreeTypes";

export interface BuildTradeTreeInput {
  rootAssetId: string;
  seasonYear: number;
  rows: TradeLogRow[];
  /** Node instance ids that are expanded (not asset ids alone). */
  expandedNodeIds: ReadonlySet<string>;
  teams: Record<number, TradeTeamInfo>;
}

function ownerMeta(
  rosterId: number,
  teams: Record<number, TradeTeamInfo>,
): Pick<
  TradeTreeNodeData,
  "ownerRosterId" | "ownerName" | "ownerAvatarUrl" | "teamColor"
> {
  const t = teams[rosterId];
  return {
    ownerRosterId: String(rosterId),
    ownerName: t?.teamName ?? `Roster #${rosterId}`,
    ownerAvatarUrl: t?.avatar ?? undefined,
    teamColor: t?.accentColor ?? "#D4A94E",
  };
}

function rowToData(
  row: TradeLogRow,
  teams: Record<number, TradeTeamInfo>,
  opts: {
    hasChildren: boolean;
    isExpanded: boolean;
    isRoot?: boolean;
  },
): TradeTreeNodeData {
  const owner = ownerMeta(resolveAssetOwnerAtTransaction(row), teams);
  if (row.asset_type === "draft_pick") {
    const season = row.draft_season ?? undefined;
    const round = row.draft_round ?? undefined;
    const original =
      row.original_roster_id != null
        ? teams[row.original_roster_id]?.teamName ??
          `Roster #${row.original_roster_id}`
        : undefined;
    return {
      assetId: row.asset_id,
      assetType: "draft_pick",
      label: `${season ?? "????"} ${roundLabel(round)}`,
      draftSeason: season,
      draftRound: round,
      originalOwnerName: original,
      transactionId: row.transaction_id,
      tradeDate: row.trade_date,
      hasChildren: opts.hasChildren,
      isExpanded: opts.isExpanded,
      isRoot: opts.isRoot,
      ...owner,
    };
  }

  const name = row.player_name ?? row.player_id ?? row.asset_id;
  return {
    assetId: row.asset_id,
    assetType: "player",
    label: name,
    playerName: name,
    playerPosition: row.player_position ?? undefined,
    nflTeam: row.nfl_team ?? undefined,
    playerImageUrl: row.player_id
      ? sleeperPlayerThumb(row.player_id)
      : undefined,
    transactionId: row.transaction_id,
    tradeDate: row.trade_date,
    hasChildren: opts.hasChildren,
    isExpanded: opts.isExpanded,
    isRoot: opts.isRoot,
    ...owner,
  };
}

function assetHasLaterTrade(
  rows: TradeLogRow[],
  assetId: string,
  afterTradeDate: string,
  afterTransactionId: string,
): boolean {
  return (
    getNextTradeForAsset(rows, assetId, afterTradeDate, afterTransactionId) !=
    null
  );
}

function expandBranch(
  assetRow: TradeLogRow,
  allRows: TradeLogRow[],
  byTxn: Map<string, TradeLogRow[]>,
  teams: Record<number, TradeTeamInfo>,
  expandedNodeIds: ReadonlySet<string>,
  visited: Set<string>,
  isRoot: boolean,
): TradeTreeNode | null {
  const vKey = visitedKey(assetRow.asset_id, assetRow.transaction_id);
  if (visited.has(vKey)) return null;
  visited.add(vKey);

  const nodeId = makeNodeId(
    assetRow.asset_id,
    assetRow.transaction_id,
    isRoot,
  );
  const isExpanded = isRoot || expandedNodeIds.has(nodeId);

  // Children = other assets in THIS deal (for root / when showing exchange).
  // When expanding later generations, children = assets in the NEXT trade.
  let childRows: TradeLogRow[] = [];
  let childContextTxnId = assetRow.transaction_id;
  let childContextDate = assetRow.trade_date;

  if (isRoot) {
    const txnRows = byTxn.get(assetRow.transaction_id) ?? [assetRow];
    childRows = getAssetsExchangedWithRoot(txnRows, assetRow.asset_id);
  } else if (isExpanded) {
    const next = getNextTradeForAsset(
      allRows,
      assetRow.asset_id,
      assetRow.trade_date,
      assetRow.transaction_id,
    );
    if (next) {
      childContextTxnId = next.transaction_id;
      childContextDate = next.trade_date;
      const txnRows = byTxn.get(next.transaction_id) ?? [next];
      childRows = getAssetsExchangedWithRoot(txnRows, assetRow.asset_id);
    }
  }

  // hasChildren: for collapsed non-root, whether a later trade exists;
  // for root, whether this deal had counterparts; for expanded, whether we have kids.
  let hasChildren = false;
  if (isRoot) {
    hasChildren = childRows.length > 0;
  } else {
    hasChildren = assetHasLaterTrade(
      allRows,
      assetRow.asset_id,
      assetRow.trade_date,
      assetRow.transaction_id,
    );
  }

  const children: TradeTreeNode[] = [];
  if (isExpanded && childRows.length > 0) {
    // Deduplicate assets within the child deal.
    const seenAssets = new Set<string>();
    for (const childRow of childRows) {
      if (seenAssets.has(childRow.asset_id)) continue;
      seenAssets.add(childRow.asset_id);
      // Use the child asset's own row from that transaction.
      const branch = expandBranch(
        childRow,
        allRows,
        byTxn,
        teams,
        expandedNodeIds,
        visited,
        false,
      );
      if (branch) children.push(branch);
    }
  }

  void childContextTxnId;
  void childContextDate;

  return {
    id: nodeId,
    parentId: null, // filled by caller when attaching
    data: rowToData(assetRow, teams, {
      hasChildren,
      isExpanded: isExpanded && hasChildren,
      isRoot,
    }),
    children,
  };
}

function attachParents(node: TradeTreeNode, parentId: string | null): void {
  node.parentId = parentId;
  for (const child of node.children) attachParents(child, node.id);
}

function flattenVisible(node: TradeTreeNode): TradeTreeNode[] {
  const out: TradeTreeNode[] = [node];
  if (node.data.isExpanded) {
    for (const child of node.children) {
      out.push(...flattenVisible(child));
    }
  }
  return out;
}

export function buildTradeTree(input: BuildTradeTreeInput): BuildTradeTreeResult {
  const { rootAssetId, seasonYear, rows, expandedNodeIds, teams } = input;

  const first = getFirstTradeForAsset(rows, rootAssetId, seasonYear);
  if (!first) {
    return {
      root: null,
      visibleNodes: [],
      noTrades: true,
      seasonMode: "start_in_season_continue_forward",
    };
  }

  const byTxn = groupRowsByTransaction(rows);
  const visited = new Set<string>();
  const root = expandBranch(
    first,
    rows,
    byTxn,
    teams,
    expandedNodeIds,
    visited,
    true,
  );

  if (!root) {
    return {
      root: null,
      visibleNodes: [],
      noTrades: true,
      seasonMode: "start_in_season_continue_forward",
    };
  }

  // Root's first generation is always visible (expanded by default).
  root.data.isExpanded = true;
  root.data.hasChildren = root.children.length > 0;
  attachParents(root, null);

  return {
    root,
    visibleNodes: flattenVisible(root),
    noTrades: false,
    seasonMode: "start_in_season_continue_forward",
  };
}
