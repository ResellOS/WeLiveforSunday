import { Panel } from "@/components/ui/Panel";
import { fmtPct3, fmtPoints, record } from "@/lib/format";
import type { TeamCardData } from "@/lib/teams/types";
import type { TeamMetrics } from "@/lib/teams/metrics";
import type { ScheduleEntry } from "@/lib/teams/schedule";

export function TeamSnapshotPanel({
  team,
  metrics,
  schedule,
}: {
  team: TeamCardData;
  metrics: TeamMetrics;
  schedule: ScheduleEntry[];
}) {
  const played = schedule.filter(
    (s) => s.teamScore != null && s.result !== "bye",
  );
  const scores = played.map((s) => s.teamScore!);
  const avgWeekly =
    scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : null;
  const highWeekly = scores.length > 0 ? Math.max(...scores) : null;
  const games = team.wins + team.losses + team.ties;

  return (
    <Panel className="p-4 team-detail-panel team-detail-snapshot">
      <h2 className="team-detail-panel-title">Team Snapshot</h2>
      <dl className="teams-snapshot-dl teams-snapshot-dl--detail">
        <div>
          <dt>Standing</dt>
          <dd>#{team.rank}</dd>
        </div>
        <div>
          <dt>Record</dt>
          <dd>{record(team.wins, team.losses, team.ties)}</dd>
        </div>
        <div>
          <dt>Win %</dt>
          <dd>{fmtPct3(team.pct)}</dd>
        </div>
        <div>
          <dt>Points For</dt>
          <dd>{fmtPoints(team.pointsFor)}</dd>
        </div>
        <div>
          <dt>Points Against</dt>
          <dd>{fmtPoints(team.pointsAgainst)}</dd>
        </div>
        <div>
          <dt>Avg Weekly</dt>
          <dd>
            {avgWeekly != null ? fmtPoints(avgWeekly) : "Not Available Yet"}
          </dd>
        </div>
        <div>
          <dt>High Week</dt>
          <dd>
            {highWeekly != null ? fmtPoints(highWeekly) : "Not Available Yet"}
          </dd>
        </div>
        <div>
          <dt>Playoff Odds</dt>
          <dd>Not Available Yet</dd>
        </div>
        <div>
          <dt>Roster Age</dt>
          <dd>
            {metrics.ages.overall != null
              ? `${metrics.ages.overall.toFixed(1)} yrs`
              : "Not Available Yet"}
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
          <dt>Future Picks</dt>
          <dd>{metrics.draftPickCount}</dd>
        </div>
        <div>
          <dt>Championships</dt>
          <dd>
            {team.championships > 0
              ? team.championships
              : games === 0
                ? "Inaugural Season"
                : "0"}
          </dd>
        </div>
      </dl>
    </Panel>
  );
}
