/**
 * Custom top-down layout for the Trade Tree web.
 * Child transactions fan under their parent, biased left/right by package side.
 */

import type { Edge, Node } from "@xyflow/react";
import type {
  TradeWeb,
  WebAssetItem,
  WebNode,
  WebTxnNode,
} from "@/lib/trades/buildTradeWeb";

export const WEB_TXN_W = 720;
export const WEB_TXN_H = 210;
export const WEB_GAP_Y = 110;
export const WEB_GAP_X = 48;

function txnHeight(node: WebTxnNode): number {
  const rows = Math.max(node.leftReceived.length, node.rightReceived.length, 1);
  return Math.max(WEB_TXN_H, 88 + rows * 44);
}

function nodeSize(
  nodeId: string,
  byId: Map<string, WebNode>,
): { w: number; h: number } {
  const n = byId.get(nodeId);
  if (n?.kind === "transaction") {
    return { w: WEB_TXN_W, h: txnHeight(n) };
  }
  return { w: WEB_TXN_W, h: WEB_TXN_H };
}

export type FlowTxnData = WebTxnNode & {
  dimmed: boolean;
  highlighted: boolean;
  cameraFocused: boolean;
  highlightedAssetKeys: string[];
};

function subtreeWidth(
  nodeId: string,
  childrenOf: Map<
    string,
    Array<{ childId: string; side: "left" | "right" | "center" }>
  >,
  byId: Map<string, WebNode>,
  memo: Map<string, number>,
): number {
  if (memo.has(nodeId)) return memo.get(nodeId)!;
  const kids = childrenOf.get(nodeId) ?? [];
  const self = nodeSize(nodeId, byId).w;
  if (kids.length === 0) {
    memo.set(nodeId, self);
    return self;
  }
  const widths = kids.map((k) =>
    subtreeWidth(k.childId, childrenOf, byId, memo),
  );
  const sum = widths.reduce((a, b) => a + b, 0) + WEB_GAP_X * (kids.length - 1);
  const w = Math.max(self, sum);
  memo.set(nodeId, w);
  return w;
}

function sideForAsset(item: WebAssetItem): "left" | "right" {
  return item.side;
}

export function tradeWebToFlowElements(
  web: TradeWeb,
  opts?: {
    dimmedNodeIds?: Set<string>;
    highlightedNodeIds?: Set<string>;
    highlightedEdgeIds?: Set<string>;
    highlightedAssetKeys?: Set<string>;
    pathActive?: boolean;
    /** Soft-focus ring for History deep-links (no tree dimming). */
    cameraTargetId?: string | null;
  },
): { nodes: Node[]; edges: Edge[] } {
  const pathActive = Boolean(opts?.pathActive);
  const hiNodes = opts?.highlightedNodeIds ?? new Set<string>();
  const hiEdges = opts?.highlightedEdgeIds ?? new Set<string>();
  const hiAssets = opts?.highlightedAssetKeys ?? new Set<string>();
  const cameraTargetId = opts?.cameraTargetId ?? null;

  const byId = new Map(web.nodes.map((n) => [n.id, n]));
  const childrenOf = new Map<
    string,
    Array<{ childId: string; side: "left" | "right" | "center" }>
  >();

  for (const e of web.edges) {
    let side: "left" | "right" | "center" = "center";
    if (e.kind === "asset-to-txn" && e.source.startsWith("txn:")) {
      const txn = web.nodes.find(
        (n): n is WebTxnNode => n.kind === "transaction" && n.id === e.source,
      );
      const item = txn
        ? [...txn.leftReceived, ...txn.rightReceived].find(
            (a) => a.assetId === e.assetId,
          )
        : null;
      side = item ? sideForAsset(item) : "center";
    }
    const list = childrenOf.get(e.source) ?? [];
    if (!list.some((c) => c.childId === e.target)) {
      list.push({ childId: e.target, side });
      childrenOf.set(e.source, list);
    }
  }

  // Stable order: left branches, then center, then right.
  for (const [k, list] of childrenOf) {
    list.sort((a, b) => {
      const rank = { left: 0, center: 1, right: 2 };
      if (rank[a.side] !== rank[b.side]) return rank[a.side] - rank[b.side];
      return a.childId.localeCompare(b.childId);
    });
    childrenOf.set(k, list);
  }

  const layoutRootId =
    web.rootPathTxnIds[0] ??
    web.nodes.find((n) => n.kind === "transaction")?.id ??
    null;

  const positions = new Map<string, { x: number; y: number }>();
  const memo = new Map<string, number>();

  function place(nodeId: string, centerX: number, y: number) {
    const { w, h } = nodeSize(nodeId, byId);
    positions.set(nodeId, { x: centerX - w / 2, y });

    const kids = childrenOf.get(nodeId) ?? [];
    if (kids.length === 0) return;

    const widths = kids.map((k) =>
      subtreeWidth(k.childId, childrenOf, byId, memo),
    );
    const total =
      widths.reduce((a, b) => a + b, 0) +
      WEB_GAP_X * Math.max(0, kids.length - 1);
    let cursor = centerX - total / 2;
    const childY = y + h + WEB_GAP_Y;
    for (let i = 0; i < kids.length; i++) {
      const cw = widths[i];
      const childCenter = cursor + cw / 2;
      place(kids[i].childId, childCenter, childY);
      cursor += cw + WEB_GAP_X;
    }
  }

  if (layoutRootId) {
    subtreeWidth(layoutRootId, childrenOf, byId, memo);
    place(layoutRootId, 0, 0);
  }

  const isHi = (id: string) => !pathActive || hiNodes.has(id);
  const isDim = (id: string) => pathActive && !hiNodes.has(id);

  const nodes: Node[] = web.nodes.map((n) => {
    const pos = positions.get(n.id) ?? { x: 0, y: 0 };
    return {
      id: n.id,
      type: "webTxn",
      position: pos,
      data: {
        ...n,
        dimmed: isDim(n.id),
        highlighted: isHi(n.id) && pathActive,
        cameraFocused: cameraTargetId === n.id,
        highlightedAssetKeys: [...hiAssets],
      } satisfies FlowTxnData,
      draggable: false,
      selectable: false,
    };
  });

  const edges: Edge[] = web.edges.map((e) => {
    const highlighted = pathActive && hiEdges.has(e.id);
    const dimmed = pathActive && !hiEdges.has(e.id);
    return {
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
      type: "webBranch",
      data: { dimmed, highlighted, kind: e.kind },
      animated: false,
    };
  });

  return { nodes, edges };
}
