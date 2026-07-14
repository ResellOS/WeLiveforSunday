/**
 * League aggregation helpers — turn raw Sleeper rosters/users/matchups into the
 * shapes the WLFS pages render (teams, standings, matchup pairings, etc.).
 */

import {
  getLeague,
  getMatchups,
  getRosters,
  getUsers,
  getTradedPicks,
} from "@/lib/sleeper";
import type {
  League,
  Matchup,
  Roster,
  User,
  TradedPick,
} from "@/types/sleeper";
import { combineFpts, winPct } from "@/lib/format";

const SLEEPER_CDN = "https://sleepercdn.com";

/** Avatar URL for a user/league avatar id (or a fallback silhouette). */
export function avatarUrl(avatarId: string | null | undefined): string | null {
  if (!avatarId) return null;
  return `${SLEEPER_CDN}/avatars/thumbs/${avatarId}`;
}

export interface Team {
  rosterId: number;
  ownerId: string | null;
  /** Manager's Sleeper display name. */
  managerName: string;
  /** Custom team name if set, else the manager name. */
  teamName: string;
  avatar: string | null;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  players: string[];
  starters: string[];
}

export type ContenderStatus =
  | "Contender"
  | "Playoff Hopeful"
  | "Borderline"
  | "Retooling"
  | "Rebuilding";

export interface StandingRow extends Team {
  rank: number;
  pct: number;
  /** Current W/L streak, e.g. +3 or -2; 0 when unknown (e.g. preseason). */
  streak: number;
  status: ContenderStatus;
}

/** Build the base team list by joining rosters to their owners. */
export function buildTeams(rosters: Roster[], users: User[]): Team[] {
  const usersById = new Map(users.map((u) => [u.user_id, u]));

  return rosters.map((r) => {
    const owner = r.owner_id ? usersById.get(r.owner_id) : undefined;
    const managerName = owner?.display_name ?? "Unowned";
    const teamName = owner?.metadata?.team_name?.trim() || managerName;
    // metadata.avatar can be a full URL; otherwise fall back to the user avatar id.
    const metaAvatar = owner?.metadata?.avatar;
    const avatar = metaAvatar?.startsWith("http")
      ? metaAvatar
      : avatarUrl(owner?.avatar);

    return {
      rosterId: r.roster_id,
      ownerId: r.owner_id,
      managerName,
      teamName,
      avatar,
      wins: r.settings.wins ?? 0,
      losses: r.settings.losses ?? 0,
      ties: r.settings.ties ?? 0,
      pointsFor: combineFpts(r.settings.fpts, r.settings.fpts_decimal),
      pointsAgainst: combineFpts(
        r.settings.fpts_against,
        r.settings.fpts_against_decimal,
      ),
      players: r.players ?? [],
      starters: r.starters ?? [],
    };
  });
}

/**
 * Rank teams: win% desc, then points-for desc as the tiebreaker.
 * Streaks are provided via `streakByRoster` (computed from matchup history),
 * defaulting to 0 when unavailable.
 */
export function computeStandings(
  teams: Team[],
  playoffTeams: number,
  streakByRoster?: Map<number, number>,
): StandingRow[] {
  const sorted = [...teams].sort((a, b) => {
    const pa = winPct(a.wins, a.losses, a.ties);
    const pb = winPct(b.wins, b.losses, b.ties);
    if (pb !== pa) return pb - pa;
    return b.pointsFor - a.pointsFor;
  });

  return sorted.map((t, i) => {
    const rank = i + 1;
    const pct = winPct(t.wins, t.losses, t.ties);
    return {
      ...t,
      rank,
      pct,
      streak: streakByRoster?.get(t.rosterId) ?? 0,
      status: contenderStatus(t, rank, sorted, playoffTeams),
    };
  });
}

/**
 * Contender status per WLFS spec:
 *  - Contender:        top `playoffTeams` by record
 *  - Playoff Hopeful:  within 1 game of the last playoff spot
 *  - Borderline:       .500 record
 *  - Retooling:        below .500 with positive point differential
 *  - Rebuilding:       below .500 with negative point differential
 */
export function contenderStatus(
  team: Team,
  rank: number,
  sortedTeams: Team[],
  playoffTeams: number,
): ContenderStatus {
  if (rank <= playoffTeams) return "Contender";

  const cutoff = sortedTeams[playoffTeams - 1];
  if (cutoff) {
    // "Games back" of the last playoff team.
    const gamesBack =
      (cutoff.wins - team.wins + (team.losses - cutoff.losses)) / 2;
    if (gamesBack <= 1) return "Playoff Hopeful";
  }

  const games = team.wins + team.losses + team.ties;
  const isFiveHundred = games > 0 && team.wins === team.losses;
  if (isFiveHundred) return "Borderline";

  const diff = team.pointsFor - team.pointsAgainst;
  return diff >= 0 ? "Retooling" : "Rebuilding";
}

export interface MatchupPair {
  matchupId: number;
  home: { rosterId: number; points: number };
  away: { rosterId: number; points: number };
}

/** Group a week's matchup entries into head-to-head pairs. */
export function pairMatchups(entries: Matchup[]): MatchupPair[] {
  const byId = new Map<number, Matchup[]>();
  for (const e of entries) {
    if (e.matchup_id == null) continue;
    const arr = byId.get(e.matchup_id) ?? [];
    arr.push(e);
    byId.set(e.matchup_id, arr);
  }

  const pairs: MatchupPair[] = [];
  for (const [matchupId, group] of byId) {
    if (group.length < 2) continue;
    const [a, b] = group;
    pairs.push({
      matchupId,
      home: { rosterId: a.roster_id, points: a.points ?? 0 },
      away: { rosterId: b.roster_id, points: b.points ?? 0 },
    });
  }
  return pairs;
}

/**
 * The effective "current" week for display: Sleeper's week, clamped to >= 1.
 * In the offseason Sleeper reports week 0; we surface week 1 as the target.
 */
export function effectiveWeek(nflWeek: number): number {
  return Math.max(1, nflWeek);
}

/** Whether a given week falls in the league's playoff window. */
export function isPlayoffWeek(week: number, league: League): boolean {
  const start = league.settings.playoff_week_start ?? 15;
  return week >= start;
}

/** Count of currently-owned future draft picks per roster (draft capital). */
export function draftCapitalByRoster(
  rosters: Roster[],
  tradedPicks: TradedPick[],
): Map<number, number> {
  // Each roster starts owning its own picks. Sleeper's traded_picks lists picks
  // whose ownership moved; we recompute net owned picks per roster from them,
  // treating untraded picks as still owned by their origin roster.
  const counts = new Map<number, number>();
  for (const r of rosters) counts.set(r.roster_id, 0);

  // Picks that appear in traded_picks are the ones whose owner differs from origin.
  const movedOriginKeys = new Set<string>();
  for (const p of tradedPicks) {
    movedOriginKeys.add(`${p.season}-${p.round}-${p.roster_id}`);
    counts.set(p.owner_id, (counts.get(p.owner_id) ?? 0) + 1);
  }

  return counts;
}

/** Bundle of everything the standings-driven pages need in one fetch. */
export interface LeagueSnapshot {
  league: League;
  rosters: Roster[];
  users: User[];
  teams: Team[];
  standings: StandingRow[];
}

/**
 * Load league + rosters + users and compute standings. Streaks are computed
 * from matchup history when games have been played.
 */
export async function loadLeagueSnapshot(
  leagueId: string,
): Promise<LeagueSnapshot> {
  const [league, rosters, users] = await Promise.all([
    getLeague(leagueId),
    getRosters(leagueId),
    getUsers(leagueId),
  ]);

  const teams = buildTeams(rosters, users);
  const playoffTeams = league.settings.playoff_teams ?? 6;

  const streaks = await computeStreaks(
    leagueId,
    league,
    rosters.map((r) => r.roster_id),
  ).catch(() => new Map<number, number>());

  const standings = computeStandings(teams, playoffTeams, streaks);
  return { league, rosters, users, teams, standings };
}

/**
 * Compute each roster's current W/L streak from completed weeks. Returns an
 * empty map if no games have been played yet (e.g. preseason).
 */
export async function computeStreaks(
  leagueId: string,
  league: League,
  rosterIds: number[],
): Promise<Map<number, number>> {
  const playoffStart = league.settings.playoff_week_start ?? 15;
  const lastWeek = Math.max(0, playoffStart - 1);
  if (lastWeek === 0) return new Map();

  const results: Array<{ week: number; winners: Set<number>; losers: Set<number> }> =
    [];

  for (let week = 1; week <= lastWeek; week++) {
    const entries = await getMatchups(leagueId, week).catch(() => []);
    if (!entries || entries.length === 0) break; // no more played weeks
    const winners = new Set<number>();
    const losers = new Set<number>();
    for (const pair of pairMatchups(entries)) {
      if (pair.home.points === pair.away.points) continue;
      const homeWon = pair.home.points > pair.away.points;
      winners.add(homeWon ? pair.home.rosterId : pair.away.rosterId);
      losers.add(homeWon ? pair.away.rosterId : pair.home.rosterId);
    }
    if (winners.size === 0 && losers.size === 0) break;
    results.push({ week, winners, losers });
  }

  const streaks = new Map<number, number>();
  for (const rid of rosterIds) {
    let streak = 0;
    for (let i = results.length - 1; i >= 0; i--) {
      const r = results[i];
      if (r.winners.has(rid)) {
        if (streak >= 0) streak += 1;
        else break;
      } else if (r.losers.has(rid)) {
        if (streak <= 0) streak -= 1;
        else break;
      } else {
        break; // bye/no result
      }
    }
    streaks.set(rid, streak);
  }
  return streaks;
}

/**
 * Wins in each roster's most recent `window` games (for power-ranking form).
 * Returns an empty map when no games have been played.
 */
export async function computeRecentForm(
  leagueId: string,
  league: League,
  rosterIds: number[],
  window = 3,
): Promise<Map<number, number>> {
  const playoffStart = league.settings.playoff_week_start ?? 15;
  const lastWeek = Math.max(0, playoffStart - 1);
  if (lastWeek === 0) return new Map();

  const perRoster = new Map<number, boolean[]>(); // chronological win flags
  for (let week = 1; week <= lastWeek; week++) {
    const entries = await getMatchups(leagueId, week).catch(() => []);
    if (!entries || entries.length === 0) break;
    const pairs = pairMatchups(entries);
    if (pairs.every((p) => p.home.points === 0 && p.away.points === 0)) break;
    for (const p of pairs) {
      if (p.home.points === p.away.points) continue;
      const homeWon = p.home.points > p.away.points;
      const hArr = perRoster.get(p.home.rosterId) ?? [];
      hArr.push(homeWon);
      perRoster.set(p.home.rosterId, hArr);
      const aArr = perRoster.get(p.away.rosterId) ?? [];
      aArr.push(!homeWon);
      perRoster.set(p.away.rosterId, aArr);
    }
  }

  const form = new Map<number, number>();
  for (const rid of rosterIds) {
    const flags = perRoster.get(rid) ?? [];
    const recent = flags.slice(-window);
    form.set(rid, recent.filter(Boolean).length);
  }
  return form;
}

/** Convenience re-export so pages can grab traded picks alongside snapshot. */
export { getTradedPicks };
