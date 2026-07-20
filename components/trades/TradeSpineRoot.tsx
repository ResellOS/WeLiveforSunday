"use client";

import Image from "next/image";
import type { SpineRoot } from "@/lib/trades/buildTradeSpine";

interface TradeSpineRootProps {
  root: SpineRoot;
}

export function TradeSpineRoot({ root }: TradeSpineRootProps) {
  return (
    <div className="tts-block tts-block--root">
      <div className="tts-side-label" aria-hidden="true">
        <span className="tts-side-label-icon" />
        <span className="tts-side-label-kicker">Root Asset</span>
        <span className="tts-side-label-sub">Player Journey Begins</span>
      </div>

      <div className="tts-card tts-card--root">
        <div className="tts-root-media">
          {root.imageUrl ? (
            <Image
              src={root.imageUrl}
              alt=""
              width={56}
              height={56}
              className="tts-avatar"
              unoptimized
            />
          ) : root.pickBadge ? (
            <div className="tts-pick-badge" aria-hidden="true">
              {root.pickBadge.split("\n").map((line) => (
                <span key={line}>{line}</span>
              ))}
            </div>
          ) : (
            <div className="tts-avatar tts-avatar--fallback" aria-hidden="true">
              {root.label.slice(0, 1)}
            </div>
          )}
        </div>
        <div className="tts-root-body">
          <p className="tts-root-name">{root.label}</p>
          {root.meta ? <p className="tts-root-meta">{root.meta}</p> : null}
          <p className="tts-root-origin">
            <span>{root.originLabel}</span>
            {root.originDetail ? (
              <>
                <span className="tts-root-origin-sep" aria-hidden="true">
                  |
                </span>
                <span>{root.originDetail}</span>
              </>
            ) : null}
          </p>
        </div>
      </div>
    </div>
  );
}
