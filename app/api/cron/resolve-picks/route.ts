import { NextResponse } from "next/server";
import { resolveTradedPicks } from "@/lib/pick-resolution";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Scheduled pick → player resolution.
 * Secure with CRON_SECRET (Vercel Cron sends Authorization: Bearer <CRON_SECRET>).
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

  try {
    const result = await resolveTradedPicks(leagueId);
    return NextResponse.json({
      ok: true,
      draftsChecked: result.draftsChecked,
      resolutions: result.resolutions.size,
      rowsUpdated: result.rowsUpdated,
      notes: result.notes,
    });
  } catch (err) {
    console.error("[cron/resolve-picks]", err);
    return NextResponse.json(
      { error: "Pick resolution failed" },
      { status: 500 },
    );
  }
}
