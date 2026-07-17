"use client";

import { TeamAvatar } from "@/components/ui/TeamAvatar";
import { record } from "@/lib/format";
import type { TeamPowerRanking } from "@/lib/teams/powerRanking";
import type { TeamCardData } from "@/lib/teams/types";

function DeltaGlyph({ delta }: { delta: number }) {
  if (delta > 0) {
    return (
      <span className="teams-power-delta teams-power-delta--up" aria-label="Trending up">
        ▲
      </span>
    );
  }
  if (delta < 0) {
    return (
      <span className="teams-power-delta teams-power-delta--down" aria-label="Trending down">
        ▼
      </span>
    );
  }
  return <span className="teams-power-delta teams-power-delta--flat">—</span>;
}

export function TeamsPowerRankingsView({
  rankings,
  teamsById,
  preseason,
}: {
  rankings: TeamPowerRanking[];
  teamsById: Map<number, TeamCardData>;
  preseason: boolean;
}) {
  return (
    <div className="teams-power-view">
      <div className="teams-power-view-header">
        <div>
          <h2 className="teams-view-title">
            {preseason ? "Preseason Power Ranking" : "Power Rankings"}
          </h2>
          <p className="teams-view-sub">
            Composite index from record, scoring, dynasty assets, starters, and momentum
          </p>
        </div>
        <details className="teams-power-tooltip">
          <summary>Formula</summary>
          <p>
            Each component is normalized 0–100, then weighted: record, points for,
            elite dynasty assets (top KTC values by position), positional starter
            strength, and weekly momentum. Preseason rankings lean on roster strength.
          </p>
        </details>
      </div>

      <div className="teams-power-table">
        <div className="teams-power-table-head" aria-hidden="true">
          <span>#</span>
          <span />
          <span>Franchise</span>
          <span>Record</span>
          <span>Driver</span>
          <span>Move</span>
          <span>Score</span>
        </div>
        {rankings.map((r) => {
          const t = teamsById.get(r.rosterId);
          if (!t) return null;
          const tier =
            r.rank === 1
              ? "gold"
              : r.rank === 2
                ? "silver"
                : r.rank === 3
                  ? "bronze"
                  : null;
          return (
            <a
              key={r.rosterId}
              href={`/teams/${r.rosterId}`}
              className={[
                "teams-power-row",
                tier && `teams-power-row--${tier}`,
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <span className="teams-power-rank">{r.rank}</span>
              <TeamAvatar src={t.avatar} name={t.teamName} size={36} />
              <span className="teams-power-team">{t.teamName}</span>
              <span className="teams-power-record">
                {record(t.wins, t.losses, t.ties)}
              </span>
              <span className="teams-power-driver">{r.summary}</span>
              <DeltaGlyph delta={r.delta} />
              <span className="teams-power-score">{r.score.toFixed(1)}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
