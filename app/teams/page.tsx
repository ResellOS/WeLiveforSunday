import type { Metadata } from "next";
import { Suspense } from "react";
import {
  loadLeagueSnapshot,
  computeRecentForm,
} from "@/lib/league";
import { getRosters, getAllPlayers, getNFLState } from "@/lib/sleeper";
import { getTradedPicks } from "@/lib/league";
import type { PlayerMap } from "@/types/sleeper";
import { getKtcValueMap, getSeasons } from "@/lib/queries";
import { getSeasonChain } from "@/lib/records";
import { computeLeagueHonors } from "@/lib/stats";
import { Panel, EmptyState } from "@/components/ui/Panel";
import { TeamsSidebar } from "@/components/teams/TeamsSidebar";
import { FranchiseHonors } from "@/components/teams/FranchiseHonors";
import { TeamsPageContent } from "@/components/teams/TeamsPageContent";
import { TrophyGlyph } from "@/components/trophy/TrophyGlyph";
import { parseTeamsView } from "@/lib/teams/views";
import { buildOwnedPicksByRoster } from "@/lib/teams/draftCapital";
import {
  championshipsByRoster,
  computeTeamMetrics,
} from "@/lib/teams/metrics";
import { computeTeamPowerRankings } from "@/lib/teams/powerRanking";
import { loadCurrentOpponent } from "@/lib/teams/schedule";
import type { TeamCardData } from "@/lib/teams/types";
import { effectiveWeek } from "@/lib/league";

export const metadata: Metadata = { title: "Teams" };
export const dynamic = "force-dynamic";

function resolveMyRosterId(
  rosters: Awaited<ReturnType<typeof getRosters>>,
): number | null {
  const rosterEnv = process.env.SLEEPER_ROSTER_ID;
  if (rosterEnv) {
    const id = parseInt(rosterEnv, 10);
    if (!Number.isNaN(id)) return id;
  }
  const userEnv = process.env.SLEEPER_USER_ID;
  if (userEnv) {
    const match = rosters.find((r) => r.owner_id === userEnv);
    if (match) return match.roster_id;
  }
  return null;
}

export default async function TeamsPage({
  searchParams,
}: {
  searchParams?: { view?: string };
}) {
  const leagueId = process.env.SLEEPER_LEAGUE_ID;
  if (!leagueId) {
    return (
      <EmptyState
        title="League not configured"
        message="Set SLEEPER_LEAGUE_ID in .env.local to load teams."
      />
    );
  }

  const view = parseTeamsView(searchParams?.view);

  const [snapshot, rosters, players, ktc, tradedPicks, seasons, chain, nfl] =
    await Promise.all([
      loadLeagueSnapshot(leagueId),
      getRosters(leagueId),
      getAllPlayers().catch((): PlayerMap => ({})),
      getKtcValueMap(),
      getTradedPicks(leagueId).catch(() => []),
      getSeasons(),
      getSeasonChain(leagueId),
      getNFLState().catch(() => null),
    ]);

  const { league, standings } = snapshot;
  const form = await computeRecentForm(
    leagueId,
    league,
    rosters.map((r) => r.roster_id),
  ).catch(() => new Map<number, number>());

  const picksMap = buildOwnedPicksByRoster(league, rosters, tradedPicks);
  const champs = championshipsByRoster(seasons);
  const metricsMap = computeTeamMetrics(
    standings,
    players,
    ktc,
    picksMap,
    champs,
  );

  const powerRankings = computeTeamPowerRankings(
    standings,
    players,
    ktc,
    form,
  );

  const powerRankByRoster = new Map(
    powerRankings.map((p) => [p.rosterId, p.rank]),
  );
  const powerScoreByRoster = new Map(
    powerRankings.map((p) => [p.rosterId, p.score]),
  );

  const cards: TeamCardData[] = standings.map((t) => {
    const m = metricsMap.get(t.rosterId)!;
    const pr = powerRankings.find((p) => p.rosterId === t.rosterId);
    return {
      rosterId: t.rosterId,
      rank: t.rank,
      teamName: t.teamName,
      managerName: t.managerName,
      avatar: t.avatar,
      wins: t.wins,
      losses: t.losses,
      ties: t.ties,
      pct: t.pct,
      status: t.status,
      powerScore: pr?.score ?? 0,
      powerRank: powerRankByRoster.get(t.rosterId) ?? t.rank,
      rosterValue: m.rosterValue.total,
      rosterValueAvailable: m.rosterValue.hasKtc,
      avgAge: m.ages.overall,
      draftCapital: m.draftPickCount,
      pointsFor: t.pointsFor,
      pointsAgainst: t.pointsAgainst,
      championships: m.championships,
      powerComponents: pr?.components,
    };
  });

  const metricsByRoster = Object.fromEntries(metricsMap);
  const picksByRoster = Object.fromEntries(picksMap);
  const hasKtc = ktc.size > 0;
  const preseason = powerRankings[0]?.preseason ?? false;

  const myRosterId = resolveMyRosterId(rosters);
  const myTeam = myRosterId
    ? cards.find((c) => c.rosterId === myRosterId) ?? null
    : null;

  const currentWeek = effectiveWeek(
    nfl?.week ?? league.settings.leg ?? 1,
  );
  const teamsByRoster = new Map(standings.map((t) => [t.rosterId, t]));
  const myTeamOpponent =
    myRosterId != null
      ? await loadCurrentOpponent(
          leagueId,
          myRosterId,
          currentWeek,
          teamsByRoster,
        )
      : null;

  const honors = await computeLeagueHonors(seasons, chain);
  const teamCount = standings.length;

  return (
    <div className="trophy-page teams-page">
      <div className="history-grid teams-layout">
        <aside className="trophy-side teams-side">
          <Suspense fallback={<div className="teams-sidebar-loading" />}>
            <TeamsSidebar />
          </Suspense>
        </aside>

        <section className="trophy-main teams-main">
          <Panel className="panel--banner trophy-banner-body">
            <div className="trophy-banner-title">
              <span className="trophy-banner-icon" aria-hidden="true">
                <TrophyGlyph name="franchises" />
              </span>
              <div>
                <h1 className="trophy-banner-word">Teams</h1>
                <p className="trophy-banner-sub teams-banner-sub">
                  <span>{teamCount} Founding Franchises</span>
                </p>
              </div>
            </div>
          </Panel>

          <TeamsPageContent
            view={view}
            teams={cards}
            powerRankings={powerRankings}
            metricsByRoster={metricsByRoster}
            picksByRoster={picksByRoster}
            myTeam={myTeam}
            myTeamOpponent={myTeamOpponent}
            hasKtc={hasKtc}
            preseason={preseason}
          />

          <FranchiseHonors honors={honors} />
        </section>
      </div>
    </div>
  );
}
