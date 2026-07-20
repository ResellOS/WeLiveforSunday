"use client";

import type { SpineTransaction } from "@/lib/trades/buildTradeSpine";
import { TradeSpineAssetRow } from "@/components/trades/TradeSpineAssetRow";

interface TradeSpineTransactionProps {
  txn: SpineTransaction;
}

function SwapIcon() {
  return (
    <svg
      className="tts-swap-icon"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 8h12M12 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 16H8M12 12l-4 4 4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TradeSpineTransaction({ txn }: TradeSpineTransactionProps) {
  return (
    <div className="tts-block tts-block--txn">
      <div className="tts-branch tts-branch--left">
        <div className="tts-panel tts-panel--received">
          <p className="tts-panel-title">Assets Received</p>
          <div className="tts-panel-list">
            {txn.received.length === 0 ? (
              <p className="tts-panel-empty">None</p>
            ) : (
              txn.received.map((item) => (
                <TradeSpineAssetRow
                  key={`${txn.transactionId}-in-${item.assetId}`}
                  item={item}
                  tone="received"
                />
              ))
            )}
          </div>
        </div>
        <div className="tts-connector" aria-hidden="true">
          <span className="tts-joint" />
        </div>
      </div>

      <div className="tts-card tts-card--txn">
        <p className="tts-txn-kicker">Trade #{txn.tradeIndex}</p>
        <p className="tts-txn-date">{txn.tradeDateLabel}</p>
        <p className="tts-txn-teams">
          <span>{txn.fromTeamName}</span>
          <span className="tts-txn-arrow" aria-hidden="true">
            →
          </span>
          <span>{txn.toTeamName}</span>
        </p>
        <SwapIcon />
      </div>

      <div className="tts-branch tts-branch--right">
        <div className="tts-connector" aria-hidden="true">
          <span className="tts-joint" />
        </div>
        <div className="tts-panel tts-panel--sent">
          <p className="tts-panel-title">Assets Sent</p>
          <div className="tts-panel-list">
            {txn.sent.length === 0 ? (
              <p className="tts-panel-empty">None</p>
            ) : (
              txn.sent.map((item) => (
                <TradeSpineAssetRow
                  key={`${txn.transactionId}-out-${item.assetId}`}
                  item={item}
                  tone="sent"
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
