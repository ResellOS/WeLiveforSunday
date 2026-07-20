/**
 * Lightweight assertions for buildTradeTree (run via: npx tsx lib/trades/buildTradeTree.test.ts)
 * DEV-ONLY harness — not shipped to production UI.
 */

import { buildTradeTree } from "@/lib/trades/buildTradeTree";
import type { TradeLogRow, TradeTeamInfo } from "@/lib/trades/tradeTreeTypes";

const teams: Record<number, TradeTeamInfo> = {
  1: {
    rosterId: 1,
    teamName: "Alpha",
    managerName: "A",
    avatar: null,
    accentColor: "#40a867",
  },
  2: {
    rosterId: 2,
    teamName: "Beta",
    managerName: "B",
    avatar: null,
    accentColor: "#7eb8e8",
  },
  3: {
    rosterId: 3,
    teamName: "Gamma",
    managerName: "C",
    avatar: null,
    accentColor: "#d57367",
  },
};

function row(
  partial: Partial<TradeLogRow> &
    Pick<
      TradeLogRow,
      | "transaction_id"
      | "trade_date"
      | "asset_id"
      | "from_roster_id"
      | "to_roster_id"
    >,
): TradeLogRow {
  return {
    id: `${partial.transaction_id}:${partial.asset_id}`,
    league_id: "L1",
    season_year: 2026,
    week: 1,
    asset_type: "player",
    player_id: partial.asset_id.startsWith("pick:") ? null : partial.asset_id,
    player_name: partial.asset_id.startsWith("pick:") ? null : partial.asset_id,
    player_position: "RB",
    nfl_team: "ATL",
    draft_season: null,
    draft_round: null,
    original_roster_id: null,
    ...partial,
  };
}

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

// Player traded once: root + one counterpart
{
  const rows = [
    row({
      transaction_id: "t1",
      trade_date: "2026-09-01T00:00:00.000Z",
      asset_id: "bijan",
      from_roster_id: 1,
      to_roster_id: 2,
    }),
    row({
      transaction_id: "t1",
      trade_date: "2026-09-01T00:00:00.000Z",
      asset_id: "gibbs",
      from_roster_id: 2,
      to_roster_id: 1,
    }),
  ];
  const tree = buildTradeTree({
    rootAssetId: "bijan",
    seasonYear: 2026,
    rows,
    expandedNodeIds: new Set(),
    teams,
  });
  assert(tree.root, "expected root");
  assert(tree.root!.children.length === 1, "expected one child");
  assert(tree.root!.children[0].data.assetId === "gibbs", "child should be gibbs");
  assert(!tree.root!.children[0].data.isExpanded, "child starts collapsed");
}

// Child later traded again + draft pick
{
  const rows = [
    row({
      transaction_id: "t1",
      trade_date: "2026-09-01T00:00:00.000Z",
      asset_id: "bijan",
      from_roster_id: 1,
      to_roster_id: 2,
    }),
    row({
      transaction_id: "t1",
      trade_date: "2026-09-01T00:00:00.000Z",
      asset_id: "gibbs",
      from_roster_id: 2,
      to_roster_id: 1,
    }),
    row({
      transaction_id: "t1",
      trade_date: "2026-09-01T00:00:00.000Z",
      asset_id: "pick:2027:1:3",
      asset_type: "draft_pick",
      player_id: null,
      player_name: null,
      draft_season: 2027,
      draft_round: 1,
      original_roster_id: 3,
      from_roster_id: 2,
      to_roster_id: 1,
    }),
    row({
      transaction_id: "t2",
      trade_date: "2026-10-01T00:00:00.000Z",
      asset_id: "gibbs",
      from_roster_id: 1,
      to_roster_id: 3,
    }),
    row({
      transaction_id: "t2",
      trade_date: "2026-10-01T00:00:00.000Z",
      asset_id: "waddle",
      from_roster_id: 3,
      to_roster_id: 1,
    }),
  ];
  const gibbsNodeId = "node::gibbs::t1";
  const tree = buildTradeTree({
    rootAssetId: "bijan",
    seasonYear: 2026,
    rows,
    expandedNodeIds: new Set([gibbsNodeId]),
    teams,
  });
  assert(tree.root!.children.length === 2, "two first-gen assets");
  const gibbs = tree.root!.children.find((c) => c.data.assetId === "gibbs");
  assert(gibbs?.data.hasChildren, "gibbs has later trade");
  assert(gibbs?.data.isExpanded, "gibbs expanded");
  assert(gibbs?.children.length === 1, "gibbs next deal counterpart");
  assert(gibbs?.children[0].data.assetId === "waddle", "waddle child");
}

// No trades
{
  const tree = buildTradeTree({
    rootAssetId: "nobody",
    seasonYear: 2026,
    rows: [],
    expandedNodeIds: new Set(),
    teams,
  });
  assert(tree.noTrades, "no trades flag");
}

// Circular return: bijan traded away then back — visited key prevents loop
{
  const rows = [
    row({
      transaction_id: "t1",
      trade_date: "2026-09-01T00:00:00.000Z",
      asset_id: "bijan",
      from_roster_id: 1,
      to_roster_id: 2,
    }),
    row({
      transaction_id: "t1",
      trade_date: "2026-09-01T00:00:00.000Z",
      asset_id: "gibbs",
      from_roster_id: 2,
      to_roster_id: 1,
    }),
    row({
      transaction_id: "t2",
      trade_date: "2026-11-01T00:00:00.000Z",
      asset_id: "gibbs",
      from_roster_id: 1,
      to_roster_id: 2,
    }),
    row({
      transaction_id: "t2",
      trade_date: "2026-11-01T00:00:00.000Z",
      asset_id: "bijan",
      from_roster_id: 2,
      to_roster_id: 1,
    }),
  ];
  const gibbsNodeId = "node::gibbs::t1";
  const tree = buildTradeTree({
    rootAssetId: "bijan",
    seasonYear: 2026,
    rows,
    expandedNodeIds: new Set([gibbsNodeId]),
    teams,
  });
  const gibbs = tree.root!.children[0];
  assert(gibbs.children.some((c) => c.data.assetId === "bijan"), "bijan can reappear");
  // Expanding bijan's later appearance should not infinite-loop
  const bijanReturnId = gibbs.children.find((c) => c.data.assetId === "bijan")!.id;
  const tree2 = buildTradeTree({
    rootAssetId: "bijan",
    seasonYear: 2026,
    rows,
    expandedNodeIds: new Set([gibbsNodeId, bijanReturnId]),
    teams,
  });
  assert(tree2.visibleNodes.length < 20, "no runaway recursion");
}

console.log("buildTradeTree tests passed");
