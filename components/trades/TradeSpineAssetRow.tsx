"use client";

import Image from "next/image";
import type { SpineAssetItem } from "@/lib/trades/buildTradeSpine";

interface TradeSpineAssetRowProps {
  item: SpineAssetItem;
  /** "received" → red − ; "sent" → green + */
  tone: "received" | "sent";
}

export function TradeSpineAssetRow({ item, tone }: TradeSpineAssetRowProps) {
  const prefix = tone === "sent" ? "+" : "−";
  return (
    <div
      className={[
        "tts-asset",
        tone === "sent" ? "tts-asset--sent" : "tts-asset--received",
        item.isRootAsset && "tts-asset--root",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ ["--tts-accent" as string]: item.accentColor }}
    >
      <span className="tts-asset-prefix" aria-hidden="true">
        {prefix}
      </span>
      <div className="tts-asset-media">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt=""
            width={28}
            height={28}
            className="tts-asset-thumb"
            unoptimized
          />
        ) : item.pickBadge ? (
          <div className="tts-asset-pick" aria-hidden="true">
            {item.pickBadge.split("\n").map((line) => (
              <span key={line}>{line}</span>
            ))}
          </div>
        ) : (
          <div className="tts-asset-thumb tts-asset-thumb--fallback" aria-hidden="true">
            {item.label.slice(0, 1)}
          </div>
        )}
      </div>
      <div className="tts-asset-copy">
        <span className="tts-asset-name">{item.label}</span>
        {item.meta ? <span className="tts-asset-meta">{item.meta}</span> : null}
      </div>
    </div>
  );
}
