/**
 * Supabase read helpers (server-side).
 *
 * All functions degrade gracefully: if Supabase isn't configured yet (no env
 * vars) or the tables are empty/missing, they return empty arrays / null
 * instead of throwing, so pages render with empty states.
 *
 * Reads use the anon client and rely on the public SELECT RLS policies.
 */

import { supabase, isSupabaseConfigured } from "@/lib/supabase";

/* Row types (mirror supabase/migrations/0001_initial_schema.sql) */

export interface SeasonRow {
  id: string;
  year: number;
  champion_roster_id: number | null;
  runner_up_roster_id: number | null;
  championship_score_winner: number | null;
  championship_score_loser: number | null;
  final_standings: unknown | null;
  created_at: string;
}

export type MomentCategory =
  | "championship"
  | "comeback"
  | "blowout"
  | "record"
  | "trade";

export interface NotableMomentRow {
  id: string;
  season_year: number | null;
  week: number | null;
  title: string;
  description: string | null;
  category: MomentCategory | null;
  stat_highlight: string | null;
  roster_id: number | null;
  created_at: string;
}

export interface MilestoneRow {
  id: string;
  date: string | null;
  title: string;
  description: string | null;
  created_at: string;
}

export interface JerseyRow {
  id: string;
  season_year: number | null;
  player_name: string | null;
  jersey_number: number | null;
  nfl_team: string | null;
  image_url: string | null;
}

export interface RetiredMemberRow {
  id: string;
  manager_name: string;
  years_active_start: number | null;
  years_active_end: number | null;
  championships_won: number;
  legacy_note: string | null;
}

export interface KtcValueRow {
  id: string;
  player_name: string;
  value: number;
  last_updated: string;
}

export interface ManagerMetadataRow {
  id: string;
  roster_id: number;
  years_active_start: number | null;
  display_name: string | null;
}

/** Wrap a Supabase read so any failure (missing env, table, network) yields a fallback. */
async function safe<T>(fallback: T, fn: () => Promise<T>): Promise<T> {
  if (!isSupabaseConfigured()) return fallback;
  try {
    return await fn();
  } catch (err) {
    console.warn("[supabase] read failed:", (err as Error).message);
    return fallback;
  }
}

export function getSeasons(): Promise<SeasonRow[]> {
  return safe<SeasonRow[]>([], async () => {
    const { data, error } = await supabase
      .from("seasons")
      .select("*")
      .order("year", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });
}

export async function getLatestSeason(): Promise<SeasonRow | null> {
  const seasons = await getSeasons();
  return seasons[0] ?? null;
}

export function getNotableMoments(
  category?: MomentCategory,
): Promise<NotableMomentRow[]> {
  return safe<NotableMomentRow[]>([], async () => {
    let q = supabase
      .from("notable_moments")
      .select("*")
      .order("created_at", { ascending: false });
    if (category) q = q.eq("category", category);
    const { data, error } = await q;
    if (error) throw error;
    return data ?? [];
  });
}

export function getMilestones(): Promise<MilestoneRow[]> {
  return safe<MilestoneRow[]>([], async () => {
    const { data, error } = await supabase
      .from("league_milestones")
      .select("*")
      .order("date", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });
}

export function getJerseys(): Promise<JerseyRow[]> {
  return safe<JerseyRow[]>([], async () => {
    const { data, error } = await supabase
      .from("championship_jerseys")
      .select("*")
      .order("season_year", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });
}

export function getRetiredMembers(): Promise<RetiredMemberRow[]> {
  return safe<RetiredMemberRow[]>([], async () => {
    const { data, error } = await supabase.from("retired_members").select("*");
    if (error) throw error;
    return data ?? [];
  });
}

export function getKtcValues(): Promise<KtcValueRow[]> {
  return safe<KtcValueRow[]>([], async () => {
    const { data, error } = await supabase.from("ktc_values").select("*");
    if (error) throw error;
    return data ?? [];
  });
}

/** KTC values as a case-insensitive name -> value map for joining Sleeper players. */
export async function getKtcValueMap(): Promise<Map<string, number>> {
  const rows = await getKtcValues();
  const map = new Map<string, number>();
  for (const r of rows) map.set(r.player_name.toLowerCase(), r.value);
  return map;
}

export function getManagerMetadata(): Promise<ManagerMetadataRow[]> {
  return safe<ManagerMetadataRow[]>([], async () => {
    const { data, error } = await supabase.from("manager_metadata").select("*");
    if (error) throw error;
    return data ?? [];
  });
}
