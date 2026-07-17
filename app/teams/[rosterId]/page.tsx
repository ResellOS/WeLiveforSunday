import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  loadLeagueSnapshot,
  computeRecentForm,
  effectiveWeek,
} from "@/lib/league";
import { getTradedPicks } from "@/lib/league";
import {
  getRosters,
  getAllPlayers,
  getNFLState,
} from "@/lib/sleeper";
import type { PlayerMap } from "@/types/sleeper";
import { getKtcValueMap, getSeasons } from "@/lib/queries";
import { EmptyState } from "@/components/ui/Panel";
import { TeamDetailHeader } from "@/components/teams/detail/TeamDetailHeader";
import { TeamRosterPanel } from "@/components/teams/detail/TeamRosterPanel";
import { TeamSchedulePanel } from "@/components/teams/detail/TeamSchedulePanel";
import { TeamSnapshotPanel } from "@/components/teams/detail/TeamSnapshotPanel";
import { TeamDraftCapitalPanel } from "@/components/teams/detail/TeamDraftCapitalPanel";
import { TeamActivityPanel } from "@/components/teams/detail/TeamActivityPanel";
import { buildOwnedPicksByRoster } from "@/lib/teams/draftCapital";
import {
  championshipsByRoster,
  computeTeamMetrics,
} from "@/lib/teams/metrics";
import { computeTeamPowerRankings } from "@/lib/teams/powerRanking";
import { buildRosterRows } from "@/lib/teams/roster";
import { loadTeamSchedule } from "@/lib/teams/schedule";
import { loadTeamActivity } from "@/lib/teams/activity";
import type { TeamCardData } from "@/lib/teams/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { rosterId: string };
}): Promise<Metadata> {
  const id = parseInt(params.rosterId, 10);
  if (Number.isNaN(id)) return { title: "Team" };

  const leagueId = process.env.SLEEPER_LEAGUE_ID;
  if (!leagueId) return { title: "Team" };

  try {
    const { standings } = await loadLeagueSnapshot(leagueId);
    const team = standings.find((t) => t.rosterId === id);
    return { title: team?.teamName ?? "Team" };
  } catch {
    return { title: "Team" };
  }
}

export default async function TeamDetailPage({
  params,
}: {
  params: { rosterId: string };
}) {
  const rosterId = parseInt(params.rosterId, 10);
  if (Number.isNaN(rosterId)) notFound();

  const leagueId = process.env.SLEEPER_LEAGUE_ID;
  if (!leagueId) {
    return (
      <EmptyState
        title="League not configured"
        message="Set SLEEPER_LEAGUE_ID in .env.local to load teams."
      />
    );
  }

  const [snapshot, rosters, players, ktc, tradedPicks, seasons, nfl] =
    await Promise.all([
      loadLeagueSnapshot(leagueId),
      getRosters(leagueId),
      getAllPlayers().catch((): PlayerMap => ({})),
      getKtcValueMap(),
      getTradedPicks(leagueId).catch(() => []),
      getSeasons(),
      getNFLState().catch(() => null),
    ]);

  const { league, standings } = snapshot;
  const standing = standings.find((t) => t.rosterId === rosterId);
  const roster = rosters.find((r) => r.roster_id === rosterId);
  if (!standing || !roster) notFound();

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
  const metrics = metricsMap.get(rosterId)!;

  const powerRankings = computeTeamPowerRankings(
    standings,
    players,
    ktc,
    form,
  );
  const pr = powerRankings.find((p) => p.rosterId === rosterId);

  const teamCard: TeamCardData = {
    rosterId: standing.rosterId,
    rank: standing.rank,
    teamName: standing.teamName,
    managerName: standing.managerName,
    avatar: standing.avatar,
    wins: standing.wins,
    losses: standing.losses,
    ties: standing.ties,
    pct: standing.pct,
    status: standing.status,
    powerScore: pr?.score ?? 0,
    powerRank: pr?.rank ?? standing.rank,
    rosterValue: metrics.rosterValue.total,
    rosterValueAvailable: metrics.rosterValue.hasKtc,
    avgAge: metrics.ages.overall,
    draftCapital: metrics.draftPickCount,
    pointsFor: standing.pointsFor,
    pointsAgainst: standing.pointsAgainst,
    championships: metrics.championships,
    powerComponents: pr?.components,
  };

  const teamsByRoster = new Map(standings.map((t) => [t.rosterId, t]));
  const currentWeek = effectiveWeek(
    nfl?.week ?? league.settings.leg ?? 1,
  );

  const [schedule, activity] = await Promise.all([
    loadTeamSchedule(
      leagueId,
      league,
      rosterId,
      teamsByRoster,
      currentWeek,
    ),
    loadTeamActivity(leagueId, rosterId, currentWeek, teamsByRoster),
  ]);

  const rosterRows = buildRosterRows(roster, league, players, ktc);
  const picks = picksMap.get(rosterId) ?? [];
  const hasKtc = ktc.size > 0;

  return (
    <div className="trophy-page teams-page team-detail-page">
      <div className="team-detail-layout">
        <TeamDetailHeader team={teamCard} />

        <div className="team-detail-grid">
          <div className="team-detail-main">
            <TeamRosterPanel rows={rosterRows} hasKtc={hasKtc} />
            <TeamSchedulePanel schedule={schedule} />
          </div>
          <aside className="team-detail-side">
            <TeamSnapshotPanel
              team={teamCard}
              metrics={metrics}
              schedule={schedule}
            />
            <TeamDraftCapitalPanel picks={picks} />
            <TeamActivityPanel items={activity} />
          </aside>
        </div>
      </div>
    </div>
  );
}
