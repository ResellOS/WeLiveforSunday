import type { Metadata } from "next";
import {
  getSeasons,
  getJerseys,
  getNotableMoments,
} from "@/lib/queries";
import {
  loadLeagueHistory,
  getSeasonChain,
  topWeeklyScores,
} from "@/lib/records";
import { computeAllSeasonMVPs, computeLeagueHonors } from "@/lib/stats";
import { TOTAL_PAYOUTS } from "@/lib/config";
import { Panel, SectionHeading, EmptyState } from "@/components/ui/Panel";
import { StatTile } from "@/components/ui/StatTile";
import { TrophyRoomAwards, type Award } from "@/components/TrophyRoomAwards";
import { fmtPoints, record } from "@/lib/format";

export const metadata: Metadata = { title: "Trophy Room" };
export const dynamic = "force-dynamic";

export default async function TrophyRoomPage() {
  const leagueId = process.env.SLEEPER_LEAGUE_ID;

  const [seasons, jerseys, champMoments, comebackMoments, history, chain] =
    await Promise.all([
      getSeasons(),
      getJerseys(),
      getNotableMoments("championship"),
      getNotableMoments("comeback"),
      leagueId ? loadLeagueHistory(leagueId) : Promise.resolve(null),
      leagueId ? getSeasonChain(leagueId) : Promise.resolve([]),
    ]);

  const [mvps, honors] = await Promise.all([
    computeAllSeasonMVPs(seasons, chain),
    computeLeagueHonors(seasons, chain),
  ]);

  const teamName = (rid: number | null) =>
    rid == null ? null : (history?.latestTeams.get(rid)?.teamName ?? `Roster #${rid}`);

  const latest = seasons[0] ?? null;
  const latestMvp = mvps.find((m) => m.year === latest?.year)?.mvp ?? null;

  // Computed records from Sleeper history.
  const topWeek = history ? topWeeklyScores(history, 1)[0] : undefined;
  const topPlayoff = history
    ? [...history.games]
        .filter((g) => g.isPlayoff)
        .sort((a, b) => b.points - a.points)[0]
    : undefined;

  // Best regular-season record (min 1 game).
  let bestRegular: { rosterId: number; wins: number; losses: number; season: string } | null =
    null;
  if (history) {
    const agg = new Map<string, { rid: number; season: string; w: number; l: number }>();
    for (const g of history.games) {
      if (g.isPlayoff) continue;
      const key = `${g.season}-${g.rosterId}`;
      const cur = agg.get(key) ?? { rid: g.rosterId, season: g.season, w: 0, l: 0 };
      if (g.win) cur.w++;
      else cur.l++;
      agg.set(key, cur);
    }
    for (const v of agg.values()) {
      const pct = v.w / Math.max(1, v.w + v.l);
      const bestPct = bestRegular
        ? bestRegular.wins / Math.max(1, bestRegular.wins + bestRegular.losses)
        : -1;
      if (pct > bestPct)
        bestRegular = { rosterId: v.rid, wins: v.w, losses: v.l, season: v.season };
    }
  }

  const latestComeback = comebackMoments[0] ?? null;

  const awards: Award[] = [
    {
      key: "championship",
      label: "Championship",
      winner: teamName(latest?.champion_roster_id ?? null),
      detail: latest?.championship_score_winner != null
        ? `Title game ${fmtPoints(latest.championship_score_winner)}`
        : null,
      season: latest ? String(latest.year) : null,
      cut: false,
    },
    {
      key: "runnerUp",
      label: "Runner Up",
      winner: teamName(latest?.runner_up_roster_id ?? null),
      detail: null,
      season: latest ? String(latest.year) : null,
      cut: false,
    },
    {
      key: "highestScorer",
      label: "Highest Scorer",
      winner: topWeek?.teamName ?? null,
      detail: topWeek ? `${fmtPoints(topWeek.points)} pts` : null,
      season: topWeek ? `${topWeek.season} · Wk ${topWeek.week}` : null,
      cut: false,
    },
    {
      key: "bestRegular",
      label: "Best Regular Season",
      winner: bestRegular ? teamName(bestRegular.rosterId) : null,
      detail: bestRegular ? record(bestRegular.wins, bestRegular.losses) : null,
      season: bestRegular?.season ?? null,
      cut: false,
    },
    {
      key: "mostPointsWeek",
      label: "Most Points (Week)",
      winner: topWeek?.teamName ?? null,
      detail: topWeek ? `${fmtPoints(topWeek.points)} pts` : null,
      season: topWeek ? `${topWeek.season} · Wk ${topWeek.week}` : null,
      cut: false,
    },
    {
      key: "mostPointsPlayoffs",
      label: "Most Points (Playoffs)",
      winner: topPlayoff ? teamName(topPlayoff.rosterId) : null,
      detail: topPlayoff ? `${fmtPoints(topPlayoff.points)} pts` : null,
      season: topPlayoff ? `${topPlayoff.season} · Wk ${topPlayoff.week}` : null,
      cut: false,
    },
    {
      key: "biggestComeback",
      label: "Biggest Comeback",
      winner: latestComeback ? (teamName(latestComeback.roster_id) ?? latestComeback.title) : null,
      detail: latestComeback?.stat_highlight ?? latestComeback?.description ?? null,
      season: latestComeback?.season_year ? String(latestComeback.season_year) : null,
      cut: false,
    },
    {
      key: "mvp",
      label: "MVP",
      winner: latestMvp?.name ?? null,
      detail: latestMvp ? `${fmtPoints(latestMvp.totalPoints)} pts` : null,
      season: latest ? String(latest.year) : null,
      cut: false,
    },
    // Cut awards (shown disabled in the filter):
    { key: "bestDraft", label: "Best Draft", winner: null, detail: null, season: null, cut: true },
    { key: "tradeOfYear", label: "Trade of the Year", winner: null, detail: null, season: null, cut: true },
    { key: "waiverPickup", label: "Waiver Pickup", winner: null, detail: null, season: null, cut: true },
    { key: "toiletBowl", label: "Toilet Bowl", winner: null, detail: null, season: null, cut: true },
  ];

  const champTeamCurrent = latest ? history?.latestTeams.get(latest.champion_roster_id ?? -1) : undefined;
  const matchupsPlayed = history ? Math.round(history.games.length / 2) : 0;

  return (
    <div className="space-y-8">
      <SectionHeading
        title="Trophy Room"
        subtitle="Champions, hardware, and the honors that define WLFS."
      />

      {/* Featured champion */}
      <Panel className="p-6">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="text-center md:border-r md:border-gold/15">
            <div className="text-5xl">🏆</div>
            <div className="mt-2 font-display text-2xl font-bold text-gold-metallic">
              {teamName(latest?.champion_roster_id ?? null) ?? "TBD"}
            </div>
            <div className="text-sm text-offwhite/60">
              {latest ? `${latest.year} Champion` : "Awaiting first champion"}
            </div>
          </div>
          <div className="md:col-span-2">
            <SectionHeading title="Reigning Champion" />
            {latest ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatTile
                  label="Record"
                  value={
                    champTeamCurrent
                      ? record(champTeamCurrent.wins, champTeamCurrent.losses, champTeamCurrent.ties)
                      : "—"
                  }
                />
                <StatTile
                  label="Points For"
                  value={champTeamCurrent ? fmtPoints(champTeamCurrent.pointsFor) : "—"}
                />
                <StatTile
                  label="Points Against"
                  value={champTeamCurrent ? fmtPoints(champTeamCurrent.pointsAgainst) : "—"}
                />
                <StatTile
                  label="Title Score"
                  value={
                    latest.championship_score_winner != null
                      ? fmtPoints(latest.championship_score_winner)
                      : "—"
                  }
                />
              </div>
            ) : (
              <EmptyState
                title="No champion yet"
                message="The inaugural WLFS champion will be featured here."
              />
            )}
            {champMoments[0] && (
              <p className="mt-4 border-l-2 border-gold/40 pl-3 text-sm italic text-offwhite/70">
                “{champMoments[0].description ?? champMoments[0].title}”
              </p>
            )}
          </div>
        </div>
      </Panel>

      {/* Awards (filterable) */}
      <div>
        <SectionHeading title="Awards" />
        <TrophyRoomAwards awards={awards} />
      </div>

      {/* Championship history grid */}
      <div>
        <SectionHeading title="Championship History" />
        {seasons.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {seasons.map((s) => (
              <div key={s.id} className="panel panel-hover p-4 text-center">
                <div className="text-3xl">🏆</div>
                <div className="mt-1 font-display text-lg font-bold text-gold-metallic">
                  {s.year}
                </div>
                <div className="truncate text-sm text-offwhite">
                  {teamName(s.champion_roster_id)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No banners raised"
            message="Championship cards appear here once the seasons table has champions."
          />
        )}
      </div>

      {/* Jersey wall */}
      <div>
        <SectionHeading title="Championship Jersey Wall" />
        {jerseys.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {jerseys.map((j) => (
              <div key={j.id} className="panel p-4 text-center">
                {j.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={j.image_url}
                    alt={j.player_name ?? "Championship jersey"}
                    className="mx-auto h-32 w-auto object-contain"
                  />
                ) : (
                  <div className="text-5xl">👕</div>
                )}
                <div className="mt-2 font-display font-bold text-offwhite">
                  {j.player_name ?? "—"}
                  {j.jersey_number != null && (
                    <span className="text-gold"> #{j.jersey_number}</span>
                  )}
                </div>
                <div className="text-xs text-offwhite/50">
                  {[j.nfl_team, j.season_year].filter(Boolean).join(" · ")}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Jersey wall is empty"
            message="Add rows to championship_jerseys to hang jerseys on the wall."
          />
        )}
      </div>

      {/* Bottom stat bar */}
      <div>
        <SectionHeading title="By the Numbers" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatTile label="Championships" value={honors.totalChampionships} />
          <StatTile label="Different Champs" value={honors.differentChampions} />
          <StatTile label="MVP Winners" value={honors.mvpWinners} />
          <StatTile label="Total Payouts" value={TOTAL_PAYOUTS} />
          <StatTile label="Matchups Played" value={matchupsPlayed} />
        </div>
      </div>
    </div>
  );
}
