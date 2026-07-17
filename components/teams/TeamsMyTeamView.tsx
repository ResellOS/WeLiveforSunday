"use client";

import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { TeamFranchiseCard } from "@/components/TeamsGrid";
import { TeamAvatar } from "@/components/ui/TeamAvatar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { fmtPct3, record } from "@/lib/format";
import type { TeamCardData } from "@/lib/teams/types";

export function TeamsMyTeamView({
  team,
  opponent,
}: {
  team: TeamCardData | null;
  opponent: { name: string; avatar: string | null; rosterId: number } | null;
}) {
  if (!team) {
    return (
      <Panel className="p-4 teams-empty-panel">
        <p className="teams-empty-title">My Franchise</p>
        <p className="teams-empty-message">
          Connect or identify your Sleeper account to view your franchise.
        </p>
        <p className="teams-empty-hint">
          Set <code>SLEEPER_USER_ID</code> or <code>SLEEPER_ROSTER_ID</code> in
          .env.local for development.
        </p>
      </Panel>
    );
  }

  const rest = { ...team };

  return (
    <div className="teams-my-team">
      <div className="teams-my-team-featured">
        <TeamFranchiseCard team={rest} index={0} showViewCta={false} />
        <Panel className="p-4 teams-my-team-panel">
          <h3 className="teams-view-title-sm">Franchise Snapshot</h3>
          <dl className="teams-snapshot-dl">
            <div>
              <dt>Record</dt>
              <dd>{record(team.wins, team.losses, team.ties)}</dd>
            </div>
            <div>
              <dt>Win %</dt>
              <dd>{fmtPct3(team.pct)}</dd>
            </div>
            <div>
              <dt>Power Rank</dt>
              <dd>#{team.powerRank}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <StatusBadge status={team.status} variant="teams" />
              </dd>
            </div>
            <div>
              <dt>Roster Value</dt>
              <dd>
                {team.rosterValueAvailable
                  ? team.rosterValue.toLocaleString()
                  : "Not Available Yet"}
              </dd>
            </div>
            <div>
              <dt>Avg Age</dt>
              <dd>
                {team.avgAge != null
                  ? `${team.avgAge.toFixed(1)} yrs`
                  : "Not Available Yet"}
              </dd>
            </div>
            <div>
              <dt>Draft Picks</dt>
              <dd>{team.draftCapital}</dd>
            </div>
            <div>
              <dt>Upcoming</dt>
              <dd className="teams-my-opponent">
                {opponent ? (
                  <>
                    <TeamAvatar
                      src={opponent.avatar}
                      name={opponent.name}
                      size={24}
                    />
                    <Link href={`/teams/${opponent.rosterId}`}>
                      {opponent.name}
                    </Link>
                  </>
                ) : (
                  "TBD"
                )}
              </dd>
            </div>
          </dl>
          <Link href={`/teams/${team.rosterId}`} className="teams-my-cta">
            Open Full Franchise Page →
          </Link>
        </Panel>
      </div>
    </div>
  );
}
