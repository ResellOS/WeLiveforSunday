"use client";

import Image from "next/image";
import type { SpineCurrentOwner } from "@/lib/trades/buildTradeSpine";

interface TradeSpineCurrentOwnerProps {
  owner: SpineCurrentOwner;
}

export function TradeSpineCurrentOwner({ owner }: TradeSpineCurrentOwnerProps) {
  return (
    <div className="tts-block tts-block--owner">
      <p className="tts-owner-kicker">Current Owner</p>
      <div
        className="tts-card tts-card--owner"
        style={{ ["--tts-owner-accent" as string]: owner.accentColor }}
      >
        {owner.avatar ? (
          <Image
            src={owner.avatar}
            alt=""
            width={52}
            height={52}
            className="tts-owner-crest"
            unoptimized
          />
        ) : (
          <div
            className="tts-owner-crest tts-owner-crest--fallback"
            aria-hidden="true"
          >
            {owner.teamName.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="tts-owner-copy">
          <p className="tts-owner-name">{owner.teamName}</p>
          <p className="tts-owner-since">{owner.sinceLabel}</p>
        </div>
      </div>
    </div>
  );
}
