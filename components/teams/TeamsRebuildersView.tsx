"use client";

import { TeamFranchiseCard } from "@/components/TeamsGrid";
import {
  rebuilderTier,
  type RebuilderTier,
} from "@/lib/teams/classification";
import type { TeamCardData } from "@/lib/teams/types";
import type { TeamMetrics } from "@/lib/teams/metrics";

const TIER_LABELS: Record<RebuilderTier, string> = {
  rebuilding: "Rebuilding",
  retooling: "Retooling",
  development: "Long-Term Development",
};

const TIER_EDGE: Record<RebuilderTier, string> = {
  rebuilding: "team-franchise-card--edge-rebuild",
  retooling: "team-franchise-card--edge-retool",
  development: "team-franchise-card--edge-dev",
};

export function TeamsRebuildersView({
  teams,
  metricsByRoster,
}: {
  teams: TeamCardData[];
  metricsByRoster: Record<number, TeamMetrics>;
}) {
  const groups: Record<RebuilderTier, TeamCardData[]> = {
    rebuilding: [],
    retooling: [],
    development: [],
  };

  for (const t of teams) {
    const tier = rebuilderTier(t.status, metricsByRoster[t.rosterId]);
    if (tier) groups[tier].push(t);
  }

  return (
    <div className="teams-tier-view">
      {(Object.keys(groups) as RebuilderTier[]).map((tier) => (
        <section key={tier} className="teams-tier-section">
          <h2 className="teams-tier-heading">{TIER_LABELS[tier]}</h2>
          <div className="teams-card-grid">
            {groups[tier].map((t, i) => {
              const m = metricsByRoster[t.rosterId];
              const metricOverride = {
                label: "Rebuild Signal",
                value: [
                  m?.ages.overall != null
                    ? `${m.ages.overall.toFixed(1)} yrs`
                    : "age n/a",
                  `${t.draftCapital} picks`,
                  t.rosterValueAvailable
                    ? `${(t.rosterValue / 1000).toFixed(1)}k KTC`
                    : "value n/a",
                  `#${t.powerRank} PWR`,
                ].join(" · "),
              };
              return (
                <TeamFranchiseCard
                  key={t.rosterId}
                  team={t}
                  index={i}
                  edgeClass={TIER_EDGE[tier]}
                  metricOverride={metricOverride}
                />
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
