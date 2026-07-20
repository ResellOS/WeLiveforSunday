import type { Metadata } from "next";
import { TradeHistoryPage } from "@/components/trades/TradeHistoryPage";
import { loadTradeLogBundle } from "@/lib/trades/tradeLog";
import { buildTradeHistoryDeals } from "@/lib/trades/tradeHistory";
import { getKtcValueMap } from "@/lib/queries";

export const metadata: Metadata = { title: "Trade History" };
export const dynamic = "force-dynamic";

export default async function TradeHistoryRoute() {
  const leagueId = process.env.SLEEPER_LEAGUE_ID;

  if (!leagueId) {
    return (
      <TradeHistoryPage
        deals={[]}
        teams={{}}
        seasons={[new Date().getFullYear()]}
        source="sleeper"
        errorMessage="League is not configured. Set SLEEPER_LEAGUE_ID to load trades."
      />
    );
  }

  try {
    const [bundle, ktc] = await Promise.all([
      loadTradeLogBundle(leagueId),
      getKtcValueMap(),
    ]);
    const deals = buildTradeHistoryDeals(bundle.rows, bundle.teams, ktc);

    return (
      <TradeHistoryPage
        deals={deals}
        teams={bundle.teams}
        seasons={bundle.seasons}
        source={bundle.source}
      />
    );
  } catch (err) {
    console.error("[trades/history] failed to load:", err);
    return (
      <TradeHistoryPage
        deals={[]}
        teams={{}}
        seasons={[new Date().getFullYear()]}
        source="sleeper"
        errorMessage="Could not load trade history. Please retry."
      />
    );
  }
}
