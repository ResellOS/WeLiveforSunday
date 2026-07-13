/**
 * Sleeper API client.
 *
 * Wraps Sleeper's public, read-only REST API (https://api.sleeper.app/v1).
 * No auth is required. Sleeper asks callers to stay under ~1000 requests/min,
 * so a small in-memory cache (5 min TTL) is used to avoid redundant calls.
 */

import type {
  Draft,
  DraftPick,
  League,
  Matchup,
  NFLState,
  Player,
  PlayerMap,
  PlayoffBracket,
  Roster,
  Transaction,
  TradedPick,
  User,
} from "@/types/sleeper";

const BASE_URL = "https://api.sleeper.app/v1";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
// The /players/nfl payload is large (~5MB) and changes at most daily; cache longer.
const PLAYERS_CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

/** Error thrown when a Sleeper API request fails. */
export class SleeperApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly endpoint: string,
  ) {
    super(message);
    this.name = "SleeperApiError";
  }
}

/* -------------------------------------------------------------------------- */
/* In-memory cache                                                             */
/* -------------------------------------------------------------------------- */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

// Module-level cache. In the Next.js server runtime this persists across
// requests within a warm instance; on the client it persists for the session.
const cache = new Map<string, CacheEntry<unknown>>();

/** Clears the entire Sleeper request cache (useful for tests / manual refresh). */
export function clearSleeperCache(): void {
  cache.clear();
}

/* -------------------------------------------------------------------------- */
/* Core fetch                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Fetches `path` (relative to the Sleeper base URL) and parses JSON, using the
 * in-memory cache. Sleeper returns `null` (not 404) for many "no data" cases;
 * those are cached and returned as `null`.
 */
async function sleeperFetch<T>(
  path: string,
  ttlMs: number = CACHE_TTL_MS,
): Promise<T> {
  const now = Date.now();
  const cached = cache.get(path);
  if (cached && cached.expiresAt > now) {
    return cached.value as T;
  }

  const url = `${BASE_URL}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Accept: "application/json" },
      // Let our own cache govern freshness; don't rely on fetch caching.
      cache: "no-store",
    });
  } catch (err) {
    throw new SleeperApiError(
      `Network error requesting Sleeper: ${(err as Error).message}`,
      0,
      path,
    );
  }

  if (!res.ok) {
    throw new SleeperApiError(
      `Sleeper request failed with status ${res.status}`,
      res.status,
      path,
    );
  }

  let value: T;
  try {
    value = (await res.json()) as T;
  } catch {
    throw new SleeperApiError("Failed to parse Sleeper response as JSON", res.status, path);
  }

  cache.set(path, { value, expiresAt: now + ttlMs });
  return value;
}

/* -------------------------------------------------------------------------- */
/* Typed endpoints                                                             */
/* -------------------------------------------------------------------------- */

/** GET /league/{league_id} */
export function getLeague(leagueId: string): Promise<League> {
  return sleeperFetch<League>(`/league/${leagueId}`);
}

/** GET /league/{league_id}/rosters */
export function getRosters(leagueId: string): Promise<Roster[]> {
  return sleeperFetch<Roster[]>(`/league/${leagueId}/rosters`);
}

/** GET /league/{league_id}/users */
export function getUsers(leagueId: string): Promise<User[]> {
  return sleeperFetch<User[]>(`/league/${leagueId}/users`);
}

/** GET /league/{league_id}/matchups/{week} */
export function getMatchups(leagueId: string, week: number): Promise<Matchup[]> {
  return sleeperFetch<Matchup[]>(`/league/${leagueId}/matchups/${week}`);
}

/**
 * GET /league/{league_id}/transactions/{week}
 * Sleeper keys transactions by "round", which corresponds to the NFL week.
 */
export function getTransactions(
  leagueId: string,
  week: number,
): Promise<Transaction[]> {
  return sleeperFetch<Transaction[]>(
    `/league/${leagueId}/transactions/${week}`,
  );
}

/**
 * GET /league/{league_id}/winners_bracket
 * The playoff (winners) bracket. Use `getLosersBracket` for the consolation bracket.
 */
export function getPlayoffBracket(leagueId: string): Promise<PlayoffBracket> {
  return sleeperFetch<PlayoffBracket>(`/league/${leagueId}/winners_bracket`);
}

/** GET /league/{league_id}/losers_bracket */
export function getLosersBracket(leagueId: string): Promise<PlayoffBracket> {
  return sleeperFetch<PlayoffBracket>(`/league/${leagueId}/losers_bracket`);
}

/** GET /draft/{draft_id} */
export function getDraft(draftId: string): Promise<Draft> {
  return sleeperFetch<Draft>(`/draft/${draftId}`);
}

/** GET /draft/{draft_id}/picks */
export function getDraftPicks(draftId: string): Promise<DraftPick[]> {
  return sleeperFetch<DraftPick[]>(`/draft/${draftId}/picks`);
}

/** GET /state/nfl — current NFL week/season info. */
export function getNFLState(): Promise<NFLState> {
  return sleeperFetch<NFLState>(`/state/nfl`);
}

/**
 * GET /league/{league_id}/traded_picks
 * All draft picks that have been traded (owned by a roster other than origin).
 * Used to compute each team's future draft capital.
 */
export function getTradedPicks(leagueId: string): Promise<TradedPick[]> {
  return sleeperFetch<TradedPick[]>(`/league/${leagueId}/traded_picks`);
}

/**
 * GET /players/nfl — full player dictionary (player_id -> Player).
 * Large (~5MB) and slow; cached for 12h. Sleeper asks that this be called at
 * most once per day. Prefer resolving names via the returned map.
 */
export function getAllPlayers(): Promise<PlayerMap> {
  return sleeperFetch<PlayerMap>(`/players/nfl`, PLAYERS_CACHE_TTL_MS);
}

/** Convenience: "First Last" for a player id using a PlayerMap, with fallbacks. */
export function playerName(map: PlayerMap, playerId: string): string {
  const p: Player | undefined = map[playerId];
  if (!p) return playerId;
  if (p.full_name) return p.full_name;
  const composed = [p.first_name, p.last_name].filter(Boolean).join(" ");
  return composed || playerId;
}
