/**
 * Team-level metrics derived from Sleeper rosters + KTC values.
 * Missing ages/values are excluded from averages — never treated as zero.
 */

import type { PlayerMap } from "@/types/sleeper";
import type { StandingRow } from "@/lib/league";
import type { SeasonRow } from "@/lib/queries";
import type { OwnedPick } from "@/lib/teams/draftCapital";

export interface RosterAgeBreakdown {
  overall: number | null;
  starters: number | null;
  qb: number | null;
  rb: number | null;
  wr: number | null;
  te: number | null;
  /** Players with unknown age on active roster. */
  unknownCount: number;
}

export interface RosterValueBreakdown {
  total: number;
  starters: number;
  bench: number;
  hasKtc: boolean;
}

export interface TeamMetrics {
  rosterId: number;
  rosterValue: RosterValueBreakdown;
  ages: RosterAgeBreakdown;
  draftPickCount: number;
  championships: number;
}

function ktcValue(
  playerId: string,
  players: PlayerMap,
  ktc: Map<string, number>,
): number {
  const p = players[playerId];
  if (!p?.full_name) return 0;
  return ktc.get(p.full_name.toLowerCase()) ?? 0;
}

function avgAge(playerIds: string[], players: PlayerMap): {
  avg: number | null;
  unknown: number;
} {
  let sum = 0;
  let count = 0;
  let unknown = 0;
  for (const id of playerIds) {
    const age = players[id]?.age;
    if (typeof age === "number") {
      sum += age;
      count++;
    } else if (players[id]) {
      unknown++;
    }
  }
  return {
    avg: count > 0 ? sum / count : null,
    unknown,
  };
}

function agesByPosition(
  playerIds: string[],
  players: PlayerMap,
  position: string,
): number | null {
  const filtered = playerIds.filter(
    (id) => players[id]?.position === position,
  );
  return avgAge(filtered, players).avg;
}

/** Championships won per roster from Supabase season history. */
export function championshipsByRoster(
  seasons: SeasonRow[],
): Map<number, number> {
  const map = new Map<number, number>();
  for (const s of seasons) {
    if (s.champion_roster_id == null) continue;
    map.set(
      s.champion_roster_id,
      (map.get(s.champion_roster_id) ?? 0) + 1,
    );
  }
  return map;
}

export function computeTeamMetrics(
  standings: StandingRow[],
  players: PlayerMap,
  ktc: Map<string, number>,
  picksByRoster: Map<number, OwnedPick[]>,
  championships: Map<number, number>,
): Map<number, TeamMetrics> {
  const map = new Map<number, TeamMetrics>();

  for (const t of standings) {
    const roster = t.players ?? [];
    const starterSet = new Set(t.starters ?? []);
    const bench = roster.filter((id) => !starterSet.has(id));

    let total = 0;
    let starterVal = 0;
    let benchVal = 0;
    let hasKtc = false;

    for (const id of roster) {
      const v = ktcValue(id, players, ktc);
      if (v > 0) hasKtc = true;
      total += v;
      if (starterSet.has(id)) starterVal += v;
      else benchVal += v;
    }

    const overallAge = avgAge(roster, players);
    const starterAge = avgAge(t.starters ?? [], players);

    map.set(t.rosterId, {
      rosterId: t.rosterId,
      rosterValue: {
        total,
        starters: starterVal,
        bench: benchVal,
        hasKtc: hasKtc && ktc.size > 0,
      },
      ages: {
        overall: overallAge.avg,
        starters: starterAge.avg,
        qb: agesByPosition(roster, players, "QB"),
        rb: agesByPosition(roster, players, "RB"),
        wr: agesByPosition(roster, players, "WR"),
        te: agesByPosition(roster, players, "TE"),
        unknownCount: overallAge.unknown,
      },
      draftPickCount: picksByRoster.get(t.rosterId)?.length ?? 0,
      championships: championships.get(t.rosterId) ?? 0,
    });
  }

  return map;
}

/** Age heat tier for subtle card treatment. */
export type AgeHeat = "young" | "balanced" | "old";

export function ageHeat(avg: number | null): AgeHeat {
  if (avg == null) return "balanced";
  if (avg < 25) return "young";
  if (avg > 28) return "old";
  return "balanced";
}
