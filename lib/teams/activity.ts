/**
 * Team-specific transaction activity from Sleeper.
 */

import { getTransactions, getAllPlayers, playerName } from "@/lib/sleeper";
import type { PlayerMap, Transaction } from "@/types/sleeper";
import type { StandingRow } from "@/lib/league";

export interface TeamActivityItem {
  id: string;
  type: string;
  date: string;
  description: string;
  timestamp: number;
}

const WEEKS_BACK = 6;
const MAX_ITEMS = 20;

function formatDate(epochMs: number): string {
  return new Date(epochMs).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function describeTxn(
  txn: Transaction,
  rosterId: number,
  players: PlayerMap,
): string | null {
  const adds = Object.entries(txn.adds ?? {}).filter(([, r]) => r === rosterId);
  const drops = Object.entries(txn.drops ?? {}).filter(([, r]) => r === rosterId);

  if (!txn.roster_ids.includes(rosterId)) return null;

  switch (txn.type) {
    case "trade": {
      const addNames = adds.map(([id]) => playerName(players, id));
      const dropNames = drops.map(([id]) => playerName(players, id));
      const pickCount = txn.draft_picks?.filter(
        (p) => p.owner_id === rosterId || p.previous_owner_id === rosterId,
      ).length;
      const parts: string[] = [];
      if (addNames.length) parts.push(`Acquired ${addNames.join(", ")}`);
      if (dropNames.length) parts.push(`Sent ${dropNames.join(", ")}`);
      if (pickCount) parts.push(`${pickCount} pick(s)`);
      return parts.length ? parts.join(" · ") : "Completed trade";
    }
    case "waiver":
    case "free_agent": {
      if (adds.length) {
        return `Added ${playerName(players, adds[0][0])}`;
      }
      if (drops.length) {
        return `Dropped ${playerName(players, drops[0][0])}`;
      }
      return null;
    }
    case "commissioner":
      return "Commissioner roster change";
    default:
      return null;
  }
}

export async function loadTeamActivity(
  leagueId: string,
  rosterId: number,
  currentWeek: number,
  teams: Map<number, StandingRow>,
): Promise<TeamActivityItem[]> {
  const players = await getAllPlayers().catch((): PlayerMap => ({}));
  const startWeek = Math.max(1, currentWeek - WEEKS_BACK);
  const weeks = Array.from(
    { length: currentWeek - startWeek + 1 },
    (_, i) => startWeek + i,
  );

  const txns = (
    await Promise.all(
      weeks.map((w) => getTransactions(leagueId, w).catch(() => [])),
    )
  ).flat();

  const items: TeamActivityItem[] = [];

  for (const txn of txns) {
    if (txn.status !== "complete") continue;
    const text = describeTxn(txn, rosterId, players);
    if (!text) continue;
    items.push({
      id: txn.transaction_id,
      type: txn.type,
      date: formatDate(txn.created),
      description: text,
      timestamp: txn.created,
    });
  }

  return items
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, MAX_ITEMS);
}
