/**
 * League activity feed — real Sleeper transactions (trades, waivers, adds/drops).
 * Sleeper's public API does not expose league chat; this is the supported fallback.
 */

import { getTransactions, getAllPlayers, playerName } from "@/lib/sleeper";
import type { PlayerMap, Transaction } from "@/types/sleeper";
import type { StandingRow } from "@/lib/league";

export type ActivityType =
  | "trade"
  | "waiver"
  | "free_agent"
  | "drop"
  | "commissioner"
  | "normal";

export type LeagueActivityItem = {
  id: string;
  author: string;
  avatar: string | null;
  text: string;
  /** Relative display, e.g. "2h ago" */
  time: string;
  /** Epoch ms for sorting and scroll preservation */
  timestamp: number;
  type: ActivityType;
};

export type LeagueActivityPayload = {
  mode: "activity";
  items: LeagueActivityItem[];
  live: boolean;
  emptyMessage?: string;
};

const WEEKS_BACK = 4;
const MAX_ITEMS = 30;

function formatRelativeTime(epochMs: number, now = Date.now()): string {
  const diff = Math.max(0, now - epochMs);
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(epochMs).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function rosterTeam(
  rosterId: number,
  teams: Map<number, StandingRow>,
): { name: string; avatar: string | null } {
  const t = teams.get(rosterId);
  return {
    name: t?.teamName ?? `Roster #${rosterId}`,
    avatar: t?.avatar ?? null,
  };
}

function playerList(
  ids: string[],
  players: PlayerMap,
  limit = 3,
): string {
  const names = ids
    .map((id) => playerName(players, id))
    .filter(Boolean)
    .slice(0, limit);
  if (names.length === 0) return "players";
  if (ids.length > limit) return `${names.join(", ")} +${ids.length - limit}`;
  return names.join(", ");
}

function formatTransaction(
  txn: Transaction,
  teams: Map<number, StandingRow>,
  players: PlayerMap,
): LeagueActivityItem | null {
  const primaryRoster = txn.roster_ids[0];
  if (primaryRoster == null) return null;

  const team = rosterTeam(primaryRoster, teams);
  const addIds = Object.keys(txn.adds ?? {});
  const dropIds = Object.keys(txn.drops ?? {});
  const picks = txn.draft_picks?.length ?? 0;
  const bid = txn.settings?.waiver_bid;

  let text = "";
  let type: ActivityType = "normal";

  switch (txn.type) {
    case "trade": {
      type = "trade";
      const parts: string[] = [];
      if (addIds.length) parts.push(`received ${playerList(addIds, players)}`);
      if (dropIds.length) parts.push(`sent ${playerList(dropIds, players)}`);
      if (picks > 0) parts.push(`${picks} pick${picks > 1 ? "s" : ""}`);
      text = parts.length
        ? `Trade: ${parts.join(" · ")}`
        : "Completed a trade";
      break;
    }
    case "waiver": {
      type = "waiver";
      if (addIds.length && dropIds.length) {
        text = `Waiver claim: added ${playerList(addIds, players, 2)}, dropped ${playerList(dropIds, players, 2)}`;
      } else if (addIds.length) {
        text = `Waiver claim: added ${playerList(addIds, players)}`;
      } else {
        text = "Processed a waiver move";
      }
      if (bid != null && bid > 0) text += ` ($${bid})`;
      break;
    }
    case "free_agent": {
      if (dropIds.length && !addIds.length) {
        type = "drop";
        text = `Dropped ${playerList(dropIds, players)}`;
      } else {
        type = "free_agent";
        if (addIds.length && dropIds.length) {
          text = `Added ${playerList(addIds, players, 2)}, dropped ${playerList(dropIds, players, 2)}`;
        } else if (addIds.length) {
          text = `Added ${playerList(addIds, players)}`;
        } else {
          text = "Roster move processed";
        }
      }
      break;
    }
    case "commissioner": {
      type = "commissioner";
      text = "Commissioner roster adjustment";
      break;
    }
    default:
      text = "League transaction processed";
  }

  return {
    id: txn.transaction_id,
    author: team.name,
    avatar: team.avatar,
    text,
    time: formatRelativeTime(txn.created),
    timestamp: txn.created,
    type,
  };
}

/** Load recent league activity from Sleeper transactions. */
export async function loadLeagueActivity(
  leagueId: string,
  currentWeek: number,
  standings: StandingRow[],
): Promise<LeagueActivityPayload> {
  const teams = new Map(standings.map((t) => [t.rosterId, t]));
  const weekEnd = Math.max(1, currentWeek);
  const weekStart = Math.max(1, weekEnd - WEEKS_BACK + 1);
  const weeks = Array.from(
    { length: weekEnd - weekStart + 1 },
    (_, i) => weekStart + i,
  );

  const [players, ...txnByWeek] = await Promise.all([
    getAllPlayers().catch((): PlayerMap => ({})),
    ...weeks.map((w) => getTransactions(leagueId, w).catch(() => [])),
  ]);

  const seen = new Set<string>();
  const items: LeagueActivityItem[] = [];
  const allTxns = txnByWeek
    .flat()
    .sort((a, b) => b.created - a.created);

  for (const txn of allTxns) {
    if (txn.status !== "complete") continue;
    if (seen.has(txn.transaction_id)) continue;
    seen.add(txn.transaction_id);
    const item = formatTransaction(txn, teams, players);
    if (item) items.push(item);
    if (items.length >= MAX_ITEMS) break;
  }

  return {
    mode: "activity",
    items,
    live: true,
    emptyMessage:
      items.length === 0
        ? "No trades or roster moves recorded yet this season."
        : undefined,
  };
}
