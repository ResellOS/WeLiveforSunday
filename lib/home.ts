/** Home-page computations: next kickoff, league pulse, featured matchups. */

import type { MatchupPair, StandingRow } from "@/lib/league";
import { NFL_KICKOFF_FALLBACK } from "@/lib/config";
import { fmtPoints, record } from "@/lib/format";

/**
 * Next NFL kickoff. During the regular/post season this is the sooner of the
 * next Thursday night (~8:15pm ET) or Sunday afternoon (~1:00pm ET) slot; in
 * the pre/off-season it falls back to the configured season opener.
 *
 * ET is approximated as UTC-4 (EDT) — good enough for a countdown display.
 */
export function nextNflKickoff(seasonType: string, now = new Date()): Date {
  const inSeason = seasonType === "regular" || seasonType === "post";
  if (!inSeason) return NFL_KICKOFF_FALLBACK;

  const ET_OFFSET_HOURS = 4; // EDT
  const candidates: Date[] = [];

  // 0 = Sunday ... 4 = Thursday
  const slots: Array<{ dow: number; hourET: number; minute: number }> = [
    { dow: 4, hourET: 20, minute: 15 }, // Thursday Night Football
    { dow: 0, hourET: 13, minute: 0 }, // Sunday early window
  ];

  for (const slot of slots) {
    const d = new Date(now);
    const day = d.getUTCDay();
    let delta = (slot.dow - day + 7) % 7;
    // Build the candidate at the ET slot time (converted to UTC).
    const candidate = new Date(
      Date.UTC(
        d.getUTCFullYear(),
        d.getUTCMonth(),
        d.getUTCDate() + delta,
        slot.hourET + ET_OFFSET_HOURS,
        slot.minute,
      ),
    );
    if (candidate.getTime() <= now.getTime()) {
      candidate.setUTCDate(candidate.getUTCDate() + 7);
    }
    candidates.push(candidate);
  }

  return candidates.sort((a, b) => a.getTime() - b.getTime())[0];
}

/**
 * "Matchup of the week" — the highest-profile game, defined as the pairing with
 * the best combined standings rank (lowest rank sum). Falls back to combined
 * points when standings are level. Returns null when there are no pairings.
 */
export function pickMatchupOfWeek(
  pairs: MatchupPair[],
  rankByRoster: Map<number, number>,
): MatchupPair | null {
  if (pairs.length === 0) return null;
  return [...pairs].sort((a, b) => {
    const ra =
      (rankByRoster.get(a.home.rosterId) ?? 99) +
      (rankByRoster.get(a.away.rosterId) ?? 99);
    const rb =
      (rankByRoster.get(b.home.rosterId) ?? 99) +
      (rankByRoster.get(b.away.rosterId) ?? 99);
    if (ra !== rb) return ra - rb;
    const pa = a.home.points + a.away.points;
    const pb = b.home.points + b.away.points;
    return pb - pa;
  })[0];
}

/** "Closest matchup" — smallest scoring margin this week. */
export function pickClosestMatchup(pairs: MatchupPair[]): MatchupPair | null {
  if (pairs.length === 0) return null;
  return [...pairs].sort(
    (a, b) =>
      Math.abs(a.home.points - a.away.points) -
      Math.abs(b.home.points - b.away.points),
  )[0];
}

/**
 * Generate 2-3 headline blurbs from standings each load.
 */
export function leaguePulse(standings: StandingRow[]): string[] {
  const played = standings.filter(
    (t) => t.wins + t.losses + t.ties > 0,
  );
  const blurbs: string[] = [];

  if (played.length === 0) {
    // Preseason: lean on names rather than results.
    if (standings.length > 0) {
      blurbs.push(
        `${standings.length} teams are locked in and ready — the season is about to begin.`,
      );
    }
    return blurbs;
  }

  const leader = played[0];
  const games = leader.wins + leader.losses + leader.ties;
  const ppg = games > 0 ? leader.pointsFor / games : 0;
  const oppPpg = games > 0 ? leader.pointsAgainst / games : 0;
  const margin = ppg - oppPpg;
  blurbs.push(
    `${leader.teamName} leads the league at ${record(
      leader.wins,
      leader.losses,
      leader.ties,
    )}${
      margin > 0
        ? `, outscoring opponents by ${fmtPoints(margin)} PPG`
        : ""
    }.`,
  );

  // Highest-scoring team.
  const topScorer = [...played].sort((a, b) => b.pointsFor - a.pointsFor)[0];
  if (topScorer && topScorer.rosterId !== leader.rosterId) {
    blurbs.push(
      `${topScorer.teamName} paces all scorers with ${fmtPoints(
        topScorer.pointsFor,
      )} points on the year.`,
    );
  }

  // Hottest streak.
  const hottest = [...played].sort((a, b) => b.streak - a.streak)[0];
  if (hottest && hottest.streak >= 2) {
    blurbs.push(
      `${hottest.teamName} is heating up on a ${hottest.streak}-game win streak.`,
    );
  }

  return blurbs.slice(0, 3);
}
