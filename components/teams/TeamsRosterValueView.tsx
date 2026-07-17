"use client";

import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { TeamAvatar } from "@/components/ui/TeamAvatar";
import { record } from "@/lib/format";
import type { TeamCardData } from "@/lib/teams/types";
import type { TeamMetrics } from "@/lib/teams/metrics";

export function TeamsRosterValueView({
  teams,
  metricsByRoster,
  hasKtc,
}: {
  teams: TeamCardData[];
  metricsByRoster: Record<number, TeamMetrics>;
  hasKtc: boolean;
}) {
  if (!hasKtc) {
    return (
      <Panel className="p-4 teams-empty-panel">
        <p className="teams-empty-title">Roster Value</p>
        <p className="teams-empty-message">
          Roster-value data source is not connected yet.
        </p>
        <div className="teams-card-grid teams-card-grid--muted">
          {teams.map((t, i) => (
            <Link
              key={t.rosterId}
              href={`/teams/${t.rosterId}`}
              className="team-franchise-card team-franchise-card--muted"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <TeamAvatar src={t.avatar} name={t.teamName} size={48} />
              <span className="team-card-name">{t.teamName}</span>
              <span className="team-card-metric-value">Value unavailable</span>
            </Link>
          ))}
        </div>
      </Panel>
    );
  }

  const sorted = [...teams].sort(
    (a, b) => b.rosterValue - a.rosterValue,
  );

  return (
    <div className="teams-value-view">
      <h2 className="teams-view-title">Dynasty Roster Value</h2>
      <p className="teams-view-sub">Ranked by total KTC dynasty value</p>
      <div className="teams-value-list">
        {sorted.map((t, i) => {
          const m = metricsByRoster[t.rosterId];
          return (
            <Link
              key={t.rosterId}
              href={`/teams/${t.rosterId}`}
              className="teams-value-row"
            >
              <span className="teams-value-rank">{i + 1}</span>
              <TeamAvatar src={t.avatar} name={t.teamName} size={34} />
              <span className="teams-value-name">{t.teamName}</span>
              <span className="teams-value-total">
                {t.rosterValue.toLocaleString()}
              </span>
              <span className="teams-value-split">
                ST {m?.rosterValue.starters.toLocaleString() ?? "—"} · BN{" "}
                {m?.rosterValue.bench.toLocaleString() ?? "—"}
              </span>
              <span className="teams-value-record">
                {record(t.wins, t.losses, t.ties)}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
