"use client";

export function TradeTreeLegend() {
  return (
    <div className="tt-legend" aria-label="Trade tree legend">
      <span className="tt-legend-item">
        <i className="tt-legend-icon tt-legend-icon--team" aria-hidden="true" />
        <span>
          <strong>Team Node</strong>
          <em>Current or Former Owner</em>
        </span>
      </span>
      <span className="tt-legend-item">
        <i className="tt-legend-icon tt-legend-icon--txn" aria-hidden="true" />
        <span>
          <strong>Transaction Node</strong>
          <em>Trade Details &amp; Date</em>
        </span>
      </span>
      <span className="tt-legend-item">
        <i className="tt-legend-icon tt-legend-icon--asset" aria-hidden="true" />
        <span>
          <strong>Asset Node</strong>
          <em>Players &amp; Draft Picks</em>
        </span>
      </span>
      <span className="tt-legend-item tt-legend-item--tone">
        <span className="tt-legend-tone tt-legend-tone--sent">+</span>
        Expand later trade
      </span>
      <span className="tt-legend-note">
        Start at Trade #1. Tap + on an asset to reveal its next deal. Click an
        asset to highlight its path; click empty space to reset.
      </span>
    </div>
  );
}
