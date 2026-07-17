"use client";

import { TeamAvatar } from "@/components/ui/TeamAvatar";
import { record } from "@/lib/format";
import type { PowerRankingEntry } from "@/lib/home";

function DeltaGlyph({ delta }: { delta: number }) {
  if (delta > 0) {
    return (
      <span className="power-delta power-delta-up" aria-label="Trending up">
        ▲
      </span>
    );
  }
  if (delta < 0) {
    return (
      <span className="power-delta power-delta-down" aria-label="Trending down">
        ▼
      </span>
    );
  }
  return <span className="power-delta power-delta-flat">—</span>;
}

export function PowerRankings({ entries }: { entries: PowerRankingEntry[] }) {
  return (
    <div className="power-rankings">
      <div className="power-rankings-header">
        <span className="power-rankings-title">Power Rankings</span>
        <span className="power-rankings-badge">Official WLFS Index</span>
      </div>
      <div className="power-rankings-viewport">
        <div className="power-rankings-list">
          {entries.map((e) => {
            const tier =
              e.rank === 1
                ? "gold"
                : e.rank === 2
                  ? "silver"
                  : e.rank === 3
                    ? "bronze"
                    : null;
            return (
              <div
                key={e.team.rosterId}
                className={[
                  "power-rank-row",
                  tier && `power-rank-row-${tier}`,
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <span className="power-rank-num">{e.rank}</span>
                <TeamAvatar
                  src={e.team.avatar}
                  name={e.team.teamName}
                  size={30}
                />
                <span className="power-rank-team truncate">{e.team.teamName}</span>
                <span className="power-rank-record">
                  {record(e.team.wins, e.team.losses, e.team.ties)}
                </span>
                <DeltaGlyph delta={e.delta} />
                <span className="power-rank-score">
                  {Math.round(e.score)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
