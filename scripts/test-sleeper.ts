/**
 * test-sleeper.ts
 *
 * Exercises every function in lib/sleeper.ts against the real Sleeper API using
 * SLEEPER_LEAGUE_ID from .env.local, and prints a summary so you can confirm
 * real data comes back.
 *
 * Usage: npm run test:sleeper
 */

import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

// lib/sleeper only imports types from "@/types/*" (type-only, erased at runtime),
// so a relative import works fine under tsx without path-alias config.
import {
  getLeague,
  getRosters,
  getUsers,
  getMatchups,
  getTransactions,
  getPlayoffBracket,
  getDraft,
  getDraftPicks,
  getNFLState,
  getTradedPicks,
} from "../lib/sleeper";

function ok(label: string, detail: string) {
  console.log(`  ✓ ${label.padEnd(20)} ${detail}`);
}

async function main() {
  const leagueId = process.env.SLEEPER_LEAGUE_ID;
  if (!leagueId) {
    throw new Error("SLEEPER_LEAGUE_ID is not set in .env.local.");
  }

  console.log(`Testing Sleeper client against league ${leagueId}\n`);

  const state = await getNFLState();
  ok("getNFLState", `season ${state.season}, week ${state.week} (${state.season_type})`);

  const league = await getLeague(leagueId);
  ok("getLeague", `"${league.name}" — ${league.total_rosters} teams, ${league.season}`);

  const rosters = await getRosters(leagueId);
  ok("getRosters", `${rosters.length} rosters`);

  const users = await getUsers(leagueId);
  ok("getUsers", `${users.length} users`);

  const week = Math.max(1, state.week || 1);
  const matchups = await getMatchups(leagueId, week);
  ok("getMatchups", `week ${week}: ${matchups?.length ?? 0} entries`);

  const txns = await getTransactions(leagueId, week);
  ok("getTransactions", `week ${week}: ${txns?.length ?? 0} transactions`);

  const bracket = await getPlayoffBracket(leagueId);
  ok("getPlayoffBracket", `${bracket?.length ?? 0} bracket matchups`);

  const tradedPicks = await getTradedPicks(leagueId);
  ok("getTradedPicks", `${tradedPicks?.length ?? 0} traded picks`);

  if (league.draft_id) {
    const draft = await getDraft(league.draft_id);
    ok("getDraft", `${draft.type} draft, status ${draft.status}`);

    const picks = await getDraftPicks(league.draft_id);
    ok("getDraftPicks", `${picks?.length ?? 0} picks`);
  } else {
    console.log("  - getDraft/getDraftPicks skipped (league has no draft_id)");
  }

  console.log("\nAll Sleeper client functions returned data ✓");
}

main().catch((err) => {
  console.error(`\nSleeper test FAILED: ${(err as Error).message}`);
  process.exit(1);
});
