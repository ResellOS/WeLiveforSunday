"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type NodeTypes,
  type EdgeTypes,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { TradeAssetNode } from "@/components/trades/TradeAssetNode";
import { TradeBranchEdge } from "@/components/trades/TradeBranchEdge";
import { TradeTreeProvider } from "@/components/trades/TradeTreeContext";
import { treeToFlowElements } from "@/lib/trades/tradeTreeLayout";
import type { TradeTreeNode } from "@/lib/trades/tradeTreeTypes";

const nodeTypes: NodeTypes = {
  tradeAsset: TradeAssetNode,
};

const edgeTypes: EdgeTypes = {
  tradeBranch: TradeBranchEdge,
};

interface TradeTreeCanvasInnerProps {
  root: TradeTreeNode | null;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onToggleExpand: (nodeId: string) => void;
  fitToken: string;
}

function TradeTreeCanvasInner({
  root,
  selectedNodeId,
  onSelectNode,
  onToggleExpand,
  fitToken,
}: TradeTreeCanvasInnerProps) {
  const { fitView } = useReactFlow();
  const lastFitToken = useRef<string>("");

  const { nodes: layoutNodes, edges: layoutEdges } = useMemo(
    () => treeToFlowElements(root, selectedNodeId),
    [root, selectedNodeId],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutEdges);

  useEffect(() => {
    setNodes(layoutNodes);
    setEdges(layoutEdges);
  }, [layoutNodes, layoutEdges, setNodes, setEdges]);

  useEffect(() => {
    if (!root || fitToken === lastFitToken.current) return;
    lastFitToken.current = fitToken;
    const id = window.requestAnimationFrame(() => {
      void fitView({ padding: 0.18, duration: 280 });
    });
    return () => window.cancelAnimationFrame(id);
  }, [fitToken, root, fitView, layoutNodes.length]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onSelectNode(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onSelectNode]);

  const onNodeClick: NodeMouseHandler = useCallback(
    (_e, node) => {
      onSelectNode(node.id);
    },
    [onSelectNode],
  );

  const onPaneClick = useCallback(() => {
    onSelectNode(null);
  }, [onSelectNode]);

  const actions = useMemo(
    () => ({ toggleExpand: onToggleExpand }),
    [onToggleExpand],
  );

  return (
    <TradeTreeProvider value={actions}>
      <div className="tt-canvas" role="tree" aria-label="Trade genealogy tree">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          minZoom={0.35}
          maxZoom={1.8}
          proOptions={{ hideAttribution: true }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable
          panOnScroll
          zoomOnScroll
          zoomOnPinch
          panOnDrag
          fitView
          fitViewOptions={{ padding: 0.18 }}
          defaultEdgeOptions={{ type: "tradeBranch" }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={22}
            size={1}
            color="rgba(212, 169, 78, 0.08)"
          />
          <Controls
            showInteractive={false}
            className="tt-controls"
            aria-label="Trade tree viewport controls"
          />
          <MiniMap
            className="tt-minimap"
            pannable
            zoomable
            maskColor="rgba(5, 6, 6, 0.72)"
            nodeColor={() => "rgba(212, 169, 78, 0.55)"}
          />
        </ReactFlow>
      </div>
    </TradeTreeProvider>
  );
}

export function TradeTreeCanvas(props: TradeTreeCanvasInnerProps) {
  return (
    <ReactFlowProvider>
      <TradeTreeCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
