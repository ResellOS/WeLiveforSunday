"use client";

import { TeamsGrid } from "@/components/TeamsGrid";
import { TeamsContendersView } from "@/components/teams/TeamsContendersView";
import { TeamsRebuildersView } from "@/components/teams/TeamsRebuildersView";
import { TeamsPowerRankingsView } from "@/components/teams/TeamsPowerRankingsView";
import { TeamsRosterValueView } from "@/components/teams/TeamsRosterValueView";
import { TeamsAgesView } from "@/components/teams/TeamsAgesView";
import { TeamsDraftCapitalView } from "@/components/teams/TeamsDraftCapitalView";
import { TeamsMyTeamView } from "@/components/teams/TeamsMyTeamView";
import type { TeamsView } from "@/lib/teams/views";
import type { TeamCardData } from "@/lib/teams/types";
import type { TeamMetrics } from "@/lib/teams/metrics";
import type { TeamPowerRanking } from "@/lib/teams/powerRanking";
import type { OwnedPick } from "@/lib/teams/draftCapital";

export interface TeamsPageContentProps {
  view: TeamsView;
  teams: TeamCardData[];
  powerRankings: TeamPowerRanking[];
  metricsByRoster: Record<number, TeamMetrics>;
  picksByRoster: Record<number, OwnedPick[]>;
  myTeam: TeamCardData | null;
  myTeamOpponent: {
    name: string;
    avatar: string | null;
    rosterId: number;
  } | null;
  hasKtc: boolean;
  preseason: boolean;
}

function TeamsViewBody({
  view,
  teams,
  powerRankings,
  metricsByRoster,
  picksByRoster,
  myTeam,
  myTeamOpponent,
  hasKtc,
  preseason,
}: TeamsPageContentProps) {
  const teamsById = new Map(teams.map((t) => [t.rosterId, t]));

  switch (view) {
    case "my-team":
      return <TeamsMyTeamView team={myTeam} opponent={myTeamOpponent} />;
    case "contenders":
      return <TeamsContendersView teams={teams} />;
    case "rebuilders":
      return (
        <TeamsRebuildersView teams={teams} metricsByRoster={metricsByRoster} />
      );
    case "power-rankings":
      return (
        <TeamsPowerRankingsView
          rankings={powerRankings}
          teamsById={teamsById}
          preseason={preseason}
        />
      );
    case "roster-value":
      return (
        <TeamsRosterValueView
          teams={teams}
          metricsByRoster={metricsByRoster}
          hasKtc={hasKtc}
        />
      );
    case "team-ages":
      return (
        <TeamsAgesView teams={teams} metricsByRoster={metricsByRoster} />
      );
    case "draft-capital":
      return (
        <TeamsDraftCapitalView teams={teams} picksByRoster={picksByRoster} />
      );
    case "all":
    default:
      return <TeamsGrid teams={teams} />;
  }
}

export function TeamsPageContent(props: TeamsPageContentProps) {
  return <TeamsViewBody {...props} />;
}
