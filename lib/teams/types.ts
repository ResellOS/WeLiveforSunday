import type { ContenderStatus } from "@/lib/league";
import type { TeamMetrics } from "@/lib/teams/metrics";
import type { PowerComponents } from "@/lib/teams/powerRanking";

/** Shared franchise card payload for Teams page views. */
export interface TeamCardData {
  rosterId: number;
  rank: number;
  teamName: string;
  managerName: string;
  avatar: string | null;
  wins: number;
  losses: number;
  ties: number;
  pct: number;
  status: ContenderStatus;
  powerScore: number;
  powerRank: number;
  rosterValue: number;
  rosterValueAvailable: boolean;
  avgAge: number | null;
  draftCapital: number;
  pointsFor: number;
  pointsAgainst: number;
  championships: number;
  powerComponents?: PowerComponents;
}

export function attachPowerRanks(
  cards: TeamCardData[],
  powerRankByRoster: Map<number, number>,
  powerScoreByRoster: Map<number, number>,
): TeamCardData[] {
  return cards.map((c) => ({
    ...c,
    powerRank: powerRankByRoster.get(c.rosterId) ?? c.rank,
    powerScore: powerScoreByRoster.get(c.rosterId) ?? c.powerScore,
  }));
}

export function metricsToCardExtras(
  metrics: TeamMetrics,
): Pick<
  TeamCardData,
  "rosterValue" | "rosterValueAvailable" | "avgAge" | "draftCapital" | "championships"
> {
  return {
    rosterValue: metrics.rosterValue.total,
    rosterValueAvailable: metrics.rosterValue.hasKtc,
    avgAge: metrics.ages.overall,
    draftCapital: metrics.draftPickCount,
    championships: metrics.championships,
  };
}
