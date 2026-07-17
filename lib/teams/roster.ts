/**
 * Roster grouping for team detail — starters, bench, IR, taxi.
 */

import type { Player, PlayerMap, Roster } from "@/types/sleeper";
import type { League } from "@/types/sleeper";

export type RosterGroup = "starters" | "bench" | "ir" | "taxi";

export interface RosterPlayerRow {
  playerId: string;
  name: string;
  nflTeam: string;
  position: string;
  age: number | null;
  dynastyValue: number | null;
  lineupSlot: string | null;
  injuryStatus: string | null;
  group: RosterGroup;
}

export function buildRosterRows(
  roster: Roster,
  league: League,
  players: PlayerMap,
  ktc: Map<string, number>,
): RosterPlayerRow[] {
  const positions = league.roster_positions ?? [];
  const starterIds = roster.starters ?? [];
  const reserve = new Set(roster.reserve ?? []);
  const taxi = new Set(roster.taxi ?? []);
  const allPlayers = roster.players ?? [];

  const starterSlot = new Map<string, string>();
  starterIds.forEach((id, i) => {
    starterSlot.set(id, positions[i] ?? "FLEX");
  });

  const rows: RosterPlayerRow[] = [];

  for (const id of allPlayers) {
    const p = players[id];
    const group: RosterGroup = reserve.has(id)
      ? "ir"
      : taxi.has(id)
        ? "taxi"
        : starterSlot.has(id)
          ? "starters"
          : "bench";

    const value =
      p?.full_name && ktc.size > 0
        ? ktc.get(p.full_name.toLowerCase()) ?? null
        : null;

    rows.push({
      playerId: id,
      name: p?.full_name ?? id,
      nflTeam: p?.team ?? "—",
      position: p?.position ?? "—",
      age: typeof p?.age === "number" ? p.age : null,
      dynastyValue: value,
      lineupSlot: starterSlot.get(id) ?? null,
      injuryStatus: p?.injury_status ?? null,
      group,
    });
  }

  const order: Record<RosterGroup, number> = {
    starters: 0,
    bench: 1,
    ir: 2,
    taxi: 3,
  };

  rows.sort((a, b) => {
    const g = order[a.group] - order[b.group];
    if (g !== 0) return g;
    return (b.dynastyValue ?? 0) - (a.dynastyValue ?? 0);
  });

  return rows;
}

export type RosterFilter =
  | "all"
  | "starters"
  | "bench"
  | "QB"
  | "RB"
  | "WR"
  | "TE"
  | "picks";

export function filterRosterRows(
  rows: RosterPlayerRow[],
  filter: RosterFilter,
): RosterPlayerRow[] {
  switch (filter) {
    case "all":
      return rows;
    case "starters":
      return rows.filter((r) => r.group === "starters");
    case "bench":
      return rows.filter((r) => r.group === "bench");
    case "picks":
      return [];
    default:
      return rows.filter((r) => r.position === filter);
  }
}
