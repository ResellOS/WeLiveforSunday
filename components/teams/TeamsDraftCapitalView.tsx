"use client";

import Link from "next/link";
import { TeamAvatar } from "@/components/ui/TeamAvatar";
import {
  formatRoundList,
  groupPicksBySeason,
  type OwnedPick,
} from "@/lib/teams/draftCapital";
import type { TeamCardData } from "@/lib/teams/types";

export function TeamsDraftCapitalView({
  teams,
  picksByRoster,
}: {
  teams: TeamCardData[];
  picksByRoster: Record<number, OwnedPick[]>;
}) {
  const sorted = [...teams].sort(
    (a, b) => b.draftCapital - a.draftCapital,
  );

  return (
    <div className="teams-draft-view">
      <h2 className="teams-view-title">Draft Capital</h2>
      <p className="teams-view-sub">
        Future picks from Sleeper traded-pick data · * acquired via trade
      </p>
      <div className="teams-draft-list">
        {sorted.map((t, i) => {
          const picks = picksByRoster[t.rosterId] ?? [];
          const bySeason = groupPicksBySeason(picks);
          return (
            <Link
              key={t.rosterId}
              href={`/teams/${t.rosterId}`}
              className="teams-draft-row"
            >
              <span className="teams-draft-rank">{i + 1}</span>
              <TeamAvatar src={t.avatar} name={t.teamName} size={32} />
              <div className="teams-draft-body">
                <span className="teams-draft-name">{t.teamName}</span>
                <span className="teams-draft-count">
                  {picks.length} future picks
                </span>
                <div className="teams-draft-seasons">
                  {Array.from(bySeason.entries()).map(([season, sp]) => (
                    <div key={season} className="teams-draft-season">
                      <span className="teams-draft-year">{season}</span>
                      <span className="teams-draft-rounds">
                        {formatRoundList(sp)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
