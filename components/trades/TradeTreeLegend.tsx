"use client";

export function TradeTreeLegend() {
  return (
    <div className="tt-legend" aria-label="Trade tree legend">
      <span className="tt-legend-item">
        <i className="tt-legend-swatch tt-legend-swatch--line" />
        Trade lineage
      </span>
      <span className="tt-legend-item">
        <i className="tt-legend-swatch tt-legend-swatch--accent" />
        Owner accent
      </span>
      <span className="tt-legend-item">
        <i className="tt-legend-swatch tt-legend-swatch--expand" />
        Expand next trade
      </span>
      <span className="tt-legend-note">
        Season sets the starting trade; later seasons remain reachable on expand.
      </span>
    </div>
  );
}
