import { Panel } from "@/components/ui/Panel";
import {
  LeaderDashboard,
  type LeaderCardData,
} from "@/components/record-book/LeaderDashboard";

export function HistoryAllTimeSummary({
  franchiseCount,
  playoffTeams,
  firstChampionLabel,
}: {
  franchiseCount: number;
  playoffTeams: number;
  firstChampionLabel: string;
}) {
  const cards: LeaderCardData[] = [
    {
      key: "franchises",
      icon: "franchises",
      label: "Founding Franchises",
      value: String(franchiseCount),
      numeric: true,
    },
    {
      key: "inaugural",
      icon: "season",
      label: "Inaugural Season",
      value: "2026",
      numeric: false,
    },
    {
      key: "playoffs",
      icon: "playoffs",
      label: "Playoff Field",
      value: `${playoffTeams} Teams`,
      numeric: false,
    },
    {
      key: "reward",
      icon: "payout",
      label: "Championship Reward",
      value: "$600+",
      subtext: "Ring + Jersey",
      numeric: false,
    },
    {
      key: "champion",
      icon: "championship",
      label: "First Champion",
      value: firstChampionLabel,
      waiting: firstChampionLabel === "To Be Crowned",
      numeric: false,
    },
  ];

  return (
    <Panel className="panel--ringfeature p-4 history-alltime-panel">
      <h2 className="trophy-panel-title">All-Time Summary</h2>
      <LeaderDashboard cards={cards} />
    </Panel>
  );
}
