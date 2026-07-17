"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Panel } from "@/components/ui/Panel";
import { sleeperPlayerThumb } from "@/lib/sleeperMedia";
import {
  filterRosterRows,
  type RosterFilter,
  type RosterPlayerRow,
} from "@/lib/teams/roster";

const FILTERS: Array<{ key: RosterFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "starters", label: "Starters" },
  { key: "bench", label: "Bench" },
  { key: "QB", label: "QB" },
  { key: "RB", label: "RB" },
  { key: "WR", label: "WR" },
  { key: "TE", label: "TE" },
];

const POS_CLASS: Record<string, string> = {
  QB: "pos-qb",
  RB: "pos-rb",
  WR: "pos-wr",
  TE: "pos-te",
  K: "pos-k",
  DEF: "pos-def",
};

export function TeamRosterPanel({
  rows,
  hasKtc,
}: {
  rows: RosterPlayerRow[];
  hasKtc: boolean;
}) {
  const [filter, setFilter] = useState<RosterFilter>("all");

  const filtered = useMemo(
    () => filterRosterRows(rows, filter),
    [rows, filter],
  );

  return (
    <Panel className="p-4 team-detail-panel">
      <div className="team-detail-panel-head">
        <h2 className="team-detail-panel-title">Roster</h2>
        <div className="team-roster-filters" role="tablist">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={filter === f.key}
              className={
                filter === f.key
                  ? "team-roster-filter team-roster-filter--active"
                  : "team-roster-filter"
              }
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="team-roster-table">
        <div className="team-roster-head" aria-hidden="true">
          <span />
          <span>Player</span>
          <span>NFL</span>
          <span>Pos</span>
          <span>Age</span>
          {hasKtc && <span>KTC</span>}
          <span>Status</span>
        </div>
        {filtered.map((row) => (
          <RosterRow key={row.playerId} row={row} hasKtc={hasKtc} />
        ))}
        {filtered.length === 0 && (
          <p className="team-roster-empty">No players in this filter.</p>
        )}
      </div>
    </Panel>
  );
}

function RosterRow({
  row,
  hasKtc,
}: {
  row: RosterPlayerRow;
  hasKtc: boolean;
}) {
  const posClass = POS_CLASS[row.position] ?? "";

  return (
    <div className={`team-roster-row ${posClass}`}>
      <Image
        src={sleeperPlayerThumb(row.playerId)}
        alt=""
        width={36}
        height={36}
        className="team-roster-headshot"
        unoptimized
      />
      <span className="team-roster-name">
        {row.name}
        {row.lineupSlot && (
          <span className="team-roster-slot">{row.lineupSlot}</span>
        )}
      </span>
      <span className="team-roster-nfl">{row.nflTeam}</span>
      <span className={`team-roster-pos ${posClass}`}>{row.position}</span>
      <span className="team-roster-age">
        {row.age != null ? row.age : "—"}
      </span>
      {hasKtc && (
        <span className="team-roster-value">
          {row.dynastyValue != null
            ? row.dynastyValue.toLocaleString()
            : "—"}
        </span>
      )}
      <span className="team-roster-injury">
        {row.injuryStatus ?? row.group}
      </span>
    </div>
  );
}
