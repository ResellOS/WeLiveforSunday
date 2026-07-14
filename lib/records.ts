/**
 * All-time records engine.
 *
 * Walks the league's season chain (via previous_league_id) and every played
 * week, building per-game results, then derives the records the Record Book,
 * Trophy Room, and stat bars display. Everything degrades to empty arrays when
 * no games have been played yet.
 */

import {
  getLeague,
  getMatchups,
  getRosters,
  getUsers,
  getTransactions,
} from "@/lib/sleeper";
import { buildTeams, pairMatchups, type Team } from "@/lib/league";
import type { League } from "@/types/sleeper";

export interface GameResult {
  season: string;
  week: number;
  rosterId: number;
  points: number;
  opponentRosterId: number;
  opponentPoints: number;
  isPlayoff: boolean;
  win: boolean;
}

export interface SeasonContext {
  leagueId: string;
  season: string;
  playoffWeekStart: number;
  /** Team display info for that season, keyed by roster id. */
  teams: Map<number, Team>;
}

export interface LeagueHistory {
  seasons: SeasonContext[];
  games: GameResult[];
  /** Latest-season team lookup (roster id -> team) for name display. */
  latestTeams: Map<number, Team>;
}

/** Build the ordered chain of league ids from oldest to newest. */
export async function getSeasonChain(leagueId: string): Promise<League[]> {
  const chain: League[] = [];
  let current: string | null = leagueId;
  // Guard against cycles / runaway loops.
  for (let i = 0; i < 30 && current; i++) {
    const league: League = await getLeague(current);
    chain.push(league);
    current = league.previous_league_id;
  }
  return chain.reverse(); // oldest first
}

/**
 * Load full matchup history across the season chain. Only weeks that actually
 * have results are included, so preseason yields an empty games list.
 */
export async function loadLeagueHistory(leagueId: string): Promise<LeagueHistory> {
  const chain = await getSeasonChain(leagueId);
  const seasons: SeasonContext[] = [];
  const games: GameResult[] = [];
  let latestTeams = new Map<number, Team>();

  for (const league of chain) {
    const [rosters, users] = await Promise.all([
      getRosters(league.league_id),
      getUsers(league.league_id),
    ]);
    const teamList = buildTeams(rosters, users);
    const teams = new Map(teamList.map((t) => [t.rosterId, t]));
    latestTeams = teams;

    const playoffWeekStart = league.settings.playoff_week_start ?? 15;
    seasons.push({
      leagueId: league.league_id,
      season: league.season,
      playoffWeekStart,
      teams,
    });

    // Scan weeks 1..18 (regular + playoffs); stop after the first empty week
    // once we've seen at least one played week.
    let seenPlayed = false;
    for (let week = 1; week <= 18; week++) {
      const entries = await getMatchups(league.league_id, week).catch(() => []);
      const pairs = pairMatchups(entries ?? []);
      const hasScores = pairs.some(
        (p) => p.home.points > 0 || p.away.points > 0,
      );
      if (!hasScores) {
        if (seenPlayed) break;
        continue;
      }
      seenPlayed = true;
      const isPlayoff = week >= playoffWeekStart;
      for (const p of pairs) {
        if (p.home.points === 0 && p.away.points === 0) continue;
        const homeWin = p.home.points >= p.away.points;
        games.push({
          season: league.season,
          week,
          rosterId: p.home.rosterId,
          points: p.home.points,
          opponentRosterId: p.away.rosterId,
          opponentPoints: p.away.points,
          isPlayoff,
          win: homeWin,
        });
        games.push({
          season: league.season,
          week,
          rosterId: p.away.rosterId,
          points: p.away.points,
          opponentRosterId: p.home.rosterId,
          opponentPoints: p.home.points,
          isPlayoff,
          win: !homeWin,
        });
      }
    }
  }

  return { seasons, games, latestTeams };
}

/* ------------------------------- derivations ------------------------------ */

export interface LeaderRow {
  rosterId: number;
  teamName: string;
  value: number;
}

export interface GameRecord {
  rosterId: number;
  teamName: string;
  season: string;
  week: number;
  points: number;
  detail?: string;
}

function teamName(history: LeagueHistory, rosterId: number): string {
  return history.latestTeams.get(rosterId)?.teamName ?? `Roster #${rosterId}`;
}

function leaderboard(
  history: LeagueHistory,
  valueOf: (rosterId: number) => number,
  rosterIds: Iterable<number>,
): LeaderRow[] {
  const rows: LeaderRow[] = [];
  for (const rosterId of rosterIds) {
    rows.push({ rosterId, teamName: teamName(history, rosterId), value: valueOf(rosterId) });
  }
  return rows.sort((a, b) => b.value - a.value);
}

/** Career wins per roster (regular + playoffs). */
export function careerWins(history: LeagueHistory): LeaderRow[] {
  const wins = new Map<number, number>();
  const ids = new Set<number>();
  for (const g of history.games) {
    ids.add(g.rosterId);
    if (g.win) wins.set(g.rosterId, (wins.get(g.rosterId) ?? 0) + 1);
  }
  return leaderboard(history, (id) => wins.get(id) ?? 0, ids);
}

/** Career points-for per roster. */
export function careerPointsFor(history: LeagueHistory): LeaderRow[] {
  const pf = new Map<number, number>();
  const ids = new Set<number>();
  for (const g of history.games) {
    ids.add(g.rosterId);
    pf.set(g.rosterId, (pf.get(g.rosterId) ?? 0) + g.points);
  }
  return leaderboard(
    history,
    (id) => Math.round((pf.get(id) ?? 0) * 100) / 100,
    ids,
  );
}

/** Playoff wins per roster. */
export function playoffWins(history: LeagueHistory): LeaderRow[] {
  const wins = new Map<number, number>();
  const ids = new Set<number>();
  for (const g of history.games) {
    if (!g.isPlayoff) continue;
    ids.add(g.rosterId);
    if (g.win) wins.set(g.rosterId, (wins.get(g.rosterId) ?? 0) + 1);
  }
  return leaderboard(history, (id) => wins.get(id) ?? 0, ids);
}

/** Highest single-week scores (top N). */
export function topWeeklyScores(history: LeagueHistory, limit = 10): GameRecord[] {
  return [...history.games]
    .sort((a, b) => b.points - a.points)
    .slice(0, limit)
    .map((g) => ({
      rosterId: g.rosterId,
      teamName: teamName(history, g.rosterId),
      season: g.season,
      week: g.week,
      points: g.points,
    }));
}

/** Lowest single-week scores (bottom N, excluding zeroes). */
export function bottomWeeklyScores(
  history: LeagueHistory,
  limit = 10,
): GameRecord[] {
  return [...history.games]
    .filter((g) => g.points > 0)
    .sort((a, b) => a.points - b.points)
    .slice(0, limit)
    .map((g) => ({
      rosterId: g.rosterId,
      teamName: teamName(history, g.rosterId),
      season: g.season,
      week: g.week,
      points: g.points,
    }));
}

/** Largest margins of victory (blowouts). */
export function biggestBlowouts(history: LeagueHistory, limit = 10): GameRecord[] {
  return history.games
    .filter((g) => g.win)
    .map((g) => ({
      rosterId: g.rosterId,
      teamName: teamName(history, g.rosterId),
      season: g.season,
      week: g.week,
      points: g.points,
      margin: g.points - g.opponentPoints,
    }))
    .sort((a, b) => b.margin - a.margin)
    .slice(0, limit)
    .map(({ margin, ...rest }) => ({
      ...rest,
      detail: `+${margin.toFixed(1)} margin`,
    }));
}

/** Longest win streaks, overall and in the playoffs. */
export function longestWinStreaks(history: LeagueHistory): {
  overall: LeaderRow[];
  playoff: LeaderRow[];
} {
  const byRoster = new Map<number, GameResult[]>();
  for (const g of history.games) {
    const arr = byRoster.get(g.rosterId) ?? [];
    arr.push(g);
    byRoster.set(g.rosterId, arr);
  }

  const overall = new Map<number, number>();
  const playoff = new Map<number, number>();

  for (const [rosterId, list] of byRoster) {
    list.sort((a, b) =>
      a.season === b.season ? a.week - b.week : a.season.localeCompare(b.season),
    );
    let cur = 0;
    let best = 0;
    let curP = 0;
    let bestP = 0;
    for (const g of list) {
      cur = g.win ? cur + 1 : 0;
      best = Math.max(best, cur);
      if (g.isPlayoff) {
        curP = g.win ? curP + 1 : 0;
        bestP = Math.max(bestP, curP);
      }
    }
    overall.set(rosterId, best);
    playoff.set(rosterId, bestP);
  }

  return {
    overall: leaderboard(history, (id) => overall.get(id) ?? 0, overall.keys()),
    playoff: leaderboard(history, (id) => playoff.get(id) ?? 0, playoff.keys()),
  };
}

/* --------------------------------- trades --------------------------------- */

export interface TradeStats {
  /** Most trades participated in, per roster. */
  mostTrades: LeaderRow[];
  /** Most players acquired via trade, per roster. */
  mostPlayersTraded: LeaderRow[];
  /** Total completed trades across all seasons. */
  totalTrades: number;
}

/** Compute trade stats across the season chain from Sleeper transactions. */
export async function loadTradeStats(
  leagueId: string,
): Promise<TradeStats & { history: LeagueHistory }> {
  const history = await loadLeagueHistory(leagueId);
  const tradesByRoster = new Map<number, number>();
  const playersByRoster = new Map<number, number>();
  let totalTrades = 0;

  for (const season of history.seasons) {
    for (let week = 1; week <= 18; week++) {
      const txns = await getTransactions(season.leagueId, week).catch(() => []);
      for (const t of txns ?? []) {
        if (t.type !== "trade" || t.status !== "complete") continue;
        totalTrades++;
        for (const rid of t.roster_ids ?? []) {
          tradesByRoster.set(rid, (tradesByRoster.get(rid) ?? 0) + 1);
        }
        for (const rid of Object.values(t.adds ?? {})) {
          playersByRoster.set(rid, (playersByRoster.get(rid) ?? 0) + 1);
        }
      }
    }
  }

  const ids = new Set<number>([
    ...tradesByRoster.keys(),
    ...playersByRoster.keys(),
  ]);
  const name = (id: number) =>
    history.latestTeams.get(id)?.teamName ?? `Roster #${id}`;

  const mostTrades = [...ids]
    .map((id) => ({ rosterId: id, teamName: name(id), value: tradesByRoster.get(id) ?? 0 }))
    .sort((a, b) => b.value - a.value);
  const mostPlayersTraded = [...ids]
    .map((id) => ({ rosterId: id, teamName: name(id), value: playersByRoster.get(id) ?? 0 }))
    .sort((a, b) => b.value - a.value);

  return { mostTrades, mostPlayersTraded, totalTrades, history };
}
