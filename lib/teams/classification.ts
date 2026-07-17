/**
 * Transparent contender / rebuilder classification for Teams views.
 *
 * Contenders view uses existing `contenderStatus` from lib/league.ts:
 *  - Contender, Playoff Hopeful, Borderline → contenders view
 *
 * Rebuilders view groups:
 *  - Rebuilding, Retooling, plus young-roster signal when avg age < 25.5
 */

import type { ContenderStatus } from "@/lib/league";
import type { TeamMetrics } from "@/lib/teams/metrics";

export type ContenderTier = "contender" | "hopeful" | "borderline";

export type RebuilderTier = "rebuilding" | "retooling" | "development";

const CONTENDER_TIERS: Record<ContenderStatus, ContenderTier | null> = {
  Contender: "contender",
  "Playoff Hopeful": "hopeful",
  Borderline: "borderline",
  Retooling: null,
  Rebuilding: null,
};

const REBUILDER_TIERS: Record<ContenderStatus, RebuilderTier | null> = {
  Contender: null,
  "Playoff Hopeful": null,
  Borderline: null,
  Retooling: "retooling",
  Rebuilding: "rebuilding",
};

export function contenderTier(status: ContenderStatus): ContenderTier | null {
  return CONTENDER_TIERS[status];
}

export function rebuilderTier(
  status: ContenderStatus,
  metrics?: TeamMetrics,
): RebuilderTier | null {
  const base = REBUILDER_TIERS[status];
  if (base) return base;
  if (metrics?.ages.overall != null && metrics.ages.overall < 25.5) {
    return "development";
  }
  return null;
}

export function isContenderViewTeam(status: ContenderStatus): boolean {
  return contenderTier(status) != null;
}

export function isRebuilderViewTeam(
  status: ContenderStatus,
  metrics?: TeamMetrics,
): boolean {
  return rebuilderTier(status, metrics) != null;
}
