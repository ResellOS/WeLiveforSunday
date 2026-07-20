"use client";

import Image from "next/image";
import { Handle, Position } from "@xyflow/react";
import type { WebAssetItem } from "@/lib/trades/buildTradeWeb";

interface WebAssetRowProps {
  item: WebAssetItem;
  txnNodeId: string;
  transactionId: string;
  highlighted: boolean;
  onAssetClick: (assetId: string, txnNodeId: string) => void;
  onToggleExpand: (transactionId: string, assetId: string) => void;
}

export function WebAssetRow({
  item,
  txnNodeId,
  transactionId,
  highlighted,
  onAssetClick,
  onToggleExpand,
}: WebAssetRowProps) {
  const handleId = `asset-${item.side}-${item.assetId}`;

  return (
    <div
      className={[
        "tts-asset",
        `tts-asset--${item.side}`,
        item.isRootAsset && "tts-asset--root",
        item.canExpand && "tts-asset--expandable",
        item.isExpanded && "tts-asset--expanded",
        highlighted && "tts-asset--highlighted",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ ["--tts-accent" as string]: item.accentColor }}
    >
      <button
        type="button"
        className="tts-asset-hit nodrag nopan"
        onClick={(e) => {
          e.stopPropagation();
          onAssetClick(item.assetId, txnNodeId);
        }}
      >
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
            <div
              className="tts-asset-thumb tts-asset-thumb--fallback"
              aria-hidden="true"
            >
              {item.label.slice(0, 1)}
            </div>
          )}
        </div>
        <div className="tts-asset-copy">
          <span className="tts-asset-name">{item.label}</span>
          {item.meta ? <span className="tts-asset-meta">{item.meta}</span> : null}
        </div>
      </button>

      {item.canExpand ? (
        <button
          type="button"
          className="tts-asset-expand nodrag nopan"
          aria-label={
            item.isExpanded
              ? `Collapse later trades for ${item.label}`
              : `Expand later trades for ${item.label}`
          }
          aria-expanded={item.isExpanded}
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand(transactionId, item.assetId);
          }}
        >
          {item.isExpanded ? "−" : "+"}
        </button>
      ) : null}

      {item.canExpand || item.nextTxnNodeId ? (
        <Handle
          type="source"
          position={Position.Bottom}
          id={handleId}
          className="tts-h tts-h--asset"
          isConnectable={false}
        />
      ) : null}
    </div>
  );
}
