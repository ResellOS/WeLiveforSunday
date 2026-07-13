/**
 * TypeScript types for the Sleeper public REST API (https://api.sleeper.app/v1).
 * Shapes are based on Sleeper's actual JSON responses. Many fields are loosely
 * typed (Record<string, ...>) because Sleeper's `settings`/`metadata` objects
 * vary by league configuration.
 */

/** Sleeper represents most IDs as strings (including numeric-looking ones). */
export type SleeperId = string;

/* -------------------------------------------------------------------------- */
/* League                                                                      */
/* -------------------------------------------------------------------------- */

export type LeagueStatus =
  | "pre_draft"
  | "drafting"
  | "in_season"
  | "complete";

export interface League {
  league_id: SleeperId;
  name: string;
  status: LeagueStatus;
  sport: string; // "nfl"
  season: string; // "2024"
  season_type: string; // "regular"
  total_rosters: number;
  /** ID of this league in the prior year (for dynasty history chains). */
  previous_league_id: SleeperId | null;
  draft_id: SleeperId | null;
  bracket_id: SleeperId | null;
  loser_bracket_id: SleeperId | null;
  group_id: SleeperId | null;
  avatar: string | null;
  roster_positions: string[];
  scoring_settings: Record<string, number>;
  settings: LeagueSettings;
  metadata: Record<string, string> | null;
}

export interface LeagueSettings {
  num_teams?: number;
  playoff_teams?: number;
  playoff_week_start?: number;
  start_week?: number;
  last_scored_leg?: number;
  leg?: number;
  draft_rounds?: number;
  waiver_type?: number;
  waiver_budget?: number;
  taxi_slots?: number;
  reserve_slots?: number;
  [key: string]: number | undefined;
}

/* -------------------------------------------------------------------------- */
/* Roster                                                                      */
/* -------------------------------------------------------------------------- */

export interface RosterSettings {
  wins: number;
  losses: number;
  ties: number;
  /** Fantasy points scored (integer part). */
  fpts: number;
  fpts_decimal?: number;
  fpts_against?: number;
  fpts_against_decimal?: number;
  total_moves?: number;
  waiver_position?: number;
  waiver_budget_used?: number;
  [key: string]: number | undefined;
}

export interface Roster {
  roster_id: number;
  league_id: SleeperId;
  /** User ID of the roster owner (null if orphaned). */
  owner_id: SleeperId | null;
  co_owners: SleeperId[] | null;
  /** Player IDs currently on the roster. */
  players: SleeperId[] | null;
  /** Player IDs in the starting lineup (order matches roster_positions). */
  starters: SleeperId[] | null;
  /** Player IDs on IR/reserve. */
  reserve: SleeperId[] | null;
  /** Player IDs on the taxi squad. */
  taxi: SleeperId[] | null;
  keepers: SleeperId[] | null;
  settings: RosterSettings;
  metadata: Record<string, string> | null;
}

/* -------------------------------------------------------------------------- */
/* User                                                                        */
/* -------------------------------------------------------------------------- */

export interface User {
  user_id: SleeperId;
  league_id?: SleeperId;
  display_name: string;
  avatar: string | null;
  is_owner?: boolean | null;
  is_bot?: boolean;
  settings: Record<string, unknown> | null;
  metadata: UserMetadata | null;
}

export interface UserMetadata {
  team_name?: string;
  avatar?: string;
  mention_pn?: string;
  allow_pn?: string;
  [key: string]: string | undefined;
}

/* -------------------------------------------------------------------------- */
/* Matchup                                                                     */
/* -------------------------------------------------------------------------- */

export interface Matchup {
  roster_id: number;
  /** Teams sharing a matchup_id played each other that week. */
  matchup_id: number | null;
  points: number;
  custom_points: number | null;
  starters: SleeperId[];
  /** Points scored by each starter, aligned with `starters`. */
  starters_points: number[];
  players: SleeperId[];
  /** Map of player_id -> points scored that week. */
  players_points: Record<SleeperId, number>;
}

/* -------------------------------------------------------------------------- */
/* Transaction                                                                 */
/* -------------------------------------------------------------------------- */

export type TransactionType = "trade" | "free_agent" | "waiver" | "commissioner";

export type TransactionStatus = "complete" | "failed" | "processing";

export interface TransactionDraftPick {
  season: string;
  round: number;
  /** Roster the pick originally belonged to. */
  roster_id: number;
  /** Roster giving up the pick. */
  previous_owner_id: number;
  /** Roster receiving the pick. */
  owner_id: number;
}

export interface WaiverBudgetTransfer {
  sender: number; // roster_id
  receiver: number; // roster_id
  amount: number;
}

export interface Transaction {
  transaction_id: SleeperId;
  type: TransactionType;
  status: TransactionStatus;
  /** Roster IDs involved in the transaction. */
  roster_ids: number[];
  /** Map of player_id -> roster_id receiving the player. */
  adds: Record<SleeperId, number> | null;
  /** Map of player_id -> roster_id dropping the player. */
  drops: Record<SleeperId, number> | null;
  draft_picks: TransactionDraftPick[];
  waiver_budget: WaiverBudgetTransfer[];
  /** User ID that created the transaction. */
  creator: SleeperId;
  created: number; // epoch ms
  status_updated: number; // epoch ms
  /** Week/round the transaction was processed in. */
  leg: number;
  consenter_ids: number[] | null;
  settings: { waiver_bid?: number; seq?: number } | null;
  metadata: Record<string, string> | null;
}

/* -------------------------------------------------------------------------- */
/* Playoff bracket                                                             */
/* -------------------------------------------------------------------------- */

/** A "from" reference points at the winner (w) or loser (l) of a prior match. */
export interface BracketFrom {
  w?: number;
  l?: number;
}

export interface BracketMatchup {
  /** Round number (1-indexed). */
  r: number;
  /** Match ID within the bracket. */
  m: number;
  /** Roster ID of team 1 (null until determined). */
  t1: number | null;
  /** Roster ID of team 2 (null until determined). */
  t2: number | null;
  /** Roster ID of the winner (null until played). */
  w: number | null;
  /** Roster ID of the loser (null until played). */
  l: number | null;
  /** Where team 1 comes from (prior match), if not a seed. */
  t1_from?: BracketFrom;
  /** Where team 2 comes from (prior match), if not a seed. */
  t2_from?: BracketFrom;
  /** Placement this match decides (e.g. 1 = championship, 3 = 3rd place). */
  p?: number;
}

export type PlayoffBracket = BracketMatchup[];

/* -------------------------------------------------------------------------- */
/* Draft                                                                       */
/* -------------------------------------------------------------------------- */

export type DraftType = "snake" | "auction" | "linear";

export interface Draft {
  draft_id: SleeperId;
  league_id: SleeperId;
  type: DraftType;
  status: string; // "complete" | "drafting" | "pre_draft" | ...
  sport: string;
  season: string;
  season_type: string;
  start_time: number | null; // epoch ms
  settings: Record<string, number>;
  metadata: Record<string, string> | null;
  /** Map of user_id -> draft slot (1-indexed). */
  draft_order: Record<SleeperId, number> | null;
  /** Map of draft slot -> roster_id. */
  slot_to_roster_id: Record<string, number> | null;
  creators: SleeperId[] | null;
  created: number; // epoch ms
}

export interface DraftPick {
  draft_id: SleeperId;
  player_id: SleeperId;
  /** User ID that made the pick. */
  picked_by: SleeperId;
  /** Roster the pick belongs to. */
  roster_id: SleeperId;
  round: number;
  /** Column in the draft board (1-indexed). */
  draft_slot: number;
  /** Absolute pick number (1-indexed). */
  pick_no: number;
  is_keeper: boolean | null;
  metadata: DraftPickMetadata | null;
}

export interface DraftPickMetadata {
  first_name?: string;
  last_name?: string;
  position?: string;
  team?: string;
  status?: string;
  injury_status?: string;
  years_exp?: string;
  number?: string;
  amount?: string; // auction cost
  [key: string]: string | undefined;
}

/* -------------------------------------------------------------------------- */
/* Traded picks                                                                */
/* -------------------------------------------------------------------------- */

export interface TradedPick {
  season: string;
  round: number;
  /** Roster the pick originally belonged to. */
  roster_id: number;
  /** Roster that previously owned the pick before the most recent trade. */
  previous_owner_id: number;
  /** Roster that currently owns the pick. */
  owner_id: number;
}

/* -------------------------------------------------------------------------- */
/* Player                                                                      */
/* -------------------------------------------------------------------------- */

export interface Player {
  player_id: SleeperId;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  position: string | null;
  team: string | null;
  age: number | null;
  years_exp: number | null;
  number: number | null;
  status: string | null;
  injury_status: string | null;
  fantasy_positions: string[] | null;
}

/** Map of player_id -> Player, as returned by GET /players/nfl. */
export type PlayerMap = Record<SleeperId, Player>;

/* -------------------------------------------------------------------------- */
/* NFL state                                                                   */
/* -------------------------------------------------------------------------- */

export interface NFLState {
  /** The active/most recent week (may be a completed week in the offseason). */
  week: number;
  /** Week to display in the UI (accounts for pre-week rollover). */
  display_week: number;
  /** "regular" | "post" | "pre" | "off". */
  season_type: string;
  season: string;
  previous_season: string;
  season_start_date: string; // "YYYY-MM-DD"
  leg: number;
}
