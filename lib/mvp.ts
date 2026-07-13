/**
 * Shared MVP logic for WLFS.
 *
 * A season's MVP is the single player who scored the most TOTAL fantasy points
 * while rostered on that season's champion team, computed from Sleeper's weekly
 * per-player points (`Matchup.players_points`).
 *
 * Home, History, Trophy Room, and Record Book all import from here so the
 * definition stays identical everywhere.
 */

import { getMatchups, getAllPlayers, playerName } from "@/lib/sleeper";
import type { PlayerMap } from "@/types/sleeper";

export interface SeasonMVPInput {
  /** The Sleeper league_id for that specific season. */
  leagueId: string;
  /** roster_id of that season's champion. */
  championRosterId: number;
  /** First week to count (default 1). */
  startWeek?: number;
  /**
   * Last week to count, inclusive. Should be the final week of the season
   * (i.e. the championship week — typically league playoff end).
   */
  endWeek: number;
}

export interface SeasonMVP {
  playerId: string;
  /** Resolved "First Last" name if a PlayerMap was available, else the id. */
  name: string;
  totalPoints: number;
  /** Number of weeks the player registered points on the champion roster. */
  weeksScored: number;
}

/**
 * Computes the champion-team MVP for a single season.
 *
 * @param players Optional pre-fetched player map for name resolution. If
 *   omitted, the function fetches it once via {@link getAllPlayers}.
 * @returns The top scorer, or `null` if no scoring data was found.
 */
export async function computeSeasonMVP(
  input: SeasonMVPInput,
  players?: PlayerMap,
): Promise<SeasonMVP | null> {
  const { leagueId, championRosterId, endWeek } = input;
  const startWeek = input.startWeek ?? 1;
  if (endWeek < startWeek) return null;

  // player_id -> { points, weeks }
  const totals = new Map<string, { points: number; weeks: number }>();

  const weeks = Array.from(
    { length: endWeek - startWeek + 1 },
    (_, i) => startWeek + i,
  );

  // Fetch weeks in parallel; a missing/empty week simply contributes nothing.
  const weekResults = await Promise.all(
    weeks.map(async (week) => {
      try {
        return await getMatchups(leagueId, week);
      } catch {
        return null;
      }
    }),
  );

  for (const matchups of weekResults) {
    if (!matchups) continue;
    const champEntry = matchups.find((m) => m.roster_id === championRosterId);
    if (!champEntry?.players_points) continue;

    for (const [playerId, pts] of Object.entries(champEntry.players_points)) {
      if (!Number.isFinite(pts)) continue;
      const prev = totals.get(playerId) ?? { points: 0, weeks: 0 };
      prev.points += pts;
      if (pts !== 0) prev.weeks += 1;
      totals.set(playerId, prev);
    }
  }

  if (totals.size === 0) return null;

  let bestId = "";
  let best = { points: -Infinity, weeks: 0 };
  for (const [playerId, agg] of totals) {
    if (agg.points > best.points) {
      best = agg;
      bestId = playerId;
    }
  }

  const map = players ?? (await getAllPlayers().catch(() => null));

  return {
    playerId: bestId,
    name: map ? playerName(map, bestId) : bestId,
    totalPoints: Math.round(best.points * 100) / 100,
    weeksScored: best.weeks,
  };
}
