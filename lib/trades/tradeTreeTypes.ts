/**
 * Trade Tree types — mirror public.trade_log (0002_trade_log.sql) plus
 * graph/node shapes used by the React Flow canvas.
 */

export type TradeAssetType = "player" | "draft_pick";

/** One row per asset moved in a completed trade (Supabase trade_log). */
export interface TradeLogRow {
  id: string;
  league_id: string;
  season_year: number;
  week: number | null;
  transaction_id: string;
  trade_date: string;
  asset_type: TradeAssetType;
  asset_id: string;
  player_id: string | null;
  player_name: string | null;
  player_position: string | null;
  nfl_team: string | null;
  draft_season: number | null;
  draft_round: number | null;
  original_roster_id: number | null;
  from_roster_id: number;
  to_roster_id: number;
  created_at?: string;
}

export interface TradeTeamInfo {
  rosterId: number;
  teamName: string;
  managerName: string;
  avatar: string | null;
  accentColor: string;
}

export interface TradePlayerOption {
  playerId: string;
  fullName: string;
  position: string | null;
  nflTeam: string | null;
  imageUrl: string;
  ownerRosterId: number | null;
  ownerName: string | null;
}

export type TradeTreeNodeData = {
  assetId: string;
  assetType: TradeAssetType;
  label: string;
  playerName?: string;
  playerPosition?: string;
  nflTeam?: string;
  playerImageUrl?: string;
  draftSeason?: number;
  draftRound?: number;
  originalOwnerName?: string;
  ownerRosterId?: string;
  ownerName?: string;
  ownerAvatarUrl?: string;
  teamColor?: string;
  transactionId?: string;
  tradeDate?: string;
  hasChildren: boolean;
  isExpanded: boolean;
  isRoot?: boolean;
  isDimmed?: boolean;
  isSelected?: boolean;
};

/** Logical tree node before React Flow / dagre layout. */
export interface TradeTreeNode {
  id: string;
  parentId: string | null;
  data: TradeTreeNodeData;
  children: TradeTreeNode[];
}

export interface BuildTradeTreeResult {
  root: TradeTreeNode | null;
  /** Flat list of visible nodes (respecting expansion). */
  visibleNodes: TradeTreeNode[];
  /** True when the root player has no trades at/after the selected season. */
  noTrades: boolean;
  /**
   * Season rule: selected season sets the starting trade; later-season
   * trades remain reachable via expand.
   */
  seasonMode: "start_in_season_continue_forward";
}

export const ROOT_NODE_WIDTH = 280;
export const CHILD_NODE_WIDTH = 240;
export const ROOT_NODE_HEIGHT = 80;
export const CHILD_NODE_HEIGHT = 66;
