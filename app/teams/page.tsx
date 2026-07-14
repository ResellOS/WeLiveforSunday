import type { Metadata } from "next";
import {
  loadLeagueSnapshot,
  computeRecentForm,
  draftCapitalByRoster,
  getTradedPicks,
} from "@/lib/league";
import { getRosters, getAllPlayers } from "@/lib/sleeper";
import type { PlayerMap } from "@/types/sleeper";
import { getKtcValueMap, getSeasons } from "@/lib/queries";
import { getSeasonChain } from "@/lib/records";
import { computeLeagueHonors } from "@/lib/stats";
import { CHAMPION_REWARD_TEXT } from "@/lib/config";
import { SectionHeading, EmptyState } from "@/components/ui/Panel";
import { StatTile } from "@/components/ui/StatTile";
import { TeamsGrid, type TeamCardData } from "@/components/TeamsGrid";
import { fmtPoints } from "@/lib/format";

export const metadata: Metadata = { title: "Teams" };
export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const leagueId = process.env.SLEEPER_LEAGUE_ID;
  if (!leagueId) {
    return (
      <EmptyState
        title="League not configured"
        message="Set SLEEPER_LEAGUE_ID in .env.local to load teams."
      />
    );
  }

  const [snapshot, rosters, players, ktc, tradedPicks, seasons, chain] =
    await Promise.all([
      loadLeagueSnapshot(leagueId),
      getRosters(leagueId),
      getAllPlayers().catch((): PlayerMap => ({})),
      getKtcValueMap(),
      getTradedPicks(leagueId).catch(() => []),
      getSeasons(),
      getSeasonChain(leagueId),
    ]);

  const { league, standings } = snapshot;
  const form = await computeRecentForm(
    leagueId,
    league,
    rosters.map((r) => r.roster_id),
  ).catch(() => new Map<number, number>());

  const capital = draftCapitalByRoster(rosters, tradedPicks);
  const playersByRoster = new Map(
    rosters.map((r) => [r.roster_id, r.players ?? []]),
  );

  const cards: TeamCardData[] = standings.map((t) => {
    const roster = playersByRoster.get(t.rosterId) ?? [];

    // Roster value (KTC) + average age from the Sleeper player map.
    let rosterValue = 0;
    let ageSum = 0;
    let ageCount = 0;
    for (const pid of roster) {
      const p = players[pid];
      if (!p) continue;
      if (p.full_name) {
        const v = ktc.get(p.full_name.toLowerCase());
        if (v) rosterValue += v;
      }
      if (typeof p.age === "number") {
        ageSum += p.age;
        ageCount++;
      }
    }

    const form3 = form.get(t.rosterId) ?? 0;
    const powerScore = t.pct * 100 + t.pointsFor * 0.05 + form3 * 5;

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
      powerScore: Math.round(powerScore * 10) / 10,
      rosterValue,
      avgAge: ageCount > 0 ? ageSum / ageCount : null,
      draftCapital: capital.get(t.rosterId) ?? 0,
    };
  });

  const honors = await computeLeagueHonors(seasons, chain);

  return (
    <div className="space-y-8">
      <SectionHeading
        title="Teams"
        subtitle={`${league.name} · ${standings.length} franchises`}
      />

      <TeamsGrid teams={cards} />

      {/* Bottom stat bar */}
      <div>
        <SectionHeading title="Franchise Honors" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Championships" value={honors.totalChampionships} />
          <StatTile label="Different Champs" value={honors.differentChampions} />
          <StatTile label="MVP Winners" value={honors.mvpWinners} />
          <StatTile
            label="Highest Title Score"
            value={
              honors.highestSeasonScore != null
                ? fmtPoints(honors.highestSeasonScore)
                : "—"
            }
          />
        </div>
        <div className="panel mt-3 p-4 text-center text-sm text-offwhite/70">
          <span className="font-display text-gold">The Reward · </span>
          {CHAMPION_REWARD_TEXT}
        </div>
      </div>
    </div>
  );
}
