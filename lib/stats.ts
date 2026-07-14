/**
 * Cross-cutting league honors + MVP aggregation, shared by Teams, History,
 * Trophy Room, and Record Book. Built on the shared MVP logic in lib/mvp.ts.
 */

import { computeSeasonMVP, type SeasonMVP } from "@/lib/mvp";
import { getAllPlayers } from "@/lib/sleeper";
import type { League, PlayerMap } from "@/types/sleeper";
import type { SeasonRow } from "@/lib/queries";

/** Week the championship is decided, derived from playoff settings. */
export function championshipWeek(league: League): number {
  const start = league.settings.playoff_week_start ?? 15;
  const teams = league.settings.playoff_teams ?? 6;
  const rounds = Math.max(1, Math.ceil(Math.log2(teams)));
  return start + rounds - 1;
}

export interface SeasonMVPResult {
  year: number;
  mvp: SeasonMVP;
}

/**
 * Compute the MVP for every season that has a champion, matching each season
 * row to its league in the chain to find the right league id + playoff window.
 */
export async function computeAllSeasonMVPs(
  seasons: SeasonRow[],
  chain: League[],
): Promise<SeasonMVPResult[]> {
  const relevant = seasons.filter((s) => s.champion_roster_id != null);
  if (relevant.length === 0) return [];

  const players: PlayerMap | undefined = await getAllPlayers().catch(
    () => undefined,
  );
  const byYear = new Map(chain.map((l) => [l.season, l]));
  const out: SeasonMVPResult[] = [];

  for (const s of relevant) {
    const league = byYear.get(String(s.year));
    if (!league) continue;
    const mvp = await computeSeasonMVP(
      {
        leagueId: league.league_id,
        championRosterId: s.champion_roster_id!,
        endWeek: championshipWeek(league),
      },
      players,
    ).catch(() => null);
    if (mvp) out.push({ year: s.year, mvp });
  }
  return out;
}

export interface LeagueHonors {
  totalChampionships: number;
  differentChampions: number;
  mvpWinners: number;
  /** Highest championship-game winning score on record, if any. */
  highestSeasonScore: number | null;
}

/** Headline honors for the Teams / Trophy Room stat bars. */
export async function computeLeagueHonors(
  seasons: SeasonRow[],
  chain: League[],
): Promise<LeagueHonors> {
  const crowned = seasons.filter((s) => s.champion_roster_id != null);
  const totalChampionships = crowned.length;
  const differentChampions = new Set(
    crowned.map((s) => s.champion_roster_id),
  ).size;

  const mvps = await computeAllSeasonMVPs(seasons, chain);
  const mvpWinners = new Set(mvps.map((m) => m.mvp.playerId)).size;

  const scores = seasons
    .map((s) => s.championship_score_winner)
    .filter((v): v is number => v != null);
  const highestSeasonScore = scores.length ? Math.max(...scores) : null;

  return {
    totalChampionships,
    differentChampions,
    mvpWinners,
    highestSeasonScore,
  };
}
