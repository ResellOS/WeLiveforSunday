"use client";

import { TeamFranchiseCard } from "@/components/TeamsGrid";
import {
  contenderTier,
  type ContenderTier,
} from "@/lib/teams/classification";
import type { TeamCardData } from "@/lib/teams/types";

const TIER_LABELS: Record<ContenderTier, string> = {
  contender: "Confirmed Contenders",
  hopeful: "Playoff Hopefuls",
  borderline: "Borderline Teams",
};

const TIER_EDGE: Record<ContenderTier, string> = {
  contender: "team-franchise-card--edge-contender",
  hopeful: "team-franchise-card--edge-hopeful",
  borderline: "team-franchise-card--edge-borderline",
};

export function TeamsContendersView({ teams }: { teams: TeamCardData[] }) {
  const groups: Record<ContenderTier, TeamCardData[]> = {
    contender: [],
    hopeful: [],
    borderline: [],
  };

  for (const t of teams) {
    const tier = contenderTier(t.status);
    if (tier) groups[tier].push(t);
  }

  return (
    <div className="teams-tier-view">
      {(Object.keys(groups) as ContenderTier[]).map((tier) => (
        <section key={tier} className="teams-tier-section">
          <h2 className={`teams-tier-heading teams-tier-heading--${tier}`}>
            {TIER_LABELS[tier]}
            <span className="teams-tier-count">{groups[tier].length}</span>
          </h2>
          <div className="teams-card-grid">
            {groups[tier].map((t, i) => (
              <TeamFranchiseCard
                key={t.rosterId}
                team={t}
                index={i}
                edgeClass={TIER_EDGE[tier]}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
