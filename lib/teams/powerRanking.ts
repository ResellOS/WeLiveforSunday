/**
 * WLFS Power Ranking — weighted composite with documented components.
 *
 * Components (each normalized 0–100 before weighting):
 *  - record:       win% and standing rank
 *  - pointsFor:    points scored per game
 *  - eliteAssets:  top dynasty values by position (KTC)
 *  - positional:   starter positional strength
 *  - momentum:     recent streak / form
 *
 * During preseason (no games played), roster components receive higher weight.
 */

import type { PlayerMap } from "@/types/sleeper";
import type { StandingRow } from "@/lib/league";

export interface PowerWeights {
  record: number;
  pointsFor: number;
  eliteAssets: number;
  positional: number;
  momentum: number;
}

export const REGULAR_WEIGHTS: PowerWeights = {
  record: 0.28,
  pointsFor: 0.18,
  eliteAssets: 0.22,
  positional: 0.17,
  momentum: 0.15,
};

export const PRESEASON_WEIGHTS: PowerWeights = {
  record: 0.05,
  pointsFor: 0.05,
  eliteAssets: 0.4,
  positional: 0.35,
  momentum: 0.15,
};

export interface PowerComponents {
  record: number;
  pointsFor: number;
  eliteAssets: number;
  positional: number;
  momentum: number;
}

export interface TeamPowerRanking {
  rosterId: number;
  rank: number;
  score: number;
  components: PowerComponents;
  /** Weekly movement: +1 up, -1 down, 0 flat (from streak). */
  delta: number;
  preseason: boolean;
  summary: string;
}

const POSITIONS = ["QB", "RB", "WR", "TE"] as const;
const ELITE_TOP_N = 5;

function clamp01(n: number): number {
  return Math.max(0, Math.min(100, n));
}

function ktcForPlayer(
  playerId: string,
  players: PlayerMap,
  ktc: Map<string, number>,
): number {
  const p = players[playerId];
  if (!p?.full_name) return 0;
  return ktc.get(p.full_name.toLowerCase()) ?? 0;
}

function eliteAssetScore(
  rosterIds: string[],
  players: PlayerMap,
  ktc: Map<string, number>,
): number {
  if (ktc.size === 0) return 0;
  let total = 0;
  for (const pos of POSITIONS) {
    const values = rosterIds
      .filter((id) => players[id]?.position === pos)
      .map((id) => ktcForPlayer(id, players, ktc))
      .filter((v) => v > 0)
      .sort((a, b) => b - a)
      .slice(0, ELITE_TOP_N);
    total += values.reduce((s, v) => s + v, 0);
  }
  return total;
}

function positionalStrength(
  starterIds: string[],
  players: PlayerMap,
  ktc: Map<string, number>,
): number {
  if (ktc.size === 0 || starterIds.length === 0) return 0;
  let sum = 0;
  let count = 0;
  for (const id of starterIds) {
    const v = ktcForPlayer(id, players, ktc);
    if (v > 0) {
      sum += v;
      count++;
    }
  }
  return count > 0 ? sum / count : 0;
}

function isPreseason(standings: StandingRow[]): boolean {
  return standings.every((t) => t.wins + t.losses + t.ties === 0);
}

function componentSummary(c: PowerComponents): string {
  const top = (
    Object.entries(c) as Array<[keyof PowerComponents, number]>
  ).sort((a, b) => b[1] - a[1])[0];
  const labels: Record<keyof PowerComponents, string> = {
    record: "Record",
    pointsFor: "Scoring",
    eliteAssets: "Dynasty Assets",
    positional: "Starters",
    momentum: "Momentum",
  };
  return `${labels[top[0]]} ${Math.round(top[1])}`;
}

export function computeTeamPowerRankings(
  standings: StandingRow[],
  players: PlayerMap,
  ktc: Map<string, number>,
  form3: Map<number, number>,
  weights: PowerWeights = REGULAR_WEIGHTS,
): TeamPowerRanking[] {
  const preseason = isPreseason(standings);
  const w = preseason ? PRESEASON_WEIGHTS : weights;
  const teamCount = Math.max(standings.length, 1);

  const raw = standings.map((t) => {
    const games = Math.max(1, t.wins + t.losses + t.ties);
    const ppg = t.pointsFor / games;
    const form = form3.get(t.rosterId) ?? 0;

    const recordRaw =
      t.pct * 60 + ((teamCount - t.rank + 1) / teamCount) * 40;
    const pfRaw = Math.min(100, ppg * 4);
    const eliteRaw = eliteAssetScore(t.players, players, ktc);
    const posRaw = positionalStrength(t.starters, players, ktc);
    const momRaw =
      (t.streak >= 0 ? 50 + t.streak * 12 : 50 + t.streak * 12) +
      form * 8;

    return { team: t, recordRaw, pfRaw, eliteRaw, posRaw, momRaw };
  });

  const maxElite = Math.max(1, ...raw.map((r) => r.eliteRaw));
  const maxPos = Math.max(1, ...raw.map((r) => r.posRaw));

  const scored = raw.map((r) => {
    const components: PowerComponents = {
      record: clamp01(r.recordRaw),
      pointsFor: clamp01(r.pfRaw),
      eliteAssets: clamp01((r.eliteRaw / maxElite) * 100),
      positional: clamp01((r.posRaw / maxPos) * 100),
      momentum: clamp01(r.momRaw),
    };

    const score =
      components.record * w.record +
      components.pointsFor * w.pointsFor +
      components.eliteAssets * w.eliteAssets +
      components.positional * w.positional +
      components.momentum * w.momentum;

    const delta = r.team.streak >= 2 ? 1 : r.team.streak <= -2 ? -1 : 0;

    return {
      rosterId: r.team.rosterId,
      score: Math.round(score * 10) / 10,
      components,
      delta,
      preseason,
      summary: componentSummary(components),
    };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .map((e, i) => ({ ...e, rank: i + 1 }));
}
