/**
 * Manually resolve traded draft picks → drafted players.
 *
 *   npx tsx scripts/resolve-picks.ts
 *   npx tsx scripts/resolve-picks.ts --aging
 *   npx tsx scripts/resolve-picks.ts --aging --year=2026
 */

import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const leagueId = process.env.SLEEPER_LEAGUE_ID;
  if (!leagueId) throw new Error("SLEEPER_LEAGUE_ID missing");

  const { resolveTradedPicks } = await import("../lib/pick-resolution");
  const result = await resolveTradedPicks(leagueId);
  console.log(
    JSON.stringify(
      {
        draftsChecked: result.draftsChecked,
        resolutions: result.resolutions.size,
        rowsUpdated: result.rowsUpdated,
        notes: result.notes,
        sample: [...result.resolutions.entries()].slice(0, 8),
      },
      null,
      2,
    ),
  );

  if (process.argv.includes("--aging")) {
    const yearArg = process.argv.find((a) => a.startsWith("--year="));
    const year = yearArg
      ? Number(yearArg.split("=")[1])
      : new Date().getFullYear();
    const { runTradeAging } = await import("../lib/trades/tradeAging");
    const aging = await runTradeAging(leagueId, year);
    console.log(JSON.stringify(aging, null, 2));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
