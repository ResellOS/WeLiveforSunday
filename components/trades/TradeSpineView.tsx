"use client";

import type { TradeSpine } from "@/lib/trades/buildTradeSpine";
import { TradeSpineRoot } from "@/components/trades/TradeSpineRoot";
import { TradeSpineTransaction } from "@/components/trades/TradeSpineTransaction";
import { TradeSpineCurrentOwner } from "@/components/trades/TradeSpineCurrentOwner";

interface TradeSpineViewProps {
  spine: TradeSpine;
}

export function TradeSpineView({ spine }: TradeSpineViewProps) {
  if (!spine.root) return null;

  return (
    <div className="tts-scroll">
      <div className="tts-spine" role="list" aria-label="Trade lineage">
        <div className="tts-spine-line" aria-hidden="true" />

        <div role="listitem">
          <TradeSpineRoot root={spine.root} />
        </div>

        {spine.transactions.map((txn) => (
          <div key={txn.transactionId} role="listitem">
            <TradeSpineTransaction txn={txn} />
          </div>
        ))}

        {spine.currentOwner ? (
          <div role="listitem">
            <TradeSpineCurrentOwner owner={spine.currentOwner} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
