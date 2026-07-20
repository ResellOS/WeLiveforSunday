/**
 * Real NFL schedule + live scores from Sleeper's public web API (api.sleeper.com).
 * Undocumented but used by the Sleeper app for scores/schedule tabs.
 */

import type { NFLState } from "@/types/sleeper";

const SLEEPER_COM = "https://api.sleeper.com";
const CACHE_TTL_MS = 60 * 1000; // 1 minute — scores update frequently on gameday

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

async function sleeperComFetch<T>(path: string, ttlMs = CACHE_TTL_MS): Promise<T> {
  const now = Date.now();
  const cached = cache.get(path);
  if (cached && cached.expiresAt > now) {
    return cached.value as T;
  }

  const res = await fetch(`${SLEEPER_COM}${path}`, {
    next: { revalidate: Math.floor(ttlMs / 1000) },
  });
  if (!res.ok) {
    throw new Error(`Sleeper schedule/scores ${path} failed: ${res.status}`);
  }
  const value = (await res.json()) as T;
  cache.set(path, { value, expiresAt: now + ttlMs });
  return value;
}

export interface SleeperNflScheduleGame {
  status: string;
  date: string;
  home: string;
  away: string;
  week: number;
  game_id: string;
}

export interface SleeperNflScoreGame {
  status: string;
  date: string;
  week: number;
  season: number;
  game_id: string;
  start_time?: number;
  metadata: {
    away_team: string;
    home_team: string;
    away_score?: number;
    home_score?: number;
    quarter?: string;
    time_remaining?: string;
    possession?: string;
    red_zone?: string;
    is_in_progress?: boolean;
    is_over?: boolean;
    has_started?: boolean;
    channel?: string;
    date_time?: string;
  };
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
  pregame?: boolean;
  kickoff?: string;
  network?: string;
};

export type NflTickerBoard = {
  games: NflTickerGame[];
  label: string;
};

type DisplayContext = {
  seasonType: "regular" | "post" | "pre";
  season: string;
  week: number;
};

/** Pick the NFL week/season the homepage ticker should show. */
export function resolveNflTickerContext(state: NFLState): DisplayContext {
  const season = state.season;

  if (state.season_type === "pre") {
    return {
      seasonType: "pre",
      season,
      week: Math.max(1, state.week || state.display_week || 1),
    };
  }

  if (state.season_type === "regular" || state.season_type === "post") {
    const week = Math.max(
      1,
      state.display_week || state.week || state.leg || 1,
    );
    return {
      seasonType: state.season_type,
      season,
      week,
    };
  }

  // Offseason — show the upcoming regular-season opener slate.
  return { seasonType: "regular", season, week: 1 };
}

function formatKickoff(dateTime?: string, date?: string): string {
  if (dateTime) {
    return new Date(dateTime).toLocaleString("en-US", {
      weekday: "short",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/New_York",
    });
  }
  if (date) {
    return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      timeZone: "America/New_York",
    });
  }
  return "Scheduled";
}

function mapPossession(
  team: string | undefined,
  away: string,
  home: string,
): "away" | "home" | undefined {
  if (!team) return undefined;
  if (team === away) return "away";
  if (team === home) return "home";
  return undefined;
}

function mapScoreGame(game: SleeperNflScoreGame): NflTickerGame {
  const m = game.metadata;
  const away = m.away_team;
  const home = m.home_team;
  const awayScore = m.away_score ?? 0;
  const homeScore = m.home_score ?? 0;
  const kickoff = formatKickoff(m.date_time, game.date);
  const network = m.channel;

  const isFinal =
    game.status === "complete" ||
    m.is_over === true ||
    m.quarter === "F" ||
    m.quarter === "FO";

  const isPregame =
    game.status === "pre_game" ||
    (!m.has_started && !m.is_in_progress && !isFinal);

  if (isFinal) {
    return {
      id: game.game_id,
      away,
      home,
      awayScore,
      homeScore,
      quarter: "FINAL",
      clock: "",
      final: true,
      pregame: false,
      kickoff,
      network,
    };
  }

  if (isPregame) {
    return {
      id: game.game_id,
      away,
      home,
      awayScore: 0,
      homeScore: 0,
      quarter: "Scheduled",
      clock: kickoff,
      pregame: true,
      kickoff,
      network,
      final: false,
    };
  }

  const quarter = m.quarter ?? "Live";
  const clock = m.time_remaining ?? "";
  const isHalftime =
    quarter.toLowerCase().includes("half") || quarter === "HT";

  return {
    id: game.game_id,
    away,
    home,
    awayScore,
    homeScore,
    quarter: isHalftime ? "HALFTIME" : quarter,
    clock,
    possession: mapPossession(m.possession, away, home),
    redZone: Boolean(m.red_zone),
    final: false,
    pregame: false,
    kickoff,
    network,
  };
}

function mapScheduleGame(
  game: SleeperNflScheduleGame,
  weekLabel: number,
): NflTickerGame {
  const kickoff = formatKickoff(undefined, game.date);
  return {
    id: game.game_id,
    away: game.away,
    home: game.home,
    awayScore: 0,
    homeScore: 0,
    quarter: `Week ${weekLabel}`,
    clock: kickoff,
    pregame: true,
    kickoff,
    final: false,
  };
}

export async function getNflScores(
  seasonType: string,
  season: string,
  week: number,
): Promise<SleeperNflScoreGame[]> {
  const data = await sleeperComFetch<SleeperNflScoreGame[]>(
    `/scores/nfl/${seasonType}/${season}/${week}`,
  );
  return Array.isArray(data) ? data : [];
}

export async function getNflSchedule(
  seasonType: string,
  season: string,
): Promise<SleeperNflScheduleGame[]> {
  const data = await sleeperComFetch<SleeperNflScheduleGame[]>(
    `/schedule/nfl/${seasonType}/${season}`,
    5 * 60 * 1000,
  );
  return Array.isArray(data) ? data : [];
}

function boardLabel(ctx: DisplayContext): string {
  const type =
    ctx.seasonType === "pre"
      ? "Preseason"
      : ctx.seasonType === "post"
        ? "Playoffs"
        : "Week";
  return `${type} ${ctx.week} · ${ctx.season}`;
}

/** Load real NFL games for the homepage ticker. Falls back to schedule-only data. */
export async function loadNflTickerBoard(
  state: NFLState,
): Promise<NflTickerBoard> {
  const ctx = resolveNflTickerContext(state);

  try {
    let games = await getNflScores(ctx.seasonType, ctx.season, ctx.week);

    if (games.length === 0) {
      const schedule = await getNflSchedule(ctx.seasonType, ctx.season);
      games = schedule
        .filter((g) => g.week === ctx.week)
        .map((g) => ({
          status: g.status,
          date: g.date,
          week: g.week,
          season: Number(ctx.season),
          game_id: g.game_id,
          metadata: {
            away_team: g.away,
            home_team: g.home,
            date_time: undefined,
          },
        }));
    }

    const mapped = games
      .map(mapScoreGame)
      .sort((a, b) => {
        const ta = a.kickoff ?? "";
        const tb = b.kickoff ?? "";
        return ta.localeCompare(tb);
      });

    if (mapped.length > 0) {
      return { games: mapped, label: boardLabel(ctx) };
    }
  } catch {
    /* fall through to schedule-only */
  }

  try {
    const schedule = await getNflSchedule(ctx.seasonType, ctx.season);
    const weekGames = schedule
      .filter((g) => g.week === ctx.week)
      .map((g) => mapScheduleGame(g, ctx.week));

    if (weekGames.length > 0) {
      return { games: weekGames, label: boardLabel(ctx) };
    }
  } catch {
    /* no data */
  }

  return { games: [], label: boardLabel(ctx) };
}
