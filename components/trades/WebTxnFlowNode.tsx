"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { WebAssetRow } from "@/components/trades/WebAssetRow";
import { useTradeWebActions } from "@/components/trades/TradeWebContext";
import type { FlowTxnData } from "@/lib/trades/tradeWebLayout";

function assetHighlighted(
  keys: string[],
  txnId: string,
  side: string,
  assetId: string,
): boolean {
  return keys.includes(`${txnId}:${side}:${assetId}`);
}

function WebTxnFlowNodeComponent({ id, data }: NodeProps) {
  const d = data as unknown as FlowTxnData;
  const { onAssetClick, onToggleExpand } = useTradeWebActions();
  const hiKeys = d.highlightedAssetKeys;

  return (
    <div
      className={[
        "tts-flow-txn",
        "nodrag",
        d.dimmed && "is-dimmed",
        d.highlighted && "is-highlighted",
        d.cameraFocused && "is-camera-focused",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Handle type="target" position={Position.Top} id="in" className="tts-h" />

      <div className="tts-block tts-block--txn tts-block--flow">
        <div className="tts-branch tts-branch--left">
          <div className="tts-panel tts-panel--received">
            <p className="tts-panel-title">{d.leftTeamName} received</p>
            <div className="tts-panel-list">
              {d.leftReceived.length === 0 ? (
                <p className="tts-panel-empty">None</p>
              ) : (
                d.leftReceived.map((item) => (
                  <WebAssetRow
                    key={`${id}-left-${item.assetId}`}
                    item={item}
                    txnNodeId={id}
                    transactionId={d.transactionId}
                    highlighted={assetHighlighted(
                      hiKeys,
                      id,
                      item.side,
                      item.assetId,
                    )}
                    onAssetClick={onAssetClick}
                    onToggleExpand={onToggleExpand}
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
          <p className="tts-txn-kicker">Trade #{d.tradeIndex}</p>
          <p className="tts-txn-date">{d.tradeDateLabel}</p>
          <p className="tts-txn-teams">
            <span>{d.leftTeamName}</span>
            <span className="tts-txn-arrow" aria-hidden="true">
              →
            </span>
            <span>{d.rightTeamName}</span>
          </p>
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
        </div>

        <div className="tts-branch tts-branch--right">
          <div className="tts-connector" aria-hidden="true">
            <span className="tts-joint" />
          </div>
          <div className="tts-panel tts-panel--sent">
            <p className="tts-panel-title">{d.rightTeamName} received</p>
            <div className="tts-panel-list">
              {d.rightReceived.length === 0 ? (
                <p className="tts-panel-empty">None</p>
              ) : (
                d.rightReceived.map((item) => (
                  <WebAssetRow
                    key={`${id}-right-${item.assetId}`}
                    item={item}
                    txnNodeId={id}
                    transactionId={d.transactionId}
                    highlighted={assetHighlighted(
                      hiKeys,
                      id,
                      item.side,
                      item.assetId,
                    )}
                    onAssetClick={onAssetClick}
                    onToggleExpand={onToggleExpand}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const WebTxnFlowNode = memo(WebTxnFlowNodeComponent);
WebTxnFlowNode.displayName = "WebTxnFlowNode";
