/**
 * Year-end trade aging persistence.
 *
 * Value rules live in pickValue.ts:
 * - value_at_trade — tug-of-war basis (pick estimate / player KTC; never resolved)
 * - value_at_aging — resolved picks use current player KTC when available
 */

import { getKtcValueMap } from "@/lib/queries";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { loadTradeLogBundle } from "@/lib/trades/tradeLog";
import {
  valueAtAging,
  valueAtTrade,
  type AgingValueSource,
} from "@/lib/trades/pickValue";
import type { TradeLogRow } from "@/lib/trades/tradeTreeTypes";

export type { AgingValueSource };
export { valueAtAging, valueAtTrade };

export interface TradeAgingRow {
  league_id: string;
  aging_year: number;
  trade_log_id: string;
  transaction_id: string;
  asset_id: string;
  asset_type: "player" | "draft_pick";
  trade_date: string;
  value_at_trade: number;
  value_at_aging: number;
  value_source: AgingValueSource;
  resolved_player_id: string | null;
  resolved_player_name: string | null;
  delta: number;
}

export function buildTradeAgingRows(
  rows: TradeLogRow[],
  leagueId: string,
  agingYear: number,
  ktc: Map<string, number>,
): TradeAgingRow[] {
  return rows.map((row) => {
    const atTrade = valueAtTrade(row, ktc, agingYear);
    const aged = valueAtAging(row, ktc, agingYear);
    return {
      league_id: leagueId,
      aging_year: agingYear,
      trade_log_id: row.id,
      transaction_id: row.transaction_id,
      asset_id: row.asset_id,
      asset_type: row.asset_type,
      trade_date: row.trade_date,
      value_at_trade: atTrade,
      value_at_aging: aged.value,
      value_source: aged.source,
      resolved_player_id: row.resolved_player_id ?? null,
      resolved_player_name: row.resolved_player_name ?? null,
      delta: aged.value - atTrade,
    };
  });
}

export interface RunTradeAgingResult {
  agingYear: number;
  rowsWritten: number;
  notes: string[];
}

/** Compute and upsert trade_aging snapshots for the league. */
export async function runTradeAging(
  leagueId: string,
  agingYear: number = new Date().getFullYear(),
): Promise<RunTradeAgingResult> {
  const notes: string[] = [];
  const [bundle, ktc] = await Promise.all([
    loadTradeLogBundle(leagueId),
    getKtcValueMap(),
  ]);

  const snapshots = buildTradeAgingRows(
    bundle.rows,
    leagueId,
    agingYear,
    ktc,
  );
  notes.push(`computed ${snapshots.length} aging rows for ${agingYear}`);

  if (!snapshots.length) {
    return { agingYear, rowsWritten: 0, notes };
  }

  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    notes.push("supabase admin unavailable — aging computed but not persisted");
    return { agingYear, rowsWritten: 0, notes };
  }

  try {
    const admin = getSupabaseAdmin();
    let written = 0;
    const chunkSize = 150;
    for (let i = 0; i < snapshots.length; i += chunkSize) {
      const chunk = snapshots.slice(i, i + chunkSize);
      const { error } = await admin.from("trade_aging").upsert(chunk, {
        onConflict: "league_id,aging_year,transaction_id,asset_id",
      });
      if (error) {
        notes.push(`upsert failed: ${error.message}`);
        return { agingYear, rowsWritten: written, notes };
      }
      written += chunk.length;
    }
    notes.push(`persisted ${written} rows`);
    return { agingYear, rowsWritten: written, notes };
  } catch (err) {
    notes.push(
      `persist unavailable: ${err instanceof Error ? err.message : String(err)}`,
    );
    return { agingYear, rowsWritten: 0, notes };
  }
}
