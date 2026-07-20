/**
 * Chronological Trade Tree spine: root → trades (with side packages) → current owner.
 *
 * Perspective for each transaction: the team that SENT the traced asset
 * (from_roster_id). Left = assets they received; right = assets they sent.
 */

import {
  formatTradeDate,
  getSortedTradeGroups,
  roundLabel,
} from "@/lib/trades/tradeHelpers";
import { sleeperPlayerThumb } from "@/lib/sleeperMedia";
import { teamColorForRoster } from "@/lib/config/teamColors";
import type {
  TradeLogRow,
  TradePlayerOption,
  TradeTeamInfo,
} from "@/lib/trades/tradeTreeTypes";

export interface SpineAssetItem {
  assetId: string;
  assetType: "player" | "draft_pick";
  label: string;
  meta: string | null;
  imageUrl: string | null;
  pickBadge: string | null;
  accentColor: string;
  /** True when this row is the traced root asset. */
  isRootAsset: boolean;
}

export interface SpineTransaction {
  tradeIndex: number;
  transactionId: string;
  tradeDate: string;
  tradeDateLabel: string;
  fromRosterId: number;
  toRosterId: number;
  fromTeamName: string;
  toTeamName: string;
  /** Assets the sender received (left panel, −). */
  received: SpineAssetItem[];
  /** Assets the sender sent (right panel, +). */
  sent: SpineAssetItem[];
}

export interface SpineRoot {
  assetId: string;
  assetType: "player" | "draft_pick";
  label: string;
  meta: string | null;
  imageUrl: string | null;
  pickBadge: string | null;
  originLabel: string;
  originDetail: string | null;
}

export interface SpineCurrentOwner {
  rosterId: number;
  teamName: string;
  avatar: string | null;
  accentColor: string;
  sinceLabel: string;
}

export interface TradeSpine {
  root: SpineRoot | null;
  transactions: SpineTransaction[];
  currentOwner: SpineCurrentOwner | null;
  noTrades: boolean;
}

export interface BuildTradeSpineInput {
  rootAssetId: string;
  seasonYear: number;
  rows: TradeLogRow[];
  teams: Record<number, TradeTeamInfo>;
  players: TradePlayerOption[];
  /** Optional deep-link: start the chain at this transaction. */
  rootTransactionId?: string | null;
  liveOwnerByPlayerId?: ReadonlyMap<string, number>;
}

function teamName(
  teams: Record<number, TradeTeamInfo>,
  rosterId: number,
): string {
  return teams[rosterId]?.teamName ?? `Team ${rosterId}`;
}

function teamAccent(
  teams: Record<number, TradeTeamInfo>,
  rosterId: number,
): string {
  return teams[rosterId]?.accentColor ?? teamColorForRoster(rosterId);
}

/** Rows that represent the traced asset (player id, pick id, or resolved pick). */
export function rowsMatchingAsset(
  rows: TradeLogRow[],
  assetId: string,
): TradeLogRow[] {
  // Prefer direct asset_id / player_id moves for the spine; resolved-pick
  // aliases are only used when tracing a pick key or when no direct rows exist.
  const direct = rows.filter(
    (r) => r.asset_id === assetId || r.player_id === assetId,
  );
  if (direct.length > 0) return direct;
  return rows.filter((r) => r.resolved_player_id === assetId);
}

function assetDisplayLabel(row: TradeLogRow): string {
  if (row.asset_type === "draft_pick") {
    if (row.resolved_player_name) {
      const round = row.draft_round != null ? roundLabel(row.draft_round) : "Pick";
      const season = row.draft_season ?? "";
      return `${round} ${season} → ${row.resolved_player_name}`;
    }
    const round = row.draft_round != null ? roundLabel(row.draft_round) : "Pick";
    return `${round} ${row.draft_season ?? ""}`.trim();
  }
  return row.player_name ?? row.asset_id;
}

function assetMeta(row: TradeLogRow): string | null {
  if (row.asset_type === "draft_pick") {
    if (row.resolved_player_name) return "Resolved pick";
    return "Draft pick";
  }
  const parts = [row.player_position, row.nfl_team].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

function assetImage(row: TradeLogRow): string | null {
  if (row.asset_type === "player" && (row.player_id || row.asset_id)) {
    return sleeperPlayerThumb(row.player_id ?? row.asset_id);
  }
  if (row.resolved_player_id) {
    return sleeperPlayerThumb(row.resolved_player_id);
  }
  return null;
}

function pickBadge(row: TradeLogRow): string | null {
  if (row.asset_type !== "draft_pick") return null;
  if (row.resolved_player_id) return null;
  const round = row.draft_round != null ? roundLabel(row.draft_round) : "Pick";
  return `${round}\n${row.draft_season ?? ""}`.trim();
}

function toSpineAsset(
  row: TradeLogRow,
  teams: Record<number, TradeTeamInfo>,
  rootAssetId: string,
): SpineAssetItem {
  const isRoot =
    row.asset_id === rootAssetId ||
    row.player_id === rootAssetId ||
    row.resolved_player_id === rootAssetId;

  return {
    assetId: row.asset_id,
    assetType: row.asset_type,
    label: assetDisplayLabel(row),
    meta: assetMeta(row),
    imageUrl: assetImage(row),
    pickBadge: pickBadge(row),
    accentColor: teamAccent(teams, row.to_roster_id),
    isRootAsset: isRoot,
  };
}

function formatLongDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return formatTradeDate(iso);
  return d
    .toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    })
    .toUpperCase();
}

function buildRootCard(
  rootAssetId: string,
  assetMoves: TradeLogRow[],
  allMoves: TradeLogRow[],
  teams: Record<number, TradeTeamInfo>,
  players: TradePlayerOption[],
): SpineRoot {
  const catalog = players.find((p) => p.playerId === rootAssetId);
  const preferPlayer = !rootAssetId.startsWith("pick:");
  const sample =
    (preferPlayer
      ? assetMoves.find((r) => r.asset_type === "player") ??
        allMoves.find((r) => r.asset_type === "player")
      : null) ??
    assetMoves[0] ??
    allMoves[0] ??
    null;
  const isPick =
    rootAssetId.startsWith("pick:") ||
    (!preferPlayer && sample?.asset_type === "draft_pick");

  let label = catalog?.fullName ?? sample?.player_name ?? rootAssetId;
  let meta =
    catalog
      ? [catalog.position, catalog.nflTeam].filter(Boolean).join(" · ") || null
      : sample
        ? assetMeta(sample)
        : null;
  let imageUrl = catalog?.imageUrl ?? null;
  let pickBadgeText: string | null = null;
  let assetType: "player" | "draft_pick" = isPick ? "draft_pick" : "player";

  if (isPick && sample) {
    assetType = "draft_pick";
    label = assetDisplayLabel(sample);
    meta = assetMeta(sample);
    imageUrl = assetImage(sample);
    pickBadgeText = pickBadge(sample);
    if (sample.resolved_player_name) {
      label = sample.resolved_player_name;
      meta = [
        sample.player_position,
        sample.nfl_team,
        sample.draft_round != null
          ? `${roundLabel(sample.draft_round)} ${sample.draft_season ?? ""}`
          : null,
      ]
        .filter(Boolean)
        .join(" · ");
    }
  } else if (!imageUrl && rootAssetId && !rootAssetId.startsWith("pick:")) {
    imageUrl = sleeperPlayerThumb(rootAssetId);
  }

  // Origin: owner before the first move in the spine (sender of earliest trade).
  const first = assetMoves[0] ?? null;
  let originLabel = "Journey begins";
  let originDetail: string | null = null;

  if (first) {
    const originalTeam = teamName(teams, first.from_roster_id);
    if (assetType === "draft_pick" && first.draft_season && first.draft_round) {
      originLabel = `Drafted by ${originalTeam}`;
      originDetail = `${formatTradeDate(first.trade_date)} · ${roundLabel(first.draft_round)} ${first.draft_season}`;
    } else {
      originLabel = `Originally with ${originalTeam}`;
      originDetail = formatTradeDate(first.trade_date);
    }
  }

  return {
    assetId: rootAssetId,
    assetType,
    label,
    meta,
    imageUrl,
    pickBadge: pickBadgeText,
    originLabel,
    originDetail,
  };
}

export function buildTradeSpine(input: BuildTradeSpineInput): TradeSpine {
  const {
    rootAssetId,
    seasonYear,
    rows,
    teams,
    players,
    rootTransactionId,
    liveOwnerByPlayerId,
  } = input;

  const matched = rowsMatchingAsset(rows, rootAssetId);
  const seasonStart = `${seasonYear}-01-01T00:00:00.000Z`;

  let assetMoves = matched
    .filter(
      (r) => r.season_year >= seasonYear || r.trade_date >= seasonStart,
    )
    .sort((a, b) => {
      if (a.trade_date !== b.trade_date) {
        return a.trade_date.localeCompare(b.trade_date);
      }
      return a.transaction_id.localeCompare(b.transaction_id);
    });

  if (rootTransactionId) {
    const idx = assetMoves.findIndex(
      (r) => r.transaction_id === rootTransactionId,
    );
    if (idx >= 0) assetMoves = assetMoves.slice(idx);
    else {
      // Deep-link trade outside season window — still show from that deal forward.
      const deep = matched
        .filter((r) => r.transaction_id === rootTransactionId)
        .sort((a, b) => a.trade_date.localeCompare(b.trade_date));
      if (deep.length) {
        const startDate = deep[0].trade_date;
        assetMoves = matched
          .filter(
            (r) =>
              r.trade_date > startDate ||
              (r.trade_date === startDate &&
                r.transaction_id >= rootTransactionId),
          )
          .sort((a, b) => {
            if (a.trade_date !== b.trade_date) {
              return a.trade_date.localeCompare(b.trade_date);
            }
            return a.transaction_id.localeCompare(b.transaction_id);
          });
      }
    }
  }

  // Unique transactions in order (one move row per deal for the root asset).
  const seenTxn = new Set<string>();
  const orderedMoves: TradeLogRow[] = [];
  for (const row of assetMoves) {
    if (seenTxn.has(row.transaction_id)) continue;
    seenTxn.add(row.transaction_id);
    orderedMoves.push(row);
  }

  const root = buildRootCard(
    rootAssetId,
    orderedMoves,
    matched,
    teams,
    players,
  );

  if (orderedMoves.length === 0) {
    // No trades in window — still show root + live/current owner if known.
    const live = liveOwnerByPlayerId?.get(rootAssetId);
    const latest = matched.sort((a, b) =>
      b.trade_date.localeCompare(a.trade_date),
    )[0];
    const rosterId = live ?? latest?.to_roster_id ?? null;
    const currentOwner =
      rosterId != null
        ? {
            rosterId,
            teamName: teamName(teams, rosterId),
            avatar: teams[rosterId]?.avatar ?? null,
            accentColor: teamAccent(teams, rosterId),
            sinceLabel: latest
              ? `Since ${formatTradeDate(latest.trade_date)}`
              : "Current roster",
          }
        : null;

    return {
      root,
      transactions: [],
      currentOwner,
      noTrades: true,
    };
  }

  const byTxn = groupLookup(rows);
  const transactions: SpineTransaction[] = orderedMoves.map((move, i) => {
    const sender = move.from_roster_id;
    const dealRows = byTxn.get(move.transaction_id) ?? [move];
    const sent = dealRows
      .filter((r) => r.from_roster_id === sender)
      .map((r) => toSpineAsset(r, teams, rootAssetId));
    const received = dealRows
      .filter((r) => r.to_roster_id === sender)
      .map((r) => toSpineAsset(r, teams, rootAssetId));

    return {
      tradeIndex: i + 1,
      transactionId: move.transaction_id,
      tradeDate: move.trade_date,
      tradeDateLabel: formatLongDate(move.trade_date),
      fromRosterId: move.from_roster_id,
      toRosterId: move.to_roster_id,
      fromTeamName: teamName(teams, move.from_roster_id),
      toTeamName: teamName(teams, move.to_roster_id),
      received,
      sent,
    };
  });

  const last = orderedMoves[orderedMoves.length - 1];
  const live = liveOwnerByPlayerId?.get(rootAssetId);
  const ownerRosterId = live ?? last.to_roster_id;

  return {
    root,
    transactions,
    currentOwner: {
      rosterId: ownerRosterId,
      teamName: teamName(teams, ownerRosterId),
      avatar: teams[ownerRosterId]?.avatar ?? null,
      accentColor: teamAccent(teams, ownerRosterId),
      sinceLabel: `Since ${formatTradeDate(last.trade_date)}`,
    },
    noTrades: false,
  };
}

function groupLookup(rows: TradeLogRow[]): Map<string, TradeLogRow[]> {
  const map = new Map<string, TradeLogRow[]>();
  for (const group of getSortedTradeGroups(rows)) {
    map.set(group.transactionId, group.rows);
  }
  return map;
}
