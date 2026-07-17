/**
 * Draft pick ownership from Sleeper traded_picks + default franchise picks.
 *
 * Each roster originally owns rounds 1..draft_rounds for upcoming seasons.
 * Entries in traded_picks override the current owner when ownership moved.
 */

import type { League, Roster, TradedPick } from "@/types/sleeper";

export interface OwnedPick {
  season: string;
  round: number;
  /** Roster the pick originally belonged to. */
  originalRosterId: number;
  /** Roster that currently owns the pick. */
  ownerId: number;
  /** True when owner differs from original franchise. */
  isTraded: boolean;
}

const FUTURE_SEASON_SPAN = 4;

/** Future draft seasons to include (current league season + next years). */
export function futureDraftSeasons(league: League): string[] {
  const base = parseInt(league.season, 10);
  if (Number.isNaN(base)) return [league.season];
  return Array.from({ length: FUTURE_SEASON_SPAN }, (_, i) =>
    String(base + i),
  );
}

function pickKey(season: string, round: number, originRosterId: number): string {
  return `${season}-${round}-${originRosterId}`;
}

/**
 * Build complete owned-pick lists per roster from real Sleeper data.
 * Does not invent picks beyond default rounds × future seasons.
 */
export function buildOwnedPicksByRoster(
  league: League,
  rosters: Roster[],
  tradedPicks: TradedPick[],
): Map<number, OwnedPick[]> {
  const draftRounds = league.settings.draft_rounds ?? 4;
  const seasons = futureDraftSeasons(league);

  const tradedByOrigin = new Map<string, TradedPick>();
  for (const p of tradedPicks) {
    tradedByOrigin.set(pickKey(p.season, p.round, p.roster_id), p);
  }

  const byOwner = new Map<number, OwnedPick[]>();
  for (const r of rosters) byOwner.set(r.roster_id, []);

  for (const season of seasons) {
    for (const r of rosters) {
      for (let round = 1; round <= draftRounds; round++) {
        const traded = tradedByOrigin.get(pickKey(season, round, r.roster_id));
        const ownerId = traded?.owner_id ?? r.roster_id;
        const pick: OwnedPick = {
          season,
          round,
          originalRosterId: r.roster_id,
          ownerId,
          isTraded: ownerId !== r.roster_id,
        };
        byOwner.get(ownerId)!.push(pick);
      }
    }
  }

  for (const [, picks] of byOwner) {
    picks.sort((a, b) => {
      const sa = parseInt(a.season, 10);
      const sb = parseInt(b.season, 10);
      if (sa !== sb) return sa - sb;
      return a.round - b.round;
    });
  }

  return byOwner;
}

/** Group a roster's picks by season for display. */
export function groupPicksBySeason(
  picks: OwnedPick[],
): Map<string, OwnedPick[]> {
  const map = new Map<string, OwnedPick[]>();
  for (const p of picks) {
    const arr = map.get(p.season) ?? [];
    arr.push(p);
    map.set(p.season, arr);
  }
  return map;
}

/** Format round list for a season, e.g. "1st, 2nd, 2nd (via trade)". */
export function formatRoundList(picks: OwnedPick[]): string {
  const ordinals = ["", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th"];
  return picks
    .map((p) => {
      const label = ordinals[p.round] ?? `${p.round}th`;
      return p.isTraded ? `${label}*` : label;
    })
    .join(", ");
}
