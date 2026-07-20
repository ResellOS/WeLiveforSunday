"use client";

import Image from "next/image";
import Link from "next/link";
import { TradeTugBar } from "@/components/trades/TradeTugBar";
import { formatTradeDate } from "@/lib/trades/tradeHelpers";
import type {
  TradeHistoryAsset,
  TradeHistoryDeal,
  TradeHistorySide,
} from "@/lib/trades/tradeHistory";

function AssetChip({ asset }: { asset: TradeHistoryAsset }) {
  return (
    <span className="th-asset">
      {asset.assetType === "player" && asset.playerImageUrl ? (
        <Image
          src={asset.playerImageUrl}
          alt=""
          width={22}
          height={22}
          className="th-asset-thumb"
          unoptimized
        />
      ) : (
        <span className="th-asset-pick" aria-hidden="true">
          PK
        </span>
      )}
      <span className="th-asset-label">{asset.label}</span>
    </span>
  );
}

function SideBlock({
  side,
  align,
}: {
  side: TradeHistorySide;
  align: "left" | "right";
}) {
  return (
    <div className={["th-side", align === "right" && "th-side--right"].filter(Boolean).join(" ")}>
      <div className="th-side-head">
        {side.avatar ? (
          <Image
            src={side.avatar}
            alt=""
            width={36}
            height={36}
            className="th-side-avatar"
            style={{ boxShadow: `0 0 0 2px ${side.accentColor}` }}
            unoptimized
          />
        ) : (
          <span
            className="th-side-avatar th-side-avatar--fallback"
            style={{
              background: side.accentColor,
              boxShadow: `0 0 0 2px ${side.accentColor}`,
            }}
            aria-hidden="true"
          />
        )}
        <div className="th-side-names">
          <span className="th-side-team">{side.teamName}</span>
          <span className="th-side-gave">Gave</span>
        </div>
      </div>
      <div className="th-assets">
        {side.assetsGiven.length === 0 ? (
          <span className="th-asset th-asset--empty">—</span>
        ) : (
          side.assetsGiven.map((a) => <AssetChip key={a.assetId} asset={a} />)
        )}
      </div>
    </div>
  );
}

interface TradeHistoryRowProps {
  deal: TradeHistoryDeal;
}

export function TradeHistoryRow({ deal }: TradeHistoryRowProps) {
  const href = `/trades/tree?tradeId=${encodeURIComponent(deal.tradeId)}&player=${encodeURIComponent(deal.primaryAssetId)}&season=${deal.seasonYear}`;

  return (
    <Link
      href={href}
      className="th-row"
      aria-label={`Open trade tree for ${deal.sideA.teamName} vs ${deal.sideB.teamName} on ${formatTradeDate(deal.tradeDate)}`}
    >
      <div className="th-row-date">
        <span className="th-row-date-main">{formatTradeDate(deal.tradeDate)}</span>
        <span className="th-row-date-sub">
          {deal.seasonYear}
          {deal.week != null ? ` · Wk ${deal.week}` : ""}
        </span>
      </div>

      <div className="th-row-body">
        <SideBlock side={deal.sideA} align="left" />

        <div className="th-row-center">
          <span className="th-vs">VS</span>
          <TradeTugBar
            score={deal.tugScore}
            sideAName={deal.sideA.teamName}
            sideBName={deal.sideB.teamName}
          />
        </div>

        <SideBlock side={deal.sideB} align="right" />
      </div>

      <span className="th-row-cta" aria-hidden="true">
        View tree →
      </span>
    </Link>
  );
}
