/**
 * Run: npx tsx lib/trades/buildTradeSpine.test.ts
 */
import assert from "node:assert/strict";
import { buildTradeSpine } from "@/lib/trades/buildTradeSpine";
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
    id: partial.id ?? `${partial.transaction_id}:${partial.asset_id}`,
    league_id: "L1",
    season_year: partial.season_year ?? 2025,
    week: partial.week ?? 1,
    transaction_id: partial.transaction_id,
    trade_date: partial.trade_date,
    asset_type: partial.asset_type ?? "player",
    asset_id: partial.asset_id,
    player_id: partial.player_id ?? partial.asset_id,
    player_name: partial.player_name ?? `Player ${partial.asset_id}`,
    player_position: partial.player_position ?? "WR",
    nfl_team: partial.nfl_team ?? "PHI",
    draft_season: partial.draft_season ?? null,
    draft_round: partial.draft_round ?? null,
    original_roster_id: partial.original_roster_id ?? null,
    from_roster_id: partial.from_roster_id,
    to_roster_id: partial.to_roster_id,
    resolved_player_id: partial.resolved_player_id ?? null,
    resolved_player_name: partial.resolved_player_name ?? null,
    resolved_at: partial.resolved_at ?? null,
  };
}

const teams: Record<number, TradeTeamInfo> = {
  1: {
    rosterId: 1,
    teamName: "CIOS",
    managerName: "A",
    avatar: null,
    accentColor: "#C9A227",
  },
  2: {
    rosterId: 2,
    teamName: "DETHRONEDCP",
    managerName: "B",
    avatar: null,
    accentColor: "#4A7DB8",
  },
};

const rows: TradeLogRow[] = [
  // Trade 1: CIOS sends DeVonta + pick, receives Waddle
  row({
    transaction_id: "t1",
    trade_date: "2024-12-01T12:00:00.000Z",
    season_year: 2024,
    asset_id: "5859",
    player_name: "DeVonta Smith",
    from_roster_id: 1,
    to_roster_id: 2,
  }),
  row({
    transaction_id: "t1",
    trade_date: "2024-12-01T12:00:00.000Z",
    season_year: 2024,
    asset_type: "draft_pick",
    asset_id: "pick:2025:1:1",
    player_id: null,
    player_name: null,
    draft_season: 2025,
    draft_round: 1,
    original_roster_id: 1,
    from_roster_id: 1,
    to_roster_id: 2,
  }),
  row({
    transaction_id: "t1",
    trade_date: "2024-12-01T12:00:00.000Z",
    season_year: 2024,
    asset_id: "4037",
    player_name: "Jaylen Waddle",
    from_roster_id: 2,
    to_roster_id: 1,
  }),
  // Trade 2: back to CIOS
  row({
    transaction_id: "t2",
    trade_date: "2025-06-01T12:00:00.000Z",
    season_year: 2025,
    asset_id: "5859",
    player_name: "DeVonta Smith",
    from_roster_id: 2,
    to_roster_id: 1,
  }),
  row({
    transaction_id: "t2",
    trade_date: "2025-06-01T12:00:00.000Z",
    season_year: 2025,
    asset_id: "7526",
    player_name: "Devon Achane",
    from_roster_id: 1,
    to_roster_id: 2,
  }),
];

const spine = buildTradeSpine({
  rootAssetId: "5859",
  seasonYear: 2024,
  rows,
  teams,
  players: [
    {
      playerId: "5859",
      fullName: "DeVonta Smith",
      position: "WR",
      nflTeam: "PHI",
      imageUrl: "https://example.com/x.jpg",
      ownerRosterId: 1,
      ownerName: "CIOS",
    },
  ],
});

assert.equal(spine.root?.label, "DeVonta Smith");
assert.equal(spine.transactions.length, 2);
assert.equal(spine.transactions[0].fromTeamName, "CIOS");
assert.equal(spine.transactions[0].toTeamName, "DETHRONEDCP");
assert.ok(
  spine.transactions[0].sent.some((a) => a.assetId === "5859"),
  "root asset appears in sent",
);
assert.ok(
  spine.transactions[0].received.some((a) => a.assetId === "4037"),
  "counterpart appears in received",
);
assert.equal(spine.currentOwner?.teamName, "CIOS");
assert.equal(spine.noTrades, false);

console.log("buildTradeSpine tests passed");
