/**
 * Dagre top-to-bottom layout for visible Trade Tree nodes.
 */

import dagre from "@dagrejs/dagre";
import type { Edge, Node } from "@xyflow/react";
import type { TradeTreeNode, TradeTreeNodeData } from "@/lib/trades/tradeTreeTypes";
import {
  CHILD_NODE_HEIGHT,
  CHILD_NODE_WIDTH,
  ROOT_NODE_HEIGHT,
  ROOT_NODE_WIDTH,
} from "@/lib/trades/tradeTreeTypes";

const RANK_SEP = 110;
const NODE_SEP = 52;

export type TradeFlowNode = Node<TradeTreeNodeData, "tradeAsset">;
export type TradeFlowEdge = Edge;

function collectEdges(node: TradeTreeNode, edges: TradeFlowEdge[]): void {
  if (!node.data.isExpanded) return;
  for (const child of node.children) {
    edges.push({
      id: `e:${node.id}->${child.id}`,
      source: node.id,
      target: child.id,
      type: "tradeBranch",
      data: {
        selected: false,
        dimmed: false,
      },
    });
    collectEdges(child, edges);
  }
}

export function treeToFlowElements(
  root: TradeTreeNode | null,
  selectedNodeId: string | null,
): { nodes: TradeFlowNode[]; edges: TradeFlowEdge[] } {
  if (!root) return { nodes: [], edges: [] };

  const visible: TradeTreeNode[] = [];
  const walk = (n: TradeTreeNode) => {
    visible.push(n);
    if (n.data.isExpanded) n.children.forEach(walk);
  };
  walk(root);

  const edges: TradeFlowEdge[] = [];
  collectEdges(root, edges);

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: "TB",
    ranksep: RANK_SEP,
    nodesep: NODE_SEP,
    marginx: 24,
    marginy: 24,
  });

  for (const n of visible) {
    const isRoot = Boolean(n.data.isRoot);
    g.setNode(n.id, {
      width: isRoot ? ROOT_NODE_WIDTH : CHILD_NODE_WIDTH,
      height: isRoot ? ROOT_NODE_HEIGHT : CHILD_NODE_HEIGHT,
    });
  }
  for (const e of edges) {
    g.setEdge(e.source, e.target);
  }

  dagre.layout(g);

  const nodes: TradeFlowNode[] = visible.map((n) => {
    const pos = g.node(n.id);
    const isRoot = Boolean(n.data.isRoot);
    const width = isRoot ? ROOT_NODE_WIDTH : CHILD_NODE_WIDTH;
    const height = isRoot ? ROOT_NODE_HEIGHT : CHILD_NODE_HEIGHT;
    const isSelected = selectedNodeId === n.id;
    const isDimmed = selectedNodeId != null && !isSelected;

    return {
      id: n.id,
      type: "tradeAsset",
      position: {
        x: pos.x - width / 2,
        y: pos.y - height / 2,
      },
      data: {
        ...n.data,
        isSelected,
        isDimmed,
      },
      selected: isSelected,
      style: { width, height },
      selectable: true,
    };
  });

  const connected = new Set<string>();
  if (selectedNodeId) {
    for (const e of edges) {
      if (e.source === selectedNodeId || e.target === selectedNodeId) {
        connected.add(e.id);
      }
    }
  }

  const styledEdges: TradeFlowEdge[] = edges.map((e) => {
    const isConnected = connected.has(e.id);
    const dimmed = selectedNodeId != null && !isConnected;
    return {
      ...e,
      data: { selected: isConnected, dimmed },
      style: {
        stroke: isConnected
          ? "rgba(212, 169, 78, 0.95)"
          : dimmed
            ? "rgba(212, 169, 78, 0.22)"
            : "rgba(212, 169, 78, 0.55)",
        strokeWidth: isConnected ? 1.75 : 1.35,
      },
    };
  });

  return { nodes, edges: styledEdges };
}
