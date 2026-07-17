"use client";

import Link from "next/link";
import { TeamAvatar } from "@/components/ui/TeamAvatar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { fmtPct3, record } from "@/lib/format";
import { teamAccentColor } from "@/lib/teamColor";
import type { TeamCardData } from "@/lib/teams/types";

export function TeamDetailHeader({ team }: { team: TeamCardData }) {
  const accent = teamAccentColor(team.teamName);

  return (
    <header
      className="team-detail-header"
      style={{ "--team-accent": accent } as React.CSSProperties}
    >
      <span className="team-detail-header-glow" aria-hidden="true" />
      <span className="team-detail-header-particles" aria-hidden="true" />

      <Link href="/teams" className="team-detail-back">
        ← Back to Teams
      </Link>

      <div className="team-detail-header-main">
        <TeamAvatar
          src={team.avatar}
          name={team.teamName}
          size={96}
          className="team-detail-logo"
        />
        <div className="team-detail-header-info">
          <h1 className="team-detail-name" style={{ color: accent }}>
            {team.teamName}
          </h1>
          <p className="team-detail-manager">
            {team.managerName} · @{team.managerName}
          </p>
          <div className="team-detail-header-badges">
            <span className="team-detail-rank">#{team.powerRank} Power</span>
            <StatusBadge status={team.status} variant="teams" />
          </div>
          <div className="team-detail-header-stats">
            <span>{record(team.wins, team.losses, team.ties)}</span>
            <span>{fmtPct3(team.pct)}</span>
            <span>{team.powerScore.toFixed(1)} PWR</span>
          </div>
        </div>
      </div>
    </header>
  );
}
