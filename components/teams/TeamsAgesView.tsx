"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { TeamAvatar } from "@/components/ui/TeamAvatar";
import { ageHeat } from "@/lib/teams/metrics";
import type { TeamCardData } from "@/lib/teams/types";
import type { TeamMetrics } from "@/lib/teams/metrics";

export function TeamsAgesView({
  teams,
  metricsByRoster,
}: {
  teams: TeamCardData[];
  metricsByRoster: Record<number, TeamMetrics>;
}) {
  const [oldestFirst, setOldestFirst] = useState(false);

  const sorted = useMemo(() => {
    const dir = oldestFirst ? -1 : 1;
    return [...teams].sort((a, b) => {
      const aa = metricsByRoster[a.rosterId]?.ages.overall ?? -1;
      const bb = metricsByRoster[b.rosterId]?.ages.overall ?? -1;
      if (aa < 0 && bb < 0) return 0;
      if (aa < 0) return 1;
      if (bb < 0) return -1;
      return dir * (aa - bb);
    });
  }, [teams, metricsByRoster, oldestFirst]);

  return (
    <div className="teams-ages-view">
      <div className="teams-ages-header">
        <div>
          <h2 className="teams-view-title">Team Ages</h2>
          <p className="teams-view-sub">
            Averages exclude players with unknown birthdates
          </p>
        </div>
        <div className="teams-age-toggle">
          <button
            type="button"
            className={!oldestFirst ? "teams-age-toggle-active" : ""}
            onClick={() => setOldestFirst(false)}
          >
            Youngest First
          </button>
          <button
            type="button"
            className={oldestFirst ? "teams-age-toggle-active" : ""}
            onClick={() => setOldestFirst(true)}
          >
            Oldest First
          </button>
        </div>
      </div>

      <div className="teams-ages-grid">
        {sorted.map((t) => {
          const ages = metricsByRoster[t.rosterId]?.ages;
          const heat = ageHeat(ages?.overall ?? null);
          return (
            <Link
              key={t.rosterId}
              href={`/teams/${t.rosterId}`}
              className={`teams-age-card teams-age-card--${heat}`}
            >
              <TeamAvatar src={t.avatar} name={t.teamName} size={40} />
              <span className="teams-age-name">{t.teamName}</span>
              <span className="teams-age-overall">
                {ages?.overall != null
                  ? `${ages.overall.toFixed(1)} yrs`
                  : "Not Available Yet"}
              </span>
              <div className="teams-age-pos-grid">
                <span>QB {ages?.qb?.toFixed(1) ?? "—"}</span>
                <span>RB {ages?.rb?.toFixed(1) ?? "—"}</span>
                <span>WR {ages?.wr?.toFixed(1) ?? "—"}</span>
                <span>TE {ages?.te?.toFixed(1) ?? "—"}</span>
              </div>
              {ages && ages.unknownCount > 0 && (
                <span className="teams-age-unknown">
                  {ages.unknownCount} unknown
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
