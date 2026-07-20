"use client";

import { memo } from "react";
import {
  BaseEdge,
  getBezierPath,
  type Edge,
  type EdgeProps,
} from "@xyflow/react";

export type WebBranchEdgeType = Edge<{
  dimmed?: boolean;
  highlighted?: boolean;
  kind?: string;
}>;

function WebBranchEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps<WebBranchEdgeType>) {
  const [path] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const dimmed = Boolean(data?.dimmed);
  const highlighted = Boolean(data?.highlighted);

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        className={[
          "tts-edge",
          dimmed && "is-dimmed",
          highlighted && "is-highlighted",
        ]
          .filter(Boolean)
          .join(" ")}
      />
      {/* Joint dot near the midpoint */}
      <circle
        cx={(sourceX + targetX) / 2}
        cy={(sourceY + targetY) / 2}
        r={3.5}
        className={[
          "tts-edge-joint",
          dimmed && "is-dimmed",
          highlighted && "is-highlighted",
        ]
          .filter(Boolean)
          .join(" ")}
      />
    </>
  );
}

export const WebBranchEdge = memo(WebBranchEdgeComponent);
WebBranchEdge.displayName = "WebBranchEdge";
