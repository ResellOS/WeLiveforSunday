"use client";

import { memo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type Edge,
  type EdgeProps,
} from "@xyflow/react";

export type TradeBranchEdgeType = Edge<
  { selected?: boolean; dimmed?: boolean },
  "tradeBranch"
>;

function TradeBranchEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  data,
}: EdgeProps<TradeBranchEdgeType>) {
  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 10,
  });

  const selected = Boolean(data?.selected);
  const dimmed = Boolean(data?.dimmed);

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        style={{
          ...style,
          fill: "none",
          filter: selected
            ? "drop-shadow(0 0 4px rgba(212, 169, 78, 0.45))"
            : undefined,
          opacity: dimmed ? 0.45 : 1,
        }}
      />
      <EdgeLabelRenderer>
        <span
          className={[
            "tt-joint",
            selected && "tt-joint--active",
            dimmed && "tt-joint--dimmed",
          ]
            .filter(Boolean)
            .join(" ")}
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
          }}
          aria-hidden="true"
        />
      </EdgeLabelRenderer>
    </>
  );
}

export const TradeBranchEdge = memo(TradeBranchEdgeComponent);
TradeBranchEdge.displayName = "TradeBranchEdge";
