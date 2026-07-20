import type { Metadata } from "next";
import { Suspense } from "react";
import { TradeTreePage } from "@/components/trades/TradeTreePage";
import { loadTradeLogBundle } from "@/lib/trades/tradeLog";
import { resolveTradeDeepLink } from "@/lib/trades/tradeHistory";
import { getKtcValueMap } from "@/lib/queries";
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

function parseTradeId(raw: string | string[] | undefined): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const id = value?.trim();
  return id ? id : null;
}

export default async function TradeTreeRoute({
  searchParams,
}: {
  searchParams?: { player?: string; season?: string; tradeId?: string };
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
          initialTradeId={null}
          source="sleeper"
          errorMessage="League is not configured. Set SLEEPER_LEAGUE_ID to load trades."
        />
      </Suspense>
    );
  }

  try {
    const [bundle, ktc] = await Promise.all([
      loadTradeLogBundle(leagueId),
      getKtcValueMap(),
    ]);

    const tradeId = parseTradeId(searchParams?.tradeId);
    const deepLink = tradeId
      ? resolveTradeDeepLink(bundle.rows, tradeId, ktc)
      : null;

    const playerId =
      parsePlayer(searchParams?.player) ?? deepLink?.primaryAssetId ?? null;
    const season = deepLink
      ? deepLink.seasonYear
      : parseSeason(searchParams?.season, bundle.seasons);

    return (
      <Suspense fallback={<div className="tt-state">Loading trade tree…</div>}>
        <TradeTreePage
          rows={bundle.rows}
          teams={bundle.teams}
          players={bundle.players}
          seasons={bundle.seasons}
          initialPlayerId={playerId}
          initialSeason={season}
          initialTradeId={tradeId}
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
          initialTradeId={parseTradeId(searchParams?.tradeId)}
          source="sleeper"
          errorMessage="Could not load trade history. Please retry."
        />
      </Suspense>
    );
  }
}
