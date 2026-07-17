"use client";

import { LeaderDashboard, type LeaderCardData } from "@/components/record-book/LeaderDashboard";
import { fmtPoints } from "@/lib/format";
import type { LeagueHonors } from "@/lib/stats";

export function FranchiseHonors({ honors }: { honors: LeagueHonors }) {
  const cards: LeaderCardData[] = [
    {
      key: "championships",
      icon: "championship",
      label: "Championships",
      value:
        honors.totalChampionships > 0
          ? String(honors.totalChampionships)
          : "Waiting for History",
      subtext:
        honors.totalChampionships > 0 ? "Won Since 2026" : "Inaugural Season",
      numeric: honors.totalChampionships > 0,
      waiting: honors.totalChampionships === 0,
    },
    {
      key: "mvp",
      icon: "leagueMvp",
      label: "MVP Winners",
      value:
        honors.mvpWinners > 0 ? String(honors.mvpWinners) : "Waiting for History",
      subtext:
        honors.mvpWinners > 0 ? "Multiple Winners" : "Awaiting First Season",
      numeric: honors.mvpWinners > 0,
      waiting: honors.mvpWinners === 0,
    },
    {
      key: "highest-finish",
      icon: "runnerUp",
      label: "Highest Finish",
      value: honors.totalChampionships > 0 ? "Champion" : "—",
      subtext: honors.totalChampionships > 0 ? "League Title" : "To Be Determined",
      waiting: honors.totalChampionships === 0,
    },
    {
      key: "highest-score",
      icon: "mostPointsWeek",
      label: "Highest Season Score",
      value:
        honors.highestSeasonScore != null
          ? fmtPoints(honors.highestSeasonScore)
          : "—",
      subtext:
        honors.highestSeasonScore != null ? "Title Game High" : "Awaiting History",
      numeric: honors.highestSeasonScore != null,
      waiting: honors.highestSeasonScore == null,
    },
    {
      key: "reward",
      icon: "payout",
      label: "Champion Reward",
      value: "$600+",
      subtext: "Ring + Jersey",
      numeric: false,
    },
  ];

  return (
    <div className="teams-honors">
      <div className="section-heading teams-honors-heading">
        <div>
          <h2 className="section-title">Franchise Honors</h2>
          <p className="section-subtitle">
            League milestones etched into the dynasty ledger
          </p>
        </div>
      </div>
      <LeaderDashboard cards={cards} />
    </div>
  );
}
