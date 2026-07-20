import { NextResponse } from "next/server";
import { resolveTradedPicks } from "@/lib/pick-resolution";
import { runTradeAging } from "@/lib/trades/tradeAging";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Year-end (or on-demand) trade aging.
 * Runs pick resolution first so aged pick values can use resolved player KTC.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const leagueId = process.env.SLEEPER_LEAGUE_ID;
  if (!leagueId) {
    return NextResponse.json(
      { error: "SLEEPER_LEAGUE_ID is not configured" },
      { status: 500 },
    );
  }

  const url = new URL(request.url);
  const yearParam = Number(url.searchParams.get("year"));
  const agingYear = Number.isFinite(yearParam)
    ? yearParam
    : new Date().getFullYear();

  try {
    const resolution = await resolveTradedPicks(leagueId);
    const aging = await runTradeAging(leagueId, agingYear);
    return NextResponse.json({
      ok: true,
      resolution: {
        draftsChecked: resolution.draftsChecked,
        resolutions: resolution.resolutions.size,
        rowsUpdated: resolution.rowsUpdated,
        notes: resolution.notes,
      },
      aging,
    });
  } catch (err) {
    console.error("[cron/trade-aging]", err);
    return NextResponse.json(
      { error: "Trade aging failed" },
      { status: 500 },
    );
  }
}
