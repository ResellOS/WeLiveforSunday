"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Panel } from "@/components/ui/Panel";
import { TradeTreeTabs } from "@/components/trades/TradeTreeTabs";
import { TradeTreeToolbar } from "@/components/trades/TradeTreeToolbar";
import { TradeTreeLegend } from "@/components/trades/TradeTreeLegend";
import { TradeWebCanvas } from "@/components/trades/TradeWebCanvas";
import {
  buildTradeWeb,
  expandKey,
  expandKeysToRevealTrade,
} from "@/lib/trades/buildTradeWeb";
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
  initialTradeId?: string | null;
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
  initialTradeId = null,
  source,
  errorMessage,
}: TradeTreePageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [focusAssetId, setFocusAssetId] = useState<string | null>(null);
  const [focusTxnNodeId, setFocusTxnNodeId] = useState<string | null>(null);

  const tradeId =
    searchParams.get("tradeId")?.trim() || initialTradeId || null;
  const playerId =
    searchParams.get("player")?.trim() || initialPlayerId || null;
  const seasonParam = Number(searchParams.get("season"));
  const season = Number.isFinite(seasonParam) ? seasonParam : initialSeason;

  // Seed from the URL on first paint so History deep-links never briefly
  // overview-fit before the txn camera target applies.
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => {
    if (playerId && tradeId) {
      return expandKeysToRevealTrade(rows, playerId, season, tradeId);
    }
    return new Set();
  });
  /** Node id to center the camera on (`txn:…`). Null = fit the visible deals. */
  const [cameraTargetId, setCameraTargetId] = useState<string | null>(() => {
    if (playerId && tradeId) return `txn:${tradeId}`;
    return null;
  });

  // Keep expansion + camera in sync when the URL selection changes.
  // Do not depend on `rows` — that wiped user expands whenever the array identity changed.
  useEffect(() => {
    setFocusAssetId(null);
    setFocusTxnNodeId(null);

    if (playerId && tradeId) {
      const keys = expandKeysToRevealTrade(rows, playerId, season, tradeId);
      setExpandedKeys(keys);
      setCameraTargetId(`txn:${tradeId}`);
      return;
    }

    setExpandedKeys(new Set());
    setCameraTargetId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rows only used for initial reveal keys
  }, [playerId, season, tradeId]);

  const writeUrl = useCallback(
    (
      nextPlayer: string | null,
      nextSeason: number,
      nextTradeId?: string | null,
    ) => {
      const params = new URLSearchParams();
      if (nextPlayer) params.set("player", nextPlayer);
      params.set("season", String(nextSeason));
      if (nextTradeId) params.set("tradeId", nextTradeId);
      const qs = params.toString();
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [pathname, router],
  );

  const onSelectPlayer = useCallback(
    (id: string) => {
      // Manual search: deal overview only — never carry a history tradeId.
      writeUrl(id, season, null);
    },
    [writeUrl, season],
  );

  const onSelectSeason = useCallback(
    (yr: number) => writeUrl(playerId, yr, tradeId),
    [writeUrl, playerId, tradeId],
  );

  const web = useMemo(() => {
    if (!playerId) return null;
    return buildTradeWeb({
      rootAssetId: playerId,
      seasonYear: season,
      rows,
      teams,
      players,
      expandedKeys,
    });
  }, [playerId, season, rows, teams, players, expandedKeys]);

  // Selection-only — do not include expandedKeys or expand/collapse jumps the camera.
  const fitToken = `${playerId ?? "none"}:${season}:${tradeId ?? ""}:${cameraTargetId ?? ""}`;

  const onFocusChange = useCallback(
    (assetId: string | null, txnNodeId: string | null) => {
      setFocusAssetId(assetId);
      setFocusTxnNodeId(txnNodeId);
    },
    [],
  );

  const onToggleExpand = useCallback((transactionId: string, assetId: string) => {
    const key = expandKey(transactionId, assetId);
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const emptyNoPlayer = !playerId;
  const txnCount =
    web?.nodes.filter((n) => n.kind === "transaction").length ?? 0;
  const emptyNoTrades = Boolean(playerId && web?.noTrades);
  const showCanvas = Boolean(playerId && web && !web.noTrades && !errorMessage);

  return (
    <div className="tt-page">
      <Panel className="panel--banner tt-banner">
        <div className="tt-banner-inner">
          <div>
            <p className="tt-kicker">Trades</p>
            <h1 className="tt-title">Trade Tree</h1>
            <p className="tt-sub">
              Follow the journey. Every trade leaves a mark.
            </p>
          </div>
          <p className="tt-source" title="Trade data source">
            Source: {source === "supabase" ? "trade_log" : "Sleeper → trade_log"}
            {txnCount > 0 ? ` · ${txnCount} deal${txnCount === 1 ? "" : "s"} shown` : ""}
          </p>
        </div>
      </Panel>

      <div className="tt-controls-row">
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
        </Panel>
      </div>

      <Panel className="tt-stage-panel">
        {errorMessage ? (
          <div className="tt-state tt-state--error" role="alert">
            <p>{errorMessage}</p>
            <button
              type="button"
              className="tt-retry"
              onClick={() => router.refresh()}
            >
              Retry
            </button>
          </div>
        ) : null}

        {emptyNoPlayer && !errorMessage ? (
          <div className="tt-state" role="status">
            <p>
              {tradeId
                ? "TRADE NOT FOUND IN LOG"
                : "SELECT AN ASSET TO TRACE"}
            </p>
            <p className="tt-state-sub">
              {tradeId
                ? "That tradeId is missing or could not be resolved. Search a player instead."
                : "Search a league player or pick to open their trade lineage."}
            </p>
          </div>
        ) : null}

        {emptyNoTrades && !errorMessage ? (
          <div className="tt-state" role="status">
            <p>NO RECORDED TRADES IN THIS WINDOW</p>
            <p className="tt-state-sub">
              Starting season {season}. Try another season or a different asset.
            </p>
          </div>
        ) : null}

        {isPending && showCanvas ? (
          <div className="tt-loading-bar" aria-live="polite">
            Updating…
          </div>
        ) : null}

        {showCanvas && web ? (
          <TradeWebCanvas
            web={web}
            focusAssetId={focusAssetId}
            focusTxnNodeId={focusTxnNodeId}
            cameraTargetId={cameraTargetId}
            onFocusChange={onFocusChange}
            onToggleExpand={onToggleExpand}
            fitToken={fitToken}
          />
        ) : null}
      </Panel>

      <TradeTreeLegend />
    </div>
  );
}
