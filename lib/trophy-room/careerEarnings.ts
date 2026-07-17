import type { SeasonRow } from "@/lib/queries";

/** Championship payout per title (matches Trophy Room legacy bar). */
export const CHAMPIONSHIP_PAYOUT = 600;

export interface CareerEarner {
  rank: number;
  managerName: string;
  earnings: number;
}

/**
 * Top career earners from recorded championship wins.
 * Pads to three rows with placeholder names when the ledger is still empty.
 */
export function buildCareerEarningsLeaderboard(
  seasons: SeasonRow[],
  teamNames: Record<number, string>,
): CareerEarner[] {
  const totals = new Map<number, number>();

  for (const season of seasons) {
    if (season.champion_roster_id == null) continue;
    const rid = season.champion_roster_id;
    totals.set(rid, (totals.get(rid) ?? 0) + CHAMPIONSHIP_PAYOUT);
  }

  const ranked = [...totals.entries()]
    .map(([rosterId, earnings]) => ({
      managerName: teamNames[rosterId] ?? `Roster #${rosterId}`,
      earnings,
    }))
    .sort((a, b) => b.earnings - a.earnings || a.managerName.localeCompare(b.managerName))
    .slice(0, 3);

  while (ranked.length < 3) {
    ranked.push({ managerName: "Manager Name", earnings: 0 });
  }

  return ranked.map((entry, i) => ({
    rank: i + 1,
    managerName: entry.managerName,
    earnings: entry.earnings,
  }));
}

export function fmtEarnings(amount: number): string {
  return `$${amount.toLocaleString("en-US")}`;
}
