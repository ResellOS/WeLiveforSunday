import { TeamAvatar } from "@/components/ui/TeamAvatar";
import { fmtPoints, record } from "@/lib/format";
import type { MatchupPair, StandingRow } from "@/lib/league";

function TeamIdentity({
  team,
  side,
  size,
  featured,
  winner,
}: {
  team: StandingRow | undefined;
  side: "home" | "away";
  size: number;
  featured?: boolean;
  winner?: boolean;
}) {
  const seed = team?.rank != null ? `#${team.rank}` : "";
  const rec = team ? record(team.wins, team.losses, team.ties) : "";

  return (
    <div
      className={[
        `matchup-team matchup-team-${side}`,
        winner && "matchup-team-winner",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <TeamAvatar
        src={team?.avatar ?? null}
        name={team?.teamName ?? "TBD"}
        size={size}
      />
      <div className="min-w-0">
        <div className="truncate matchup-team-name">
          {team?.teamName ?? "TBD"}
        </div>
        <div className="truncate matchup-team-record">
          {featured
            ? [seed, rec].filter(Boolean).join(" · ")
            : [rec, seed].filter(Boolean).join(" · ")}
        </div>
      </div>
    </div>
  );
}

function SpotlightTeam({
  team,
  winner,
  size,
}: {
  team: StandingRow | undefined;
  winner: boolean;
  size: number;
}) {
  const seed = team?.rank != null ? `#${team.rank}` : "";
  const rec = team ? record(team.wins, team.losses, team.ties) : "";

  return (
    <div
      className={[
        "matchup-premium-team",
        winner && "matchup-premium-team-winner",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="matchup-premium-avatar">
        <TeamAvatar
          src={team?.avatar ?? null}
          name={team?.teamName ?? "TBD"}
          size={size}
        />
      </div>
      <span className="matchup-premium-name truncate">
        {team?.teamName ?? "TBD"}
      </span>
      <span className="matchup-premium-record truncate">
        {[seed, rec].filter(Boolean).join(" · ")}
      </span>
    </div>
  );
}

export function MatchupCard({
  pair,
  teamsByRoster,
  live,
  variant = "compact",
}: {
  pair: MatchupPair;
  teamsByRoster: Map<number, StandingRow>;
  /** Whether scores are meaningful (games in progress/complete). */
  live: boolean;
  variant?: "featured" | "hero" | "spotlight" | "compact";
}) {
  const home = teamsByRoster.get(pair.home.rosterId);
  const away = teamsByRoster.get(pair.away.rosterId);
  const margin = Math.abs(pair.home.points - pair.away.points);
  const avatarSize =
    variant === "featured"
      ? 80
      : variant === "spotlight"
        ? 96
        : variant === "hero"
          ? 56
          : 36;

  const featured =
    variant === "featured" || variant === "hero" || variant === "spotlight";

  const homeWins = pair.home.points > pair.away.points;
  const awayWins = pair.away.points > pair.home.points;
  const showWinner =
    featured && (homeWins || awayWins) && pair.home.points !== pair.away.points;

  if (variant === "spotlight") {
    return (
      <article className="matchup-premium-card">
        <span className="matchup-premium-sheen" aria-hidden="true" />
        <span className="matchup-premium-glow" aria-hidden="true" />
        <div className="matchup-premium-body">
          <SpotlightTeam
            team={home}
            winner={showWinner && homeWins}
            size={avatarSize}
          />
          <div className="matchup-premium-center">
            <span className="matchup-score-label">
              {live ? "Live Score" : "Projected Score"}
            </span>
            <div className="matchup-premium-scores" aria-label="Matchup score">
              <span
                className={
                  showWinner && homeWins
                    ? "matchup-premium-score matchup-score-fav"
                    : showWinner && awayWins
                      ? "matchup-premium-score matchup-score-dog"
                      : "matchup-premium-score"
                }
              >
                {fmtPoints(pair.home.points)}
              </span>
              <span className="matchup-premium-score-sep" aria-hidden="true">
                —
              </span>
              <span
                className={
                  showWinner && awayWins
                    ? "matchup-premium-score matchup-score-fav"
                    : showWinner && homeWins
                      ? "matchup-premium-score matchup-score-dog"
                      : "matchup-premium-score"
                }
              >
                {fmtPoints(pair.away.points)}
              </span>
            </div>
            <div className="matchup-premium-margin">
              <span className="matchup-premium-margin-label">
                {live ? "Current Margin" : "Projected Margin"}
              </span>
              <span
                className={[
                  "matchup-margin-value",
                  homeWins || awayWins
                    ? "matchup-margin-positive"
                    : "matchup-margin-neutral",
                ].join(" ")}
              >
                {fmtPoints(margin)}
              </span>
            </div>
          </div>
          <SpotlightTeam
            team={away}
            winner={showWinner && awayWins}
            size={avatarSize}
          />
        </div>
        <span className="matchup-cta metal-button">View Matchup Preview</span>
      </article>
    );
  }

  return (
    <div className={`matchup-card matchup-card-${variant}`}>
      <TeamIdentity
        team={home}
        side="home"
        size={avatarSize}
        featured={featured}
        winner={showWinner && homeWins}
      />
      <div className="matchup-scoreboard">
        {featured && (
          <span className="matchup-score-label">
            {live ? "Live Score" : "Projected Score"}
          </span>
        )}
        <div className="matchup-score-line">
          <span
            className={
              showWinner && homeWins
                ? "matchup-score-cell matchup-score-fav"
                : showWinner && awayWins
                  ? "matchup-score-cell matchup-score-dog"
                  : "matchup-score-cell"
            }
          >
            <span>{fmtPoints(pair.home.points)}</span>
            {variant === "compact" && (
              <span className="matchup-score-sub">{live ? "Live" : "Proj"}</span>
            )}
            {featured && showWinner && homeWins && (
              <span className="matchup-fav-tag">FAV</span>
            )}
            {featured && showWinner && awayWins && (
              <span className="matchup-dog-tag">DOG</span>
            )}
          </span>
          <span className="matchup-versus">VS</span>
          <span
            className={
              showWinner && awayWins
                ? "matchup-score-cell matchup-score-fav"
                : showWinner && homeWins
                  ? "matchup-score-cell matchup-score-dog"
                  : "matchup-score-cell"
            }
          >
            <span>{fmtPoints(pair.away.points)}</span>
            {variant === "compact" && (
              <span className="matchup-score-sub">{live ? "Live" : "Proj"}</span>
            )}
            {featured && showWinner && awayWins && (
              <span className="matchup-fav-tag">FAV</span>
            )}
            {featured && showWinner && homeWins && (
              <span className="matchup-dog-tag">DOG</span>
            )}
          </span>
        </div>
        {featured && (
          <span className="matchup-margin">
            <span className="matchup-margin-value">{fmtPoints(margin)}</span>
            <span>{live ? "Current Margin" : "Proj. Margin"}</span>
          </span>
        )}
      </div>
      <TeamIdentity
        team={away}
        side="away"
        size={avatarSize}
        featured={featured}
        winner={showWinner && awayWins}
      />
      {featured && (
        <span className="matchup-cta metal-button">View Matchup Preview</span>
      )}
    </div>
  );
}
