"use client";

import { MatchupCard } from "@/components/MatchupCard";
import { PowerRankings } from "@/components/home/PowerRankings";
import type { MatchupPair, StandingRow } from "@/lib/league";
import type { PowerRankingEntry } from "@/lib/home";

export function FeaturedModule({
  motw,
  teamsByRoster,
  live,
  week,
  powerRankings,
}: {
  motw: MatchupPair | null;
  teamsByRoster: Map<number, StandingRow>;
  live: boolean;
  week: number;
  powerRankings: PowerRankingEntry[];
}) {
  return (
    <div className="featured-module">
      <div className="featured-hero">
        <span className="featured-hero-glow" aria-hidden="true" />
        <span className="featured-hero-particles" aria-hidden="true" />
        <span className="featured-hero-sweep" aria-hidden="true" />
        <span className="featured-hero-stadium" aria-hidden="true" />
        <div className="featured-hero-heading">
          <span className="featured-hero-kicker">Matchup of the Week</span>
          <span className="featured-hero-week">
            Week {week}
            {live ? " · LIVE" : ""}
          </span>
        </div>
        {motw ? (
          <MatchupCard
            pair={motw}
            teamsByRoster={teamsByRoster}
            live={live}
            variant="featured"
          />
        ) : (
          <p className="featured-empty">Matchups appear when the season kicks off.</p>
        )}
      </div>
      <div className="featured-divider" aria-hidden="true" />
      <PowerRankings entries={powerRankings} />
    </div>
  );
}
