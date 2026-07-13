/**
 * update-ktc-values.ts
 *
 * Fetches current KeepTradeCut (KTC) dynasty player values and upserts them
 * into the Supabase `ktc_values` table (player_name, value, last_updated).
 *
 * KTC has NO official/public API. The community-standard approach (and what
 * this script uses) is that the dynasty-rankings page embeds the full ranking
 * as an inline `var playersArray = [ ... ]` JavaScript array in the HTML. We
 * fetch that page, extract the array, and parse it. If KTC changes their page
 * structure, adjust PLAYERS_ARRAY_RE below.
 *
 * Usage:
 *   npm run update-ktc              # fetch + upsert into Supabase
 *   npm run update-ktc -- --dry-run # fetch + parse + print, no DB writes
 *   npm run update-ktc -- --1qb     # use 1QB values instead of Superflex
 *
 * Env (from .env.local): NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";

loadEnv({ path: ".env.local" });

const KTC_URL = "https://keeptradecut.com/dynasty-rankings";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36";

// Matches `var playersArray = [ ... ];` (the array is on one line in the HTML).
const PLAYERS_ARRAY_RE = /var\s+playersArray\s*=\s*(\[[\s\S]*?\]);/;

const DRY_RUN = process.argv.includes("--dry-run");
const USE_1QB = process.argv.includes("--1qb");
const UPSERT_CHUNK = 500;

interface KtcValueBlock {
  value?: number;
}

interface KtcPlayer {
  playerName?: string;
  position?: string;
  team?: string;
  oneQBValues?: KtcValueBlock;
  superflexValues?: KtcValueBlock;
}

interface ParsedValue {
  player_name: string;
  value: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Fetch a URL with retry + exponential backoff, honoring 429 Retry-After. */
async function fetchWithRetry(url: string, maxAttempts = 4): Promise<string> {
  let attempt = 0;
  let delay = 1000;
  while (true) {
    attempt++;
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
    });

    if (res.ok) return res.text();

    const retryable = res.status === 429 || res.status >= 500;
    if (!retryable || attempt >= maxAttempts) {
      throw new Error(`KTC request failed: ${res.status} ${res.statusText}`);
    }

    const retryAfter = Number(res.headers.get("retry-after"));
    const wait = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : delay;
    console.warn(
      `  ↳ ${res.status} from KTC, retry ${attempt}/${maxAttempts - 1} in ${wait}ms`,
    );
    await sleep(wait);
    delay *= 2;
  }
}

function parsePlayers(html: string): ParsedValue[] {
  const match = html.match(PLAYERS_ARRAY_RE);
  if (!match) {
    throw new Error(
      "Could not find `playersArray` in KTC HTML — page structure may have changed.",
    );
  }

  const raw: KtcPlayer[] = JSON.parse(match[1]);
  const out: ParsedValue[] = [];

  for (const p of raw) {
    if (!p.playerName) continue;
    const block = USE_1QB ? p.oneQBValues : p.superflexValues;
    const value = block?.value;
    if (typeof value !== "number") continue;
    out.push({ player_name: p.playerName.trim(), value });
  }

  // De-dupe by name, keeping the highest value seen (guards against odd dupes).
  const byName = new Map<string, number>();
  for (const { player_name, value } of out) {
    byName.set(player_name, Math.max(byName.get(player_name) ?? 0, value));
  }
  return Array.from(byName, ([player_name, value]) => ({ player_name, value }));
}

async function main() {
  const format = USE_1QB ? "1QB" : "Superflex";
  console.log(`[KTC] Fetching dynasty rankings (${format})…`);

  const html = await fetchWithRetry(KTC_URL);
  console.log(`[KTC] Received ${html.length.toLocaleString()} bytes of HTML.`);

  const players = parsePlayers(html);
  console.log(`[KTC] Parsed ${players.length} player values.`);
  const sample = players.slice(0, 5).map((p) => `${p.player_name} (${p.value})`);
  console.log(`[KTC] Sample: ${sample.join(", ")}`);

  if (DRY_RUN) {
    console.log("[KTC] --dry-run set; skipping Supabase upsert.");
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.",
    );
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const now = new Date().toISOString();
  const rows = players.map((p) => ({ ...p, last_updated: now }));

  let upserted = 0;
  for (let i = 0; i < rows.length; i += UPSERT_CHUNK) {
    const chunk = rows.slice(i, i + UPSERT_CHUNK);
    const { error } = await supabase
      .from("ktc_values")
      .upsert(chunk, { onConflict: "player_name" });
    if (error) throw new Error(`Supabase upsert failed: ${error.message}`);
    upserted += chunk.length;
    console.log(`[KTC] Upserted ${upserted}/${rows.length}…`);
  }

  console.log(`[KTC] Done. ${upserted} player values updated at ${now}.`);
}

main().catch((err) => {
  console.error(`[KTC] ERROR: ${(err as Error).message}`);
  process.exit(1);
});
