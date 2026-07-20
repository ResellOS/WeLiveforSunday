"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Panel } from "@/components/ui/Panel";
import { TradeTreeTabs } from "@/components/trades/TradeTreeTabs";
import { TradeTreeToolbar } from "@/components/trades/TradeTreeToolbar";
import { TradeTreeLegend } from "@/components/trades/TradeTreeLegend";
import { TradeTreeCanvas } from "@/components/trades/TradeTreeCanvas";
import { buildTradeTree } from "@/lib/trades/buildTradeTree";
import type {
  TradeLogRow,
  TradePlayerOption,
  TradeTeamInfo,
} from "@/lib/trades/tradeTreeTypes";

export interface TradeTreePageProps {
  rows: TradeLogRow[];
  teams: Record<number, TradeTeamInfo>;
  players: TradePlayerOption[];
  seasons: number[];
  initialPlayerId: string | null;
  initialSeason: number;
  source: "supabase" | "sleeper";
  errorMessage?: string | null;
}

export function TradeTreePage({
  rows,
  teams,
  players,
  seasons,
  initialPlayerId,
  initialSeason,
  source,
  errorMessage,
}: TradeTreePageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const playerId =
    searchParams.get("player")?.trim() || initialPlayerId || null;
  const seasonParam = Number(searchParams.get("season"));
  const season = Number.isFinite(seasonParam)
    ? seasonParam
    : initialSeason;

  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [fitToken, setFitToken] = useState(
    () => `${playerId ?? "none"}:${season}`,
  );
  const [retryKey, setRetryKey] = useState(0);

  // Reset expansion/selection when root player or season changes.
  useEffect(() => {
    setExpandedNodeIds(new Set());
    setSelectedNodeId(null);
    setFitToken(`${playerId ?? "none"}:${season}:${retryKey}`);
  }, [playerId, season, retryKey]);

  const writeUrl = useCallback(
    (nextPlayer: string | null, nextSeason: number) => {
      const params = new URLSearchParams();
      if (nextPlayer) params.set("player", nextPlayer);
      params.set("season", String(nextSeason));
      const qs = params.toString();
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [pathname, router],
  );

  const onSelectPlayer = useCallback(
    (id: string) => writeUrl(id, season),
    [writeUrl, season],
  );

  const onSelectSeason = useCallback(
    (yr: number) => writeUrl(playerId, yr),
    [writeUrl, playerId],
  );

  const tree = useMemo(() => {
    if (!playerId) {
      return {
        root: null,
        visibleNodes: [],
        noTrades: false,
        seasonMode: "start_in_season_continue_forward" as const,
      };
    }
    return buildTradeTree({
      rootAssetId: playerId,
      seasonYear: season,
      rows,
      expandedNodeIds,
      teams,
    });
  }, [playerId, season, rows, expandedNodeIds, teams]);

  // Refit when visible topology changes from expand/collapse (not selection).
  useEffect(() => {
    if (!playerId || !tree.root) return;
    setFitToken(
      `${playerId}:${season}:exp:${[...expandedNodeIds].sort().join(",")}`,
    );
  }, [expandedNodeIds, playerId, season, tree.root]);

  const onToggleExpand = useCallback((nodeId: string) => {
    setExpandedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }, []);

  const emptyNoPlayer = !playerId;
  const emptyNoTrades = Boolean(playerId && tree.noTrades);
  const showCanvas = Boolean(playerId && tree.root && !errorMessage);

  return (
    <div className="tt-page">
      <Panel className="panel--banner tt-banner">
        <div className="tt-banner-inner">
          <div>
            <p className="tt-kicker">Trades</p>
            <h1 className="tt-title">Trade Tree</h1>
            <p className="tt-sub">
              Trace an asset&apos;s lineage through every deal that followed.
            </p>
          </div>
          <p className="tt-source" title="Trade data source">
            Source: {source === "supabase" ? "trade_log" : "Sleeper → trade_log"}
          </p>
        </div>
      </Panel>

      <TradeTreeTabs />

      <Panel className="tt-controls-panel">
        <TradeTreeToolbar
          players={players}
          seasons={seasons}
          selectedPlayerId={playerId}
          selectedSeason={season}
          onSelectPlayer={onSelectPlayer}
          onSelectSeason={onSelectSeason}
          disabled={Boolean(errorMessage)}
        />
        <TradeTreeLegend />
      </Panel>

      <Panel className="tt-stage-panel">
        {errorMessage ? (
          <div className="tt-state tt-state--error" role="alert">
            <p>{errorMessage}</p>
            <button
              type="button"
              className="tt-retry"
              onClick={() => {
                setRetryKey((k) => k + 1);
                router.refresh();
              }}
            >
              Retry
            </button>
          </div>
        ) : null}

        {emptyNoPlayer && !errorMessage ? (
          <div className="tt-state" role="status">
            <p>SELECT A PLAYER TO TRACE THEIR TRADE HISTORY</p>
            <p className="tt-state-sub">
              Search a league player to open their trade genealogy.
            </p>
          </div>
        ) : null}

        {emptyNoTrades && !errorMessage ? (
          <div className="tt-state" role="status">
            <p>NO RECORDED TRADES FOR THIS PLAYER</p>
            <p className="tt-state-sub">
              Starting season {season}. Earlier deals are outside this window.
            </p>
          </div>
        ) : null}

        {isPending && showCanvas ? (
          <div className="tt-loading-bar" aria-live="polite">
            Updating…
          </div>
        ) : null}

        {showCanvas ? (
          <TradeTreeCanvas
            root={tree.root}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
            onToggleExpand={onToggleExpand}
            fitToken={fitToken}
          />
        ) : null}
      </Panel>
    </div>
  );
}
