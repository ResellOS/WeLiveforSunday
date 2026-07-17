import { loadLeagueSnapshot, effectiveWeek } from "@/lib/league";
import { getNFLState } from "@/lib/sleeper";
import { loadLeagueActivity } from "@/lib/leagueActivity";

export const dynamic = "force-dynamic";

export async function GET() {
  const leagueId = process.env.SLEEPER_LEAGUE_ID;
  if (!leagueId) {
    return Response.json(
      { error: "League not configured", mode: "activity", items: [], live: false },
      { status: 503 },
    );
  }

  try {
    const [state, snapshot] = await Promise.all([
      getNFLState(),
      loadLeagueSnapshot(leagueId),
    ]);
    const week = effectiveWeek(state.week);
    const payload = await loadLeagueActivity(
      leagueId,
      week,
      snapshot.standings,
    );
    return Response.json(payload);
  } catch (err) {
    console.error("[league-activity]", err);
    return Response.json(
      {
        error: "Failed to load league activity",
        mode: "activity",
        items: [],
        live: false,
      },
      { status: 500 },
    );
  }
}
