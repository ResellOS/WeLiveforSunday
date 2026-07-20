import type { Metadata } from "next";
import { Panel } from "@/components/ui/Panel";
import { TradeTreeTabs } from "@/components/trades/TradeTreeTabs";

export const metadata: Metadata = { title: "Hall of Fame / Shame" };

export default function TradeHallOfFamePage() {
  return (
    <div className="tt-page">
      <Panel className="panel--banner tt-banner">
        <div className="tt-banner-inner">
          <div>
            <p className="tt-kicker">Trades</p>
            <h1 className="tt-title">Hall of Fame / Shame</h1>
            <p className="tt-sub">
              The league&apos;s best — and worst — deals, preserved.
            </p>
          </div>
        </div>
      </Panel>
      <TradeTreeTabs />
      <Panel className="tt-stage-panel">
        <div className="tt-state" role="status">
          <p>HALL OF FAME / SHAME</p>
          <p className="tt-state-sub">
            This section is a placeholder so Trade Tree navigation stays intact.
          </p>
        </div>
      </Panel>
    </div>
  );
}
