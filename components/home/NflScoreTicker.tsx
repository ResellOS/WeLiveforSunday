"use client";

import type { NflTickerGame } from "@/lib/nflSchedule";
import { sleeperTeamLogo } from "@/lib/sleeperMedia";

function statusClass(game: NflTickerGame): string {
  if (game.final) return "nfl-score-card nfl-score-final";
  if (game.redZone) return "nfl-score-card nfl-score-rz";
  if (game.pregame) return "nfl-score-card nfl-score-pregame";
  if (game.quarter?.toLowerCase().includes("half")) return "nfl-score-card nfl-score-half";
  return "nfl-score-card nfl-score-live";
}

function GameCard({ game }: { game: NflTickerGame }) {
  const pregame =
    game.pregame ||
    (game.final === false &&
      game.awayScore === 0 &&
      game.homeScore === 0 &&
      !game.quarter?.match(/^\d/));
  const possAway = game.possession === "away";
  const possHome = game.possession === "home";

  let statusLabel = "";
  let statusTone = "";
  if (game.final) {
    statusLabel = "FINAL";
    statusTone = "nfl-score-status-final";
  } else if (pregame) {
    statusLabel = game.kickoff ?? game.clock ?? "Scheduled";
    statusTone = "nfl-score-status-pregame";
  } else if (game.quarter?.toLowerCase().includes("half")) {
    statusLabel = "HALFTIME";
    statusTone = "nfl-score-status-half";
  } else {
    statusLabel = [game.quarter, game.clock].filter(Boolean).join(" · ");
    statusTone = "nfl-score-status-live";
  }

  return (
    <article className={statusClass(game)}>
      <div className="nfl-score-teams">
        <div className={possAway ? "nfl-score-team nfl-score-team-poss" : "nfl-score-team"}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={sleeperTeamLogo(game.away)} alt="" className="nfl-score-logo" />
          <span className="nfl-score-abbr">{game.away}</span>
          <span className="nfl-score-pts">{pregame ? "—" : game.awayScore}</span>
        </div>
        <span className="nfl-score-at">@</span>
        <div className={possHome ? "nfl-score-team nfl-score-team-poss" : "nfl-score-team"}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={sleeperTeamLogo(game.home)} alt="" className="nfl-score-logo" />
          <span className="nfl-score-abbr">{game.home}</span>
          <span className="nfl-score-pts">{pregame ? "—" : game.homeScore}</span>
        </div>
      </div>
      <div className="nfl-score-meta">
        <span className={`nfl-score-status ${statusTone}`}>{statusLabel}</span>
        {game.redZone && !game.final && !pregame && (
          <span className="nfl-score-rz-badge">RZ</span>
        )}
        {pregame && game.network && (
          <span className="nfl-score-network">{game.network}</span>
        )}
        {game.touchdown && <span className="nfl-score-td">TD</span>}
      </div>
    </article>
  );
}

export function NflScoreTicker({
  games,
  label,
}: {
  games: NflTickerGame[];
  label?: string;
}) {
  if (games.length === 0) {
    return (
      <div className="nfl-scores-board">
        <div className="nfl-scores-header">
          <h3 className="nfl-ticker-title">NFL Schedule</h3>
        </div>
        <p className="nfl-scores-empty">No games scheduled for this week.</p>
      </div>
    );
  }

  const cols = 5;
  const rows = Math.ceil(games.length / cols);

  return (
    <div className="nfl-scores-board">
      <div className="nfl-scores-header">
        <h3 className="nfl-ticker-title">NFL Live Scores</h3>
        <span className="nfl-scores-live-pill">
          <span className="live-badge-dot" />
          {label ?? "SCHEDULE"}
        </span>
      </div>
      <div
        className="nfl-scores-grid"
        style={{ gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }}
      >
        {games.map((g) => (
          <GameCard key={g.id} game={g} />
        ))}
      </div>
    </div>
  );
}
