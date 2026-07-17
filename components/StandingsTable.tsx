"use client";

import { Fragment, useMemo, useState } from "react";
import { TeamAvatar } from "@/components/ui/TeamAvatar";
import { fmtPct3, fmtPoints, record } from "@/lib/format";
import type { StandingRow } from "@/lib/league";

type SortKey = "wl" | "pct" | "pf" | "pa" | "streak";

function streakLabel(streak: number): string {
  if (streak === 0) return "—";
  return streak > 0 ? `W${streak}` : `L${Math.abs(streak)}`;
}

const SORTABLE: Array<{ key: SortKey; label: string; short: string }> = [
  { key: "wl", label: "W-L", short: "W-L" },
  { key: "pct", label: "Pct", short: "Pct" },
  { key: "pf", label: "PF", short: "PF" },
  { key: "pa", label: "PA", short: "PA" },
  { key: "streak", label: "St", short: "St" },
];

export function StandingsTable({
  standings,
  playoffCutoff,
}: {
  standings: StandingRow[];
  playoffCutoff?: number;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("wl");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const sorted = useMemo(() => {
    const rows = [...standings];
    const mul = sortDir === "asc" ? 1 : -1;

    rows.sort((a, b) => {
      switch (sortKey) {
        case "wl": {
          const aw = a.wins * 10 + a.losses;
          const bw = b.wins * 10 + b.losses;
          return (aw - bw) * mul || (b.pct - a.pct) * mul;
        }
        case "pct":
          return (a.pct - b.pct) * mul;
        case "pf":
          return (a.pointsFor - b.pointsFor) * mul;
        case "pa":
          return (a.pointsAgainst - b.pointsAgainst) * mul;
        case "streak":
          return (a.streak - b.streak) * mul;
        default:
          return 0;
      }
    });
    return rows;
  }, [standings, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "pa" ? "asc" : "desc");
    }
  }

  return (
    <div className="standings-table standings-table-sortable standings-table-fill">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Team</th>
            {SORTABLE.map((col) => (
              <th key={col.key}>
                <button
                  type="button"
                  className={
                    sortKey === col.key
                      ? "standings-sort-btn standings-sort-active"
                      : "standings-sort-btn"
                  }
                  onClick={() => toggleSort(col.key)}
                >
                  {col.short}
                  {sortKey === col.key && (
                    <span className="standings-sort-arrow">
                      {sortDir === "asc" ? "▲" : "▼"}
                    </span>
                  )}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="standings-tbody">
          {sorted.map((t, idx) => (
            <Fragment key={t.rosterId}>
              <tr className="standings-row" style={{ animationDelay: `${idx * 18}ms` }}>
                <td className="standings-rank">{t.rank}</td>
                <td>
                  <div className="standings-team">
                    <TeamAvatar src={t.avatar} name={t.teamName} size={26} />
                    <div className="truncate standings-team-name">
                      {t.teamName}
                    </div>
                  </div>
                </td>
                <td>{record(t.wins, t.losses, t.ties)}</td>
                <td>{fmtPct3(t.pct)}</td>
                <td>{fmtPoints(t.pointsFor)}</td>
                <td>{fmtPoints(t.pointsAgainst)}</td>
                <td>
                  <span
                    className={
                      t.streak > 0
                        ? "standings-streak standings-streak-win"
                        : t.streak < 0
                          ? "standings-streak standings-streak-loss"
                          : "standings-streak standings-streak-flat"
                    }
                  >
                    {streakLabel(t.streak)}
                  </span>
                </td>
              </tr>
              {playoffCutoff === t.rank && sortKey === "wl" && (
                <tr aria-hidden>
                  <td colSpan={7} className="standings-playoff-row">
                    <div className="flex items-center gap-2">
                      <div className="divider-gold flex-1" />
                      <span className="text-[10px] uppercase tracking-widest text-gold/60">
                        Playoff Line
                      </span>
                      <div className="divider-gold flex-1" />
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
