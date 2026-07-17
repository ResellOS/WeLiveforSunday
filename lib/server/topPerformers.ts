import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { getMatchups, getRosters, getAllPlayers } from "@/lib/sleeper";
import { getKtcValueMap } from "@/lib/queries";
import type { FantasyLeaderboard, FantasyPerformer } from "@/lib/home";
import type { PlayerMap } from "@/types/sleeper";

const TOP_N = 50;
const CACHE_DIR = join(process.cwd(), ".cache");
const FULL_PLAYERS_CACHE = join(CACHE_DIR, "sleeper-players.json");

let fullDiskCache: PlayerMap | null = null;

function leaguePlayersCachePath(leagueId: string): string {
  return join(CACHE_DIR, `league-${leagueId}-players.json`);
}

function readJsonMap(filePath: string): PlayerMap | null {
  try {
    if (!existsSync(filePath)) return null;
    const parsed = JSON.parse(readFileSync(filePath, "utf8")) as PlayerMap;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function writeJsonMap(filePath: string, map: PlayerMap): void {
  try {
    mkdirSync(CACHE_DIR, { recursive: true });
    writeFileSync(filePath, JSON.stringify(map));
  } catch {
    // non-fatal
  }
}

function readFullPlayersDiskCache(): PlayerMap | null {
  if (fullDiskCache) return fullDiskCache;
  fullDiskCache = readJsonMap(FULL_PLAYERS_CACHE);
  return fullDiskCache;
}

async function readFullPlayersLive(): Promise<PlayerMap | null> {
  try {
    const live = await getAllPlayers();
    return live && Object.keys(live).length > 0 ? live : null;
  } catch {
    return null;
  }
}

function subsetPlayers(map: PlayerMap, ids: Iterable<string>): PlayerMap {
  const out: PlayerMap = {};
  for (const pid of ids) {
    const p = map[pid];
    if (p) out[pid] = p;
  }
  return out;
}

async function loadPlayerMap(
  leagueId: string,
  rosterIds: Set<string>,
  scoringIds: Set<string>,
): Promise<PlayerMap> {
  const needed = new Set([...rosterIds, ...scoringIds]);
  const leagueCache = readJsonMap(leaguePlayersCachePath(leagueId));
  if (leagueCache && Object.keys(leagueCache).length > 0) {
    return leagueCache;
  }

  return refreshLeaguePlayerCache(leagueId, needed);
}

async function refreshLeaguePlayerCache(
  leagueId: string,
  needed: Set<string>,
): Promise<PlayerMap> {
  const full =
    (await readFullPlayersLive()) ??
    readFullPlayersDiskCache() ??
    ({} as PlayerMap);

  const subset = subsetPlayers(full, needed);
  if (Object.keys(subset).length > 0) {
    writeJsonMap(leaguePlayersCachePath(leagueId), subset);
    return subset;
  }

  return readJsonMap(leaguePlayersCachePath(leagueId)) ?? {};
}

function performerFromPlayer(
  playerId: string,
  players: PlayerMap,
  fpts: number,
  projected: number,
  rank: number,
  projectedBoard: boolean,
): FantasyPerformer | null {
  const p = players[playerId];
  if (!p?.full_name && !p?.first_name) return null;
  const name = p.full_name ?? [p.first_name, p.last_name].filter(Boolean).join(" ");
  const diff = fpts - projected;
  return {
    playerId,
    name,
    nflTeam: p.team ?? "FA",
    position: p.position ?? p.fantasy_positions?.[0] ?? "—",
    fpts,
    projected,
    statLine: projectedBoard
      ? `KTC value index · ${projected.toLocaleString()}`
      : `${p.team ?? "FA"} · ${p.position ?? ""}`.trim(),
    trend: diff > 1 ? "up" : diff < -1 ? "down" : "flat",
    boom: !projectedBoard && fpts >= 25,
    rank,
  };
}

/** Top 50 fantasy scorers for the week, or KTC-projected board in the offseason. */
export async function loadTopFantasyPerformers(
  leagueId: string,
  week: number,
): Promise<FantasyLeaderboard> {
  const [matchups, rosters, ktc] = await Promise.all([
    getMatchups(leagueId, week).catch(() => []),
    getRosters(leagueId).catch(() => []),
    getKtcValueMap(),
  ]);

  const rosterIds = new Set<string>();
  for (const r of rosters) {
    for (const pid of r.players ?? []) rosterIds.add(pid);
  }

  const pointsByPlayer = new Map<string, number>();
  for (const m of matchups) {
    for (const [pid, pts] of Object.entries(m.players_points ?? {})) {
      if (pts > 0) {
        pointsByPlayer.set(pid, (pointsByPlayer.get(pid) ?? 0) + pts);
      }
    }
  }

  const players = await loadPlayerMap(
    leagueId,
    rosterIds,
    new Set(pointsByPlayer.keys()),
  );

  const hasLiveScores = pointsByPlayer.size > 0;

  if (hasLiveScores) {
    const sorted = [...pointsByPlayer.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOP_N);

    const performers = sorted
      .map(([pid, fpts], i) =>
        performerFromPlayer(pid, players, fpts, fpts * 0.85, i + 1, false),
      )
      .filter((p): p is FantasyPerformer => p != null);

    return {
      performers,
      label: `WEEK ${week}`,
      projected: false,
    };
  }

  const valued = [...rosterIds]
    .map((pid) => {
      const p = players[pid];
      const name = p?.full_name?.toLowerCase();
      const value = name ? (ktc.get(name) ?? 0) : 0;
      return { pid, value };
    })
    .filter((e) => e.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, TOP_N);

  const performers = valued
    .map(({ pid, value }, i) =>
      performerFromPlayer(pid, players, value, value, i + 1, true),
    )
    .filter((p): p is FantasyPerformer => p != null);

  return {
    performers,
    label: "PROJECTED",
    projected: true,
  };
}
