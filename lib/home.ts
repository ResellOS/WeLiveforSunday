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

export interface PowerRankingEntry {
  rank: number;
  team: StandingRow;
  /** Composite power score (placeholder formula). */
  score: number;
  /** Weekly momentum indicator: +1 up, -1 down, 0 flat. */
  delta: number;
}

/**
 * Placeholder power rankings — weighted blend of record, PF, and streak.
 * Dynasty assets / positional strength will replace this later.
 */
export function computePowerRankings(
  standings: StandingRow[],
): PowerRankingEntry[] {
  const scored = standings.map((t) => {
    const games = Math.max(1, t.wins + t.losses + t.ties);
    const ppg = t.pointsFor / games;
    const score =
      (17 - t.rank) * 8 + t.pct * 30 + ppg * 0.12 + t.streak * 2.5;
    const delta = t.streak >= 2 ? 1 : t.streak <= -2 ? -1 : 0;
    return { team: t, score, delta };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .map((e, i) => ({ rank: i + 1, ...e }));
}

/** Top N matchups for the featured scoreboard (excludes MOTW). */
export function pickFeaturedMatchups(
  pairs: MatchupPair[],
  motw: MatchupPair | null,
  limit = 4,
): MatchupPair[] {
  const motwId = motw?.matchupId;
  return pairs.filter((p) => p.matchupId !== motwId).slice(0, limit);
}

export type FantasyNewsItem = {
  playerId: string;
  playerName: string;
  nflTeam: string;
  position: string;
  category: string;
  headline: string;
  time: string;
  source: string;
  url: string;
};

/** Placeholder fantasy news until Sleeper player news is wired. */
export function placeholderFantasyNews(): FantasyNewsItem[] {
  return [
    {
      playerId: "6794",
      playerName: "Justin Jefferson",
      nflTeam: "MIN",
      position: "WR",
      category: "Injury Update",
      headline: "Jefferson listed as limited in practice — monitoring for Week 1",
      time: "2h ago",
      source: "ESPN",
      url: "https://www.espn.com/nfl/",
    },
    {
      playerId: "4984",
      playerName: "Josh Allen",
      nflTeam: "BUF",
      position: "QB",
      category: "League Note",
      headline: "Allen projected as top QB1 in season-long fantasy formats",
      time: "4h ago",
      source: "Sleeper",
      url: "https://sleeper.com/",
    },
    {
      playerId: "7564",
      playerName: "Ja'Marr Chase",
      nflTeam: "CIN",
      position: "WR",
      category: "Trade Rumor",
      headline: "Chase extension talks progress — dynasty value holds firm",
      time: "6h ago",
      source: "NFL Network",
      url: "https://www.nfl.com/news/",
    },
    {
      playerId: "9509",
      playerName: "Bijan Robinson",
      nflTeam: "ATL",
      position: "RB",
      category: "Workload",
      headline: "Robinson expected to handle goal-line work in season opener",
      time: "8h ago",
      source: "FantasyPros",
      url: "https://www.fantasypros.com/",
    },
    {
      playerId: "4046",
      playerName: "Patrick Mahomes",
      nflTeam: "KC",
      position: "QB",
      category: "Matchup",
      headline: "Mahomes faces top-12 pass defense in Week 1 — still a must-start",
      time: "12h ago",
      source: "ESPN",
      url: "https://www.espn.com/nfl/",
    },
  ];
}

export type NflTickerGame = {
  id: string;
  away: string;
  home: string;
  awayScore: number;
  homeScore: number;
  quarter: string;
  clock: string;
  possession?: "away" | "home";
  redZone?: boolean;
  final?: boolean;
  touchdown?: boolean;
  /** True when the game has not started — no live score invented. */
  pregame?: boolean;
  kickoff?: string;
  network?: string;
};

/** NFL schedule board — pregame truthfully labeled; no invented live scores. */
export function buildNflScheduleBoard(
  seasonType: string,
  week = 1,
): NflTickerGame[] {
  const inSeason = seasonType === "regular" || seasonType === "post";
  const slate: Array<{
    id: string;
    away: string;
    home: string;
    kickoff: string;
    network?: string;
  }> = [
    { id: "1", away: "BUF", home: "KC", kickoff: "Sun 8:20 PM", network: "NBC" },
    { id: "2", away: "DAL", home: "PHI", kickoff: "Sun 4:25 PM", network: "FOX" },
    { id: "3", away: "DET", home: "GB", kickoff: "Sun 1:00 PM", network: "FOX" },
    { id: "4", away: "SF", home: "SEA", kickoff: "Sun 4:05 PM", network: "CBS" },
    { id: "5", away: "MIA", home: "NYJ", kickoff: "Sun 1:00 PM", network: "CBS" },
    { id: "6", away: "BAL", home: "CIN", kickoff: "Sun 1:00 PM", network: "CBS" },
    { id: "7", away: "HOU", home: "IND", kickoff: "Sun 1:00 PM", network: "CBS" },
    { id: "8", away: "ATL", home: "TB", kickoff: "Sun 1:00 PM", network: "FOX" },
    { id: "9", away: "CLE", home: "PIT", kickoff: "Sun 1:00 PM", network: "CBS" },
    { id: "10", away: "JAX", home: "TEN", kickoff: "Sun 1:00 PM", network: "CBS" },
    { id: "11", away: "LAR", home: "ARI", kickoff: "Sun 4:25 PM", network: "FOX" },
    { id: "12", away: "LV", home: "LAC", kickoff: "Sun 4:25 PM", network: "CBS" },
    { id: "13", away: "DEN", home: "NO", kickoff: "Mon 8:15 PM", network: "ESPN" },
    { id: "14", away: "NYG", home: "WAS", kickoff: "Sun 1:00 PM", network: "FOX" },
  ];

  return slate.map((g) => ({
    ...g,
    awayScore: 0,
    homeScore: 0,
    quarter: inSeason ? `Week ${week}` : "Scheduled",
    clock: g.kickoff,
    pregame: true,
    kickoff: g.kickoff,
    network: g.network,
    final: false,
  }));
}

/** @deprecated Use buildNflScheduleBoard — kept for imports during transition */
export function placeholderNflScores(): NflTickerGame[] {
  return buildNflScheduleBoard("pre", 1);
}

export type FantasyPerformer = {
  playerId: string;
  name: string;
  nflTeam: string;
  position: string;
  fpts: number;
  projected: number;
  statLine: string;
  trend: "up" | "down" | "flat";
  boom: boolean;
  /** Overall rank in the top-50 board (1-indexed). */
  rank: number;
};

export type FantasyLeaderboard = {
  performers: FantasyPerformer[];
  /** Header suffix, e.g. "WEEK 3" or "PROJECTED" */
  label: string;
  projected: boolean;
};

/** Placeholder top performers carousel data. */
export function placeholderFantasyPerformers(): FantasyPerformer[] {
  return [
    {
      playerId: "4984",
      name: "Josh Allen",
      nflTeam: "BUF",
      position: "QB",
      fpts: 34.6,
      projected: 24.2,
      statLine: "312 pass · 2 TD · 42 rush",
      trend: "up",
      boom: true,
      rank: 1,
    },
    {
      playerId: "6794",
      name: "Justin Jefferson",
      nflTeam: "MIN",
      position: "WR",
      fpts: 28.4,
      projected: 18.5,
      statLine: "9 rec · 142 yds · 1 TD",
      trend: "up",
      boom: true,
      rank: 2,
    },
    {
      playerId: "4866",
      name: "Saquon Barkley",
      nflTeam: "PHI",
      position: "RB",
      fpts: 26.1,
      projected: 16.8,
      statLine: "22 rush · 118 yds · 2 TD",
      trend: "up",
      boom: false,
      rank: 3,
    },
    {
      playerId: "7564",
      name: "Ja'Marr Chase",
      nflTeam: "CIN",
      position: "WR",
      fpts: 24.8,
      projected: 17.2,
      statLine: "7 rec · 98 yds · 1 TD",
      trend: "flat",
      boom: false,
      rank: 4,
    },
    {
      playerId: "9509",
      name: "Bijan Robinson",
      nflTeam: "ATL",
      position: "RB",
      fpts: 22.3,
      projected: 15.4,
      statLine: "18 rush · 89 yds · 1 TD",
      trend: "up",
      boom: false,
      rank: 5,
    },
  ];
}

export type ChatMessage = {
  id: string;
  author: string;
  avatar: string | null;
  text: string;
  time: string;
  type?: "commissioner" | "trade" | "td" | "normal";
};

/** Placeholder league chat seeded from real team names. */
export function buildLeagueChat(standings: StandingRow[]): ChatMessage[] {
  const names = standings.map((t) => t.teamName);
  const pick = (i: number) => names[i % names.length] ?? "Manager";
  const avatar = (i: number) => standings[i % standings.length]?.avatar ?? null;

  return [
    {
      id: "1",
      author: "Commissioner",
      avatar: null,
      text: "Week 1 lineup locks Sunday 12:45 PM ET. Set your starters.",
      time: "2m ago",
      type: "commissioner",
    },
    {
      id: "2",
      author: pick(2),
      avatar: avatar(2),
      text: "That trade offer is insulting 😂",
      time: "5m ago",
      type: "trade",
    },
    {
      id: "3",
      author: pick(5),
      avatar: avatar(5),
      text: "TOUCHDOWN!! Let's goooo 🏈",
      time: "8m ago",
      type: "td",
    },
    {
      id: "4",
      author: pick(1),
      avatar: avatar(1),
      text: "Anyone selling a 2027 1st? DM me.",
      time: "12m ago",
      type: "trade",
    },
    {
      id: "5",
      author: pick(7),
      avatar: avatar(7),
      text: "Playoff race is going to be insane this year.",
      time: "18m ago",
      type: "normal",
    },
  ];
}

export { sleeperPlayerThumb, sleeperTeamLogo } from "@/lib/sleeperMedia";
