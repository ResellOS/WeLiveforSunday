/**
 * Run: npx tsx lib/trades/buildTradeWeb.test.ts
 */
import assert from "node:assert/strict";
import {
  buildTradeWeb,
  collectAssetForwardPath,
  expandKey,
} from "@/lib/trades/buildTradeWeb";
import type { TradeLogRow, TradeTeamInfo } from "@/lib/trades/tradeTreeTypes";

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
    season_year: partial.season_year ?? 2025,
    week: 1,
    transaction_id: partial.transaction_id,
    trade_date: partial.trade_date,
    asset_type: partial.asset_type ?? "player",
    asset_id: partial.asset_id,
    player_id: partial.player_id ?? partial.asset_id,
    player_name: partial.player_name ?? `P${partial.asset_id}`,
    player_position: "WR",
    nfl_team: "PHI",
    draft_season: partial.draft_season ?? null,
    draft_round: partial.draft_round ?? null,
    original_roster_id: partial.original_roster_id ?? null,
    from_roster_id: partial.from_roster_id,
    to_roster_id: partial.to_roster_id,
  };
}

const teams: Record<number, TradeTeamInfo> = {
  1: { rosterId: 1, teamName: "CIOS", managerName: "a", avatar: null, accentColor: "#1" },
  2: {
    rosterId: 2,
    teamName: "Turn Your Head and Goff",
    managerName: "b",
    avatar: null,
    accentColor: "#2",
  },
  3: { rosterId: 3, teamName: "C", managerName: "c", avatar: null, accentColor: "#3" },
};

const rows: TradeLogRow[] = [
  row({
    transaction_id: "t1",
    trade_date: "2025-01-01T00:00:00.000Z",
    asset_id: "R",
    player_name: "Root",
    from_roster_id: 1,
    to_roster_id: 2,
  }),
  row({
    transaction_id: "t1",
    trade_date: "2025-01-01T00:00:00.000Z",
    asset_id: "X",
    player_name: "Counterpart",
    from_roster_id: 2,
    to_roster_id: 1,
  }),
  row({
    transaction_id: "t2",
    trade_date: "2025-06-01T00:00:00.000Z",
    asset_id: "R",
    player_name: "Root",
    from_roster_id: 2,
    to_roster_id: 3,
  }),
  row({
    transaction_id: "t3",
    trade_date: "2025-07-01T00:00:00.000Z",
    asset_id: "X",
    player_name: "Counterpart",
    from_roster_id: 1,
    to_roster_id: 3,
  }),
];

const players = [
  {
    playerId: "R",
    fullName: "Root",
    position: "WR",
    nflTeam: "PHI",
    imageUrl: "/x.jpg",
    ownerRosterId: 3,
    ownerName: "C",
  },
];

const collapsed = buildTradeWeb({
  rootAssetId: "R",
  seasonYear: 2025,
  rows,
  teams,
  players,
});

assert.equal(
  collapsed.nodes.filter((n) => n.kind === "transaction").length,
  1,
  "starts with only Trade #1",
);
assert.ok(
  collapsed.nodes.every((n) => n.kind === "transaction"),
  "no root or owner nodes",
);

const t1 = collapsed.nodes.find(
  (n) => n.kind === "transaction" && n.transactionId === "t1",
);
assert.ok(t1 && t1.kind === "transaction");
assert.equal(t1.leftTeamName, "CIOS");
assert.equal(t1.rightTeamName, "Turn Your Head and Goff");
assert.ok(t1.leftReceived.some((a) => a.assetId === "X" && a.canExpand));
assert.ok(t1.rightReceived.some((a) => a.assetId === "R" && a.canExpand));

const expandedRoot = buildTradeWeb({
  rootAssetId: "R",
  seasonYear: 2025,
  rows,
  teams,
  players,
  expandedKeys: new Set([expandKey("t1", "R")]),
});
assert.equal(
  expandedRoot.nodes.filter((n) => n.kind === "transaction").length,
  2,
  "expanding root reveals Trade #2",
);
assert.ok(
  expandedRoot.nodes.some(
    (n) => n.kind === "transaction" && n.transactionId === "t2",
  ),
);
assert.ok(
  expandedRoot.nodes.every((n) => n.kind === "transaction"),
  "still no root or owner after full expand",
);

const expandedX = buildTradeWeb({
  rootAssetId: "R",
  seasonYear: 2025,
  rows,
  teams,
  players,
  expandedKeys: new Set([expandKey("t1", "X")]),
});
assert.equal(
  expandedX.nodes.filter((n) => n.kind === "transaction").length,
  2,
  "expanding counterpart reveals its next trade",
);
const path = collectAssetForwardPath(expandedX, "X", "txn:t1");
assert.ok(path.nodeIds.has("txn:t3"));

console.log("buildTradeWeb tests passed");
