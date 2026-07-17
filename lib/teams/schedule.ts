/**
 * Franchise schedule from Sleeper weekly matchup endpoints.
 */

import { getMatchups } from "@/lib/sleeper";
import { pairMatchups } from "@/lib/league";
import type { League } from "@/types/sleeper";
import type { StandingRow } from "@/lib/league";

export type MatchupResult = "win" | "loss" | "tie" | "upcoming" | "live" | "bye";

export interface ScheduleEntry {
  week: number;
  opponentRosterId: number | null;
  opponentName: string;
  opponentAvatar: string | null;
  teamScore: number | null;
  opponentScore: number | null;
  result: MatchupResult;
  isPlayoff: boolean;
}

function matchupResult(
  teamPts: number,
  oppPts: number,
  weekPlayed: boolean,
  isCurrentWeek: boolean,
): MatchupResult {
  if (!weekPlayed) {
    if (isCurrentWeek && (teamPts > 0 || oppPts > 0)) return "live";
    return "upcoming";
  }
  if (teamPts > oppPts) return "win";
  if (teamPts < oppPts) return "loss";
  return "tie";
}

/** Load full regular-season schedule for one roster. */
export async function loadTeamSchedule(
  leagueId: string,
  league: League,
  rosterId: number,
  teamsByRoster: Map<number, StandingRow>,
  currentWeek: number,
): Promise<ScheduleEntry[]> {
  const playoffStart = league.settings.playoff_week_start ?? 15;
  const lastRegular = playoffStart - 1;
  const entries: ScheduleEntry[] = [];

  for (let week = 1; week <= lastRegular; week++) {
    const matchups = await getMatchups(leagueId, week).catch(() => []);
    if (!matchups?.length) {
      entries.push({
        week,
        opponentRosterId: null,
        opponentName: "Bye / TBD",
        opponentAvatar: null,
        teamScore: null,
        opponentScore: null,
        result: "bye",
        isPlayoff: false,
      });
      continue;
    }

    const mine = matchups.find((m) => m.roster_id === rosterId);
    if (!mine || mine.matchup_id == null) {
      entries.push({
        week,
        opponentRosterId: null,
        opponentName: "Bye",
        opponentAvatar: null,
        teamScore: null,
        opponentScore: null,
        result: "bye",
        isPlayoff: false,
      });
      continue;
    }

    const opponent = matchups.find(
      (m) => m.matchup_id === mine.matchup_id && m.roster_id !== rosterId,
    );
    const oppId = opponent?.roster_id ?? null;
    const oppTeam = oppId != null ? teamsByRoster.get(oppId) : undefined;
    const teamPts = mine.points ?? 0;
    const oppPts = opponent?.points ?? 0;
    const weekPlayed =
      teamPts > 0 ||
      oppPts > 0 ||
      week < currentWeek ||
      (league.settings.last_scored_leg ?? 0) >= week;

    entries.push({
      week,
      opponentRosterId: oppId,
      opponentName: oppTeam?.teamName ?? (oppId ? `Roster #${oppId}` : "TBD"),
      opponentAvatar: oppTeam?.avatar ?? null,
      teamScore: weekPlayed ? teamPts : null,
      opponentScore: weekPlayed ? oppPts : null,
      result: matchupResult(
        teamPts,
        oppPts,
        weekPlayed,
        week === currentWeek,
      ),
      isPlayoff: false,
    });
  }

  return entries;
}

/** Current-week opponent for My Team spotlight. */
export async function loadCurrentOpponent(
  leagueId: string,
  rosterId: number,
  week: number,
  teamsByRoster: Map<number, StandingRow>,
): Promise<{ name: string; avatar: string | null; rosterId: number } | null> {
  const matchups = await getMatchups(leagueId, week).catch(() => []);
  const mine = matchups?.find((m) => m.roster_id === rosterId);
  if (!mine?.matchup_id) return null;
  const opponent = matchups.find(
    (m) => m.matchup_id === mine.matchup_id && m.roster_id !== rosterId,
  );
  if (!opponent) return null;
  const t = teamsByRoster.get(opponent.roster_id);
  return {
    rosterId: opponent.roster_id,
    name: t?.teamName ?? `Roster #${opponent.roster_id}`,
    avatar: t?.avatar ?? null,
  };
}
