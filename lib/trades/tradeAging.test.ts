/**
 * Run: npx tsx lib/trades/tradeAging.test.ts
 */

import { valueAtAging, valueAtTrade } from "@/lib/trades/pickValue";
import type { TradeLogRow } from "@/lib/trades/tradeTreeTypes";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

const pickUnresolved: TradeLogRow = {
  id: "1",
  league_id: "L",
  season_year: 2025,
  week: 1,
  transaction_id: "t1",
  trade_date: "2025-09-01T00:00:00.000Z",
  asset_type: "draft_pick",
  asset_id: "pick:2026:1:3",
  player_id: null,
  player_name: null,
  player_position: null,
  nfl_team: null,
  draft_season: 2026,
  draft_round: 1,
  original_roster_id: 3,
  from_roster_id: 1,
  to_roster_id: 2,
  resolved_player_id: null,
  resolved_player_name: null,
};

const pickResolved: TradeLogRow = {
  ...pickUnresolved,
  id: "2",
  resolved_player_id: "999",
  resolved_player_name: "Rookie Star",
};

const ktc = new Map<string, number>([["rookie star", 7500]]);

const tradeVal = valueAtTrade(pickUnresolved, ktc, 2026);
const tradeValResolved = valueAtTrade(pickResolved, ktc, 2026);
assert(tradeVal === tradeValResolved, "at-trade ignores resolution");
assert(tradeVal > 0, "pick estimate positive");

const agedUnresolved = valueAtAging(pickUnresolved, ktc, 2026);
assert(agedUnresolved.source === "pick_estimate", "unresolved uses estimate");
assert(agedUnresolved.value === tradeVal, "same estimate");

const agedResolved = valueAtAging(pickResolved, ktc, 2026);
assert(agedResolved.source === "resolved_player_ktc", "resolved uses player ktc");
assert(agedResolved.value === 7500, "uses current ktc");

console.log("tradeAging tests passed");
