"use client";

import { createContext, useContext, type ReactNode } from "react";

export interface TradeWebActions {
  onAssetClick: (assetId: string, txnNodeId: string) => void;
  onToggleExpand: (transactionId: string, assetId: string) => void;
}

const TradeWebContext = createContext<TradeWebActions>({
  onAssetClick: () => undefined,
  onToggleExpand: () => undefined,
});

export function TradeWebProvider({
  value,
  children,
}: {
  value: TradeWebActions;
  children: ReactNode;
}) {
  return (
    <TradeWebContext.Provider value={value}>{children}</TradeWebContext.Provider>
  );
}

export function useTradeWebActions(): TradeWebActions {
  return useContext(TradeWebContext);
}
