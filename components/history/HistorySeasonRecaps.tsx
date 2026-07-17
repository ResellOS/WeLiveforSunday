import { Panel } from "@/components/ui/Panel";
import { fmtPoints } from "@/lib/format";
import { teamAccentColor } from "@/lib/teamColor";
import { sleeperPlayerThumb } from "@/lib/sleeperMedia";
import type { SeasonRow } from "@/lib/queries";

const VAULT_YEARS = [2026, 2027, 2028, 2029];
const INAUGURAL_YEAR = 2026;

export function HistorySeasonRecaps({
  seasonByYear,
  teamName,
  mvpByYear,
}: {
  seasonByYear: Map<number, SeasonRow>;
  teamName: (rosterId: number | null | undefined) => string | null;
  mvpByYear: Map<
    number,
    { playerId: string; name: string } | undefined
  >;
}) {
  return (
    <Panel className="panel--jerseys p-4">
      <div className="section-heading">
        <div>
          <h2 className="section-title">Season Recaps</h2>
          <p className="section-subtitle">
            One row per season, recorded as history is written
          </p>
        </div>
      </div>
      <div className="recap-table">
        <table>
          <thead>
            <tr>
              <th>Season</th>
              <th>Champion</th>
              <th>Runner-Up</th>
              <th>Championship Score</th>
              <th>League MVP</th>
              <th>Highest Scorer</th>
            </tr>
          </thead>
          <tbody>
            {VAULT_YEARS.map((year) => {
              const s = seasonByYear.get(year);
              const champ = teamName(s?.champion_roster_id);
              const runnerUp = teamName(s?.runner_up_roster_id);
              const isInaugural = year === INAUGURAL_YEAR;
              const score =
                s?.championship_score_winner != null
                  ? `${fmtPoints(s.championship_score_winner)}${
                      s.championship_score_loser != null
                        ? ` – ${fmtPoints(s.championship_score_loser)}`
                        : ""
                    }`
                  : null;

              return (
                <tr key={year} className="recap-row">
                  <td className="recap-year">{year}</td>
                  <td>
                    {champ ? (
                      <span
                        className="recap-champion"
                        style={{ color: teamAccentColor(champ) }}
                      >
                        {champ}
                      </span>
                    ) : (
                      <span className="recap-tbd">
                        {isInaugural
                          ? "Season In Progress"
                          : "Awaiting Champion"}
                      </span>
                    )}
                  </td>
                  <td>
                    {runnerUp ? (
                      <span
                        className="recap-runner"
                        style={{ color: teamAccentColor(runnerUp) }}
                      >
                        {runnerUp}
                      </span>
                    ) : (
                      <span className="recap-tbd">To Be Determined</span>
                    )}
                  </td>
                  <td>
                    {score ? (
                      <span className="recap-score">{score}</span>
                    ) : (
                      <span className="recap-tbd">
                        {isInaugural
                          ? "History Begins This Fall"
                          : "To Be Determined"}
                      </span>
                    )}
                  </td>
                  <td>
                    {(() => {
                      const mvp = mvpByYear.get(year);
                      if (!mvp) {
                        return (
                          <span className="recap-tbd">
                            {isInaugural
                              ? "Awaiting First Season"
                              : "To Be Determined"}
                          </span>
                        );
                      }
                      return (
                        <span className="recap-mvp">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={sleeperPlayerThumb(mvp.playerId)}
                            alt=""
                            className="recap-mvp-thumb"
                          />
                          {mvp.name}
                        </span>
                      );
                    })()}
                  </td>
                  <td>
                    <span className="recap-tbd">
                      {isInaugural
                        ? "Season In Progress"
                        : "To Be Determined"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
