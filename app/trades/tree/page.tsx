import type { Metadata } from "next";
import { Suspense } from "react";
import { TradeTreePage } from "@/components/trades/TradeTreePage";
import { loadTradeLogBundle } from "@/lib/trades/tradeLog";
import { FIRST_SEASON } from "@/lib/config";

export const metadata: Metadata = { title: "Trade Tree" };
export const dynamic = "force-dynamic";

function parseSeason(
  raw: string | string[] | undefined,
  seasons: number[],
): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const n = Number(value);
  if (Number.isFinite(n) && seasons.includes(n)) return n;
  return seasons[0] ?? new Date().getFullYear();
}

function parsePlayer(raw: string | string[] | undefined): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const id = value?.trim();
  return id ? id : null;
}

export default async function TradeTreeRoute({
  searchParams,
}: {
  searchParams?: { player?: string; season?: string };
}) {
  const leagueId = process.env.SLEEPER_LEAGUE_ID;

  if (!leagueId) {
    return (
      <Suspense fallback={<div className="tt-state">Loading trade tree…</div>}>
        <TradeTreePage
          rows={[]}
          teams={{}}
          players={[]}
          seasons={[FIRST_SEASON]}
          initialPlayerId={null}
          initialSeason={FIRST_SEASON}
          source="sleeper"
          errorMessage="League is not configured. Set SLEEPER_LEAGUE_ID to load trades."
        />
      </Suspense>
    );
  }

  try {
    const bundle = await loadTradeLogBundle(leagueId);
    const season = parseSeason(searchParams?.season, bundle.seasons);
    const playerId = parsePlayer(searchParams?.player);

    return (
      <Suspense fallback={<div className="tt-state">Loading trade tree…</div>}>
        <TradeTreePage
          rows={bundle.rows}
          teams={bundle.teams}
          players={bundle.players}
          seasons={bundle.seasons}
          initialPlayerId={playerId}
          initialSeason={season}
          source={bundle.source}
        />
      </Suspense>
    );
  } catch (err) {
    console.error("[trades/tree] failed to load trade log:", err);
    return (
      <Suspense fallback={<div className="tt-state">Loading trade tree…</div>}>
        <TradeTreePage
          rows={[]}
          teams={{}}
          players={[]}
          seasons={[new Date().getFullYear()]}
          initialPlayerId={parsePlayer(searchParams?.player)}
          initialSeason={
            Number(searchParams?.season) || new Date().getFullYear()
          }
          source="sleeper"
          errorMessage="Could not load trade history. Please retry."
        />
      </Suspense>
    );
  }
}
