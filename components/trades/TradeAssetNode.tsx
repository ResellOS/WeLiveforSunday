"use client";

import { memo } from "react";
import Image from "next/image";
import {
  Handle,
  Position,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import {
  formatTradeDate,
  roundLabel,
} from "@/lib/trades/tradeHelpers";
import type { TradeTreeNodeData } from "@/lib/trades/tradeTreeTypes";
import { useTradeTreeActions } from "@/components/trades/TradeTreeContext";

export type TradeAssetFlowNode = Node<TradeTreeNodeData, "tradeAsset">;

type Props = NodeProps<TradeAssetFlowNode>;

function TradeAssetNodeComponent({ id, data, selected }: Props) {
  const { toggleExpand } = useTradeTreeActions();
  const isRoot = Boolean(data.isRoot);
  const isSelected = Boolean(data.isSelected || selected);
  const isDimmed = Boolean(data.isDimmed);
  const accent = data.teamColor ?? "#D4A94E";
  const dateLabel = formatTradeDate(data.tradeDate);

  const expandLabel = data.isExpanded
    ? `Collapse trade descendants for ${data.label}`
    : `Expand trade descendants for ${data.label}`;

  return (
    <div
      className={[
        "tt-node",
        isRoot ? "tt-node--root" : "tt-node--child",
        data.assetType === "draft_pick" && "tt-node--pick",
        isSelected && "tt-node--selected",
        isDimmed && "tt-node--dimmed",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ ["--tt-accent" as string]: accent }}
      role="treeitem"
      aria-selected={isSelected}
      aria-label={`Select ${data.label} trade node`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="tt-handle"
        isConnectable={false}
      />

      <span className="tt-node-accent" aria-hidden="true" />

      <div className="tt-node-media">
        {data.assetType === "draft_pick" ? (
          <span className="tt-pick-badge" aria-hidden="true">
            <span className="tt-pick-round">{roundLabel(data.draftRound)}</span>
            <span className="tt-pick-season">{data.draftSeason ?? "—"}</span>
          </span>
        ) : (
          <span className="tt-avatar">
            {data.playerImageUrl ? (
              <Image
                src={data.playerImageUrl}
                alt=""
                width={isRoot ? 40 : 32}
                height={isRoot ? 40 : 32}
                className="tt-avatar-img"
                unoptimized
              />
            ) : (
              <span className="tt-avatar-fallback" />
            )}
          </span>
        )}
      </div>

      <div className="tt-node-body">
        <div className="tt-node-top">
          <span className="tt-node-name">{data.label}</span>
          {dateLabel ? <span className="tt-node-date">{dateLabel}</span> : null}
        </div>

        {data.assetType === "draft_pick" ? (
          <div className="tt-node-meta">
            <span>
              {data.draftSeason} · {roundLabel(data.draftRound)} Rd
            </span>
            {data.originalOwnerName ? (
              <span className="tt-node-sub">Orig. {data.originalOwnerName}</span>
            ) : null}
          </div>
        ) : (
          <div className="tt-node-meta">
            <span>
              {[data.playerPosition, data.nflTeam].filter(Boolean).join(" · ")}
            </span>
          </div>
        )}

        {data.ownerName ? (
          <div className="tt-node-owner">{data.ownerName}</div>
        ) : null}
      </div>

      {data.hasChildren && !isRoot ? (
        <button
          type="button"
          className="tt-expand"
          aria-label={expandLabel}
          aria-expanded={data.isExpanded}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            toggleExpand(id);
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {data.isExpanded ? "−" : "+"}
        </button>
      ) : null}

      <Handle
        type="source"
        position={Position.Bottom}
        className="tt-handle"
        isConnectable={false}
      />
    </div>
  );
}

export const TradeAssetNode = memo(TradeAssetNodeComponent);
TradeAssetNode.displayName = "TradeAssetNode";
