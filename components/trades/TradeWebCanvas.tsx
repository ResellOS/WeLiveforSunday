"use client";

import { useCallback, useEffect, useMemo } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useEdgesState,
  useNodesState,
  useNodesInitialized,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { WebTxnFlowNode } from "@/components/trades/WebTxnFlowNode";
import { WebBranchEdge } from "@/components/trades/WebBranchEdge";
import { TradeWebProvider } from "@/components/trades/TradeWebContext";
import {
  collectAssetForwardPath,
  type TradeWeb,
} from "@/lib/trades/buildTradeWeb";
import { tradeWebToFlowElements } from "@/lib/trades/tradeWebLayout";

const nodeTypes = {
  webTxn: WebTxnFlowNode,
};

const edgeTypes = {
  webBranch: WebBranchEdge,
};

interface TradeWebCanvasInnerProps {
  web: TradeWeb;
  focusAssetId: string | null;
  focusTxnNodeId: string | null;
  /** Prefer centering on this txn node (`txn:…`). Null = fit overview. */
  cameraTargetId: string | null;
  onFocusChange: (assetId: string | null, txnNodeId: string | null) => void;
  onToggleExpand: (transactionId: string, assetId: string) => void;
  fitToken: string;
}

function TradeWebCanvasInner({
  web,
  focusAssetId,
  focusTxnNodeId,
  cameraTargetId,
  onFocusChange,
  onToggleExpand,
  fitToken,
}: TradeWebCanvasInnerProps) {
  const { fitView, getNode, setCenter } = useReactFlow();
  const nodesInitialized = useNodesInitialized();

  const path = useMemo(() => {
    if (!focusAssetId || !focusTxnNodeId) {
      return {
        nodeIds: new Set<string>(),
        edgeIds: new Set<string>(),
        assetKeys: new Set<string>(),
        pathActive: false,
      };
    }
    const collected = collectAssetForwardPath(web, focusAssetId, focusTxnNodeId);
    return { ...collected, pathActive: true };
  }, [web, focusAssetId, focusTxnNodeId]);

  const elements = useMemo(
    () =>
      tradeWebToFlowElements(web, {
        pathActive: path.pathActive,
        highlightedNodeIds: path.nodeIds,
        highlightedEdgeIds: path.edgeIds,
        highlightedAssetKeys: path.assetKeys,
        cameraTargetId,
      }),
    [web, path, cameraTargetId],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(elements.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(elements.edges);

  useEffect(() => {
    setNodes(elements.nodes);
    setEdges(elements.edges);
  }, [elements, setNodes, setEdges]);

  // History deep-links center on the specific txn; search fits the deal overview.
  useEffect(() => {
    if (!nodesInitialized) return;
    let cancelled = false;
    let attempts = 0;
    let retryTimer: number | undefined;

    const focusCamera = () => {
      if (cancelled) return;
      attempts += 1;

      if (cameraTargetId) {
        const node = getNode(cameraTargetId);
        const w = node?.measured?.width ?? node?.width ?? 0;
        const h = node?.measured?.height ?? node?.height ?? 0;
        if (node && w > 0 && h > 0) {
          fitView({
            nodes: [{ id: cameraTargetId }],
            padding: 0.28,
            duration: 0,
            maxZoom: 0.95,
            minZoom: 0.35,
          });
          setCenter(node.position.x + w / 2, node.position.y + h / 2, {
            zoom: 0.85,
            duration: 0,
          });
          return;
        }
        if (attempts < 24) {
          retryTimer = window.setTimeout(focusCamera, 40);
        }
        return;
      }

      fitView({ padding: 0.18, duration: 280, maxZoom: 1.05 });
    };

    const t = window.setTimeout(focusCamera, 60);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
      if (retryTimer != null) window.clearTimeout(retryTimer);
    };
  }, [
    fitToken,
    nodesInitialized,
    cameraTargetId,
    fitView,
    getNode,
    setCenter,
  ]);

  const onAssetClick = useCallback(
    (assetId: string, txnNodeId: string) => {
      onFocusChange(assetId, txnNodeId);
    },
    [onFocusChange],
  );

  const onPaneClick = useCallback(() => {
    onFocusChange(null, null);
  }, [onFocusChange]);

  return (
    <TradeWebProvider value={{ onAssetClick, onToggleExpand }}>
      <div className="tts-flow">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onPaneClick={onPaneClick}
          minZoom={0.15}
          maxZoom={1.75}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnScroll
          zoomOnScroll
          panOnDrag
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{ type: "webBranch" }}
        >
          <Background gap={28} color="rgba(212,169,78,0.08)" />
          <Controls className="tts-flow-controls" showInteractive={false} />
          <MiniMap
            className="tts-flow-minimap"
            nodeColor={(n) =>
              n.id === cameraTargetId ? "#f0d78c" : "#d4a94e"
            }
            maskColor="rgba(10,14,20,0.72)"
            pannable
            zoomable
          />
        </ReactFlow>
      </div>
    </TradeWebProvider>
  );
}

export function TradeWebCanvas(props: TradeWebCanvasInnerProps) {
  return (
    <ReactFlowProvider>
      <TradeWebCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
