/**
 * Shared trade_log / Trade Tree types.
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
  resolved_player_id?: string | null;
  resolved_player_name?: string | null;
  resolved_at?: string | null;
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
