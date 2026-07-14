import { TeamAvatar } from "@/components/ui/TeamAvatar";
import { fmtPoints, record } from "@/lib/format";
import type { MatchupPair, StandingRow } from "@/lib/league";

function TeamRow({
  team,
  points,
  showScore,
  winner,
}: {
  team: StandingRow | undefined;
  points: number;
  showScore: boolean;
  winner: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <TeamAvatar src={team?.avatar ?? null} name={team?.teamName ?? "TBD"} size={32} />
        <div className="min-w-0">
          <div
            className={`truncate text-sm font-semibold ${winner ? "text-gold" : "text-offwhite"}`}
          >
            {team?.teamName ?? "TBD"}
          </div>
          <div className="truncate text-xs text-offwhite/40">
            {team ? `#${team.rank} · ${record(team.wins, team.losses, team.ties)}` : ""}
          </div>
        </div>
      </div>
      {showScore && (
        <div className="font-display text-lg font-bold tabular-nums text-offwhite">
          {fmtPoints(points)}
        </div>
      )}
    </div>
  );
}

export function MatchupCard({
  pair,
  teamsByRoster,
  live,
}: {
  pair: MatchupPair;
  teamsByRoster: Map<number, StandingRow>;
  /** Whether scores are meaningful (games in progress/complete). */
  live: boolean;
}) {
  const home = teamsByRoster.get(pair.home.rosterId);
  const away = teamsByRoster.get(pair.away.rosterId);
  const homeWins = pair.home.points > pair.away.points;
  const awayWins = pair.away.points > pair.home.points;

  return (
    <div className="panel panel-hover space-y-3 p-4">
      <TeamRow
        team={home}
        points={pair.home.points}
        showScore={live}
        winner={live && homeWins}
      />
      <div className="divider-gold" />
      <TeamRow
        team={away}
        points={pair.away.points}
        showScore={live}
        winner={live && awayWins}
      />
    </div>
  );
}
