"use client";

import { useMemo, useState } from "react";
import { Panel } from "@/components/ui/Panel";
import { TradeTreeTabs } from "@/components/trades/TradeTreeTabs";
import { TradeHistoryFilters } from "@/components/trades/TradeHistoryFilters";
import { TradeHistoryRow } from "@/components/trades/TradeHistoryRow";
import {
  filterTradeHistoryDeals,
  type TradeHistoryDeal,
  type TradeHistorySort,
} from "@/lib/trades/tradeHistory";
import type { TradeTeamInfo } from "@/lib/trades/tradeTreeTypes";

export interface TradeHistoryPageProps {
  deals: TradeHistoryDeal[];
  teams: Record<number, TradeTeamInfo>;
  seasons: number[];
  source: "supabase" | "sleeper";
  errorMessage?: string | null;
}

export function TradeHistoryPage({
  deals,
  teams,
  seasons,
  source,
  errorMessage,
}: TradeHistoryPageProps) {
  const [query, setQuery] = useState("");
  const [season, setSeason] = useState<number | "all">("all");
  const [rosterId, setRosterId] = useState<number | "all">("all");
  const [sort, setSort] = useState<TradeHistorySort>("newest");

  const teamList = useMemo(
    () =>
      Object.values(teams).sort((a, b) =>
        a.teamName.localeCompare(b.teamName),
      ),
    [teams],
  );

  const filtered = useMemo(
    () =>
      filterTradeHistoryDeals(deals, {
        season,
        rosterId,
        query,
        sort,
      }),
    [deals, season, rosterId, query, sort],
  );

  return (
    <div className="tt-page th-page">
      <Panel className="panel--banner tt-banner">
        <div className="tt-banner-inner">
          <div>
            <p className="tt-kicker">Trades</p>
            <h1 className="tt-title">Trade History</h1>
            <p className="tt-sub">
              Every completed deal in the league ledger — click a trade to open
              its tree.
            </p>
          </div>
          <p className="tt-source" title="Trade data source">
            Source: {source === "supabase" ? "trade_log" : "Sleeper → trade_log"}
          </p>
        </div>
      </Panel>

      <TradeTreeTabs />

      <Panel className="tt-controls-panel">
        <TradeHistoryFilters
          seasons={seasons}
          teams={teamList}
          season={season}
          rosterId={rosterId}
          query={query}
          sort={sort}
          onSeasonChange={setSeason}
          onRosterChange={setRosterId}
          onQueryChange={setQuery}
          onSortChange={setSort}
          resultCount={filtered.length}
        />
      </Panel>

      <Panel className="th-list-panel">
        {errorMessage ? (
          <div className="tt-state tt-state--error" role="alert">
            <p>{errorMessage}</p>
          </div>
        ) : null}

        {!errorMessage && deals.length === 0 ? (
          <div className="tt-state" role="status">
            <p>NO RECORDED TRADES</p>
            <p className="tt-state-sub">
              Completed league trades will appear here once logged.
            </p>
          </div>
        ) : null}

        {!errorMessage && deals.length > 0 && filtered.length === 0 ? (
          <div className="tt-state" role="status">
            <p>NO MATCHING TRADES</p>
            <p className="tt-state-sub">
              Try clearing the search or widening filters.
            </p>
          </div>
        ) : null}

        {!errorMessage && filtered.length > 0 ? (
          <ul className="th-list">
            {filtered.map((deal) => (
              <li key={deal.tradeId}>
                <TradeHistoryRow deal={deal} />
              </li>
            ))}
          </ul>
        ) : null}
      </Panel>
    </div>
  );
}
