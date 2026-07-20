/**
 * Run: npx tsx lib/trades/tradeHistory.test.ts
 */

import {
  buildTradeHistoryDeals,
  computeTugScore,
  filterTradeHistoryDeals,
  resolveTradeDeepLink,
} from "@/lib/trades/tradeHistory";
import type { TradeLogRow, TradeTeamInfo } from "@/lib/trades/tradeTreeTypes";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

assert(computeTugScore(100, 100) === 0, "even");
assert(computeTugScore(150, 50) === 25, "A favor");
assert(computeTugScore(50, 150) === -25, "B favor");
assert(computeTugScore(0, 0) === 0, "zero total");

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
};

const rows: TradeLogRow[] = [
  {
    id: "1",
    league_id: "L",
    season_year: 2026,
    week: 1,
    transaction_id: "txn1",
    trade_date: "2026-09-01T00:00:00.000Z",
    asset_type: "player",
    asset_id: "p1",
    player_id: "p1",
    player_name: "Star Player",
    player_position: "WR",
    nfl_team: "PHI",
    draft_season: null,
    draft_round: null,
    original_roster_id: null,
    from_roster_id: 1,
    to_roster_id: 2,
  },
  {
    id: "2",
    league_id: "L",
    season_year: 2026,
    week: 1,
    transaction_id: "txn1",
    trade_date: "2026-09-01T00:00:00.000Z",
    asset_type: "player",
    asset_id: "p2",
    player_id: "p2",
    player_name: "Role Player",
    player_position: "RB",
    nfl_team: "DET",
    draft_season: null,
    draft_round: null,
    original_roster_id: null,
    from_roster_id: 2,
    to_roster_id: 1,
  },
];

const ktc = new Map<string, number>([
  ["star player", 8000],
  ["role player", 3000],
]);

const deals = buildTradeHistoryDeals(rows, teams, ktc);
assert(deals.length === 1, "one deal");
assert(deals[0].tradeId === "txn1", "trade id");
assert(deals[0].primaryAssetId === "p1", "primary is higher KTC player");
assert(deals[0].tugScore !== 0, "uneven tug");

const link = resolveTradeDeepLink(rows, "txn1", ktc);
assert(link?.primaryAssetId === "p1", "deep link primary");

const filtered = filterTradeHistoryDeals(deals, {
  season: 2026,
  rosterId: 1,
  query: "star",
  sort: "newest",
});
assert(filtered.length === 1, "filter hit");

const miss = filterTradeHistoryDeals(deals, {
  season: "all",
  rosterId: "all",
  query: "nobody",
  sort: "oldest",
});
assert(miss.length === 0, "filter miss");

console.log("tradeHistory tests passed");
