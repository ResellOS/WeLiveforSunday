"use client";

import { createContext, useContext } from "react";

export interface TradeTreeActions {
  toggleExpand: (nodeId: string) => void;
}

const TradeTreeContext = createContext<TradeTreeActions>({
  toggleExpand: () => undefined,
});

export function TradeTreeProvider({
  value,
  children,
}: {
  value: TradeTreeActions;
  children: React.ReactNode;
}) {
  return (
    <TradeTreeContext.Provider value={value}>
      {children}
    </TradeTreeContext.Provider>
  );
}

export function useTradeTreeActions(): TradeTreeActions {
  return useContext(TradeTreeContext);
}
