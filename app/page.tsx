import { getNFLState, getMatchups } from "@/lib/sleeper";
import {
  loadLeagueSnapshot,
  pairMatchups,
  effectiveWeek,
  type StandingRow,
} from "@/lib/league";
import {
  nextNflKickoff,
  pickMatchupOfWeek,
  pickClosestMatchup,
  leaguePulse,
} from "@/lib/home";
import { getLatestSeason } from "@/lib/queries";
import { TRADE_DEADLINE, ROOKIE_DRAFT_DATE } from "@/lib/config";
import { Panel, SectionHeading, EmptyState } from "@/components/ui/Panel";
import { MatchupCard } from "@/components/MatchupCard";
import { StandingsTable } from "@/components/StandingsTable";
import { Countdown } from "@/components/Countdown";
import { fmtPoints } from "@/lib/format";

// Live-ish data; re-fetch at most every 5 minutes.
export const dynamic = "force-dynamic";

function NoLeague() {
  return (
    <EmptyState
      title="League not configured"
      message="Set SLEEPER_LEAGUE_ID in .env.local to load live league data."
    />
  );
}

export default async function HomePage() {
  const leagueId = process.env.SLEEPER_LEAGUE_ID;
  if (!leagueId) return <NoLeague />;

  const [snapshot, state, latestSeason] = await Promise.all([
    loadLeagueSnapshot(leagueId),
    getNFLState(),
    getLatestSeason(),
  ]);

  const { league, standings } = snapshot;
  const week = effectiveWeek(state.week);
  const playoffTeams = league.settings.playoff_teams ?? 6;

  const entries = await getMatchups(leagueId, week).catch(() => []);
  const pairs = pairMatchups(entries ?? []);
  const live = pairs.some((p) => p.home.points > 0 || p.away.points > 0);

  const rankByRoster = new Map(standings.map((t) => [t.rosterId, t.rank]));
  const teamsByRoster = new Map<number, StandingRow>(
    standings.map((t) => [t.rosterId, t]),
  );

  const motw = pickMatchupOfWeek(pairs, rankByRoster);
  const closest = pickClosestMatchup(pairs);

  const pulse = leaguePulse(standings);
  const kickoff = nextNflKickoff(state.season_type);

  const champTeam =
    latestSeason?.champion_roster_id != null
      ? teamsByRoster.get(latestSeason.champion_roster_id)
      : undefined;

  return (
    <div className="home-dashboard">
      <div className="home-grid">
        {/* Left · 33% — Matchup of the Week / Closest / Countdowns */}
        <section className="home-col">
          <Panel className="p-4">
            <SectionHeading
              title="Matchup of the Week"
              subtitle={`Week ${week}${live ? " · live" : ""}`}
            />
            {motw ? (
              <MatchupCard pair={motw} teamsByRoster={teamsByRoster} live={live} />
            ) : (
              <EmptyState
                title="No matchups yet"
                message={`Week ${week} isn't scheduled — check back when the season kicks off.`}
              />
            )}
          </Panel>

          <Panel className="home-col-fill p-4">
            <SectionHeading title="Closest Playoff Matchup" />
            {closest ? (
              <MatchupCard
                pair={closest}
                teamsByRoster={teamsByRoster}
                live={live}
              />
            ) : (
              <EmptyState
                title="No matchups yet"
                message="Closest margins appear once games are scheduled."
              />
            )}
          </Panel>

          <Panel className="home-col-foot space-y-4 p-4">
            <SectionHeading title="Countdowns" />
            <Countdown label="Next NFL Kickoff" targetISO={kickoff.toISOString()} />
            <div className="divider-gold" />
            <Countdown
              label="Trade Deadline"
              targetISO={TRADE_DEADLINE.toISOString()}
            />
            <div className="divider-gold" />
            <Countdown
              label="Rookie Draft"
              targetISO={ROOKIE_DRAFT_DATE.toISOString()}
            />
          </Panel>
        </section>

        {/* Center · 30% — Current Standings / Sleeper News */}
        <section className="home-col">
          <Panel className="home-col-fill p-4">
            <SectionHeading
              title="Current Standings"
              subtitle={`${standings.length} teams · top ${playoffTeams} make the playoffs`}
            />
            <StandingsTable standings={standings} playoffCutoff={playoffTeams} />
          </Panel>

          <Panel className="home-col-foot space-y-3 p-4">
            <SectionHeading title="Sleeper News" />
            {pulse.length > 0 ? (
              pulse.slice(0, 3).map((line, i) => (
                <p
                  key={i}
                  className="border-l-2 border-gold/40 pl-3 text-sm text-offwhite/80"
                >
                  {line}
                </p>
              ))
            ) : (
              <p className="text-sm text-offwhite/50">
                League updates appear here once activity arrives.
              </p>
            )}
          </Panel>
        </section>

        {/* Right · 37% — This Week's Matchups / Past Champion */}
        <aside className="home-col">
          <Panel className="home-col-fill p-4">
            <SectionHeading
              title="This Week's Matchups"
              subtitle={`Week ${week}${live ? " · live" : ""}`}
            />
            {pairs.length > 0 ? (
              <div className="space-y-3">
                {pairs.map((p) => (
                  <MatchupCard
                    key={p.matchupId}
                    pair={p}
                    teamsByRoster={teamsByRoster}
                    live={live}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="Schedule not released"
                message="The weekly schedule appears here once the NFL season begins."
              />
            )}
          </Panel>

          <Panel className="home-col-foot p-4">
            <SectionHeading title="Past Champion" />
            {latestSeason ? (
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-gold">
                  {latestSeason.year} Champion
                </div>
                <div className="mt-1 font-display text-lg font-bold text-gold-metallic">
                  {champTeam?.teamName ??
                    `Roster #${latestSeason.champion_roster_id}`}
                </div>
                {latestSeason.championship_score_winner != null && (
                  <div className="mt-2 text-xs text-offwhite/50">
                    Championship score:{" "}
                    {fmtPoints(latestSeason.championship_score_winner)}
                    {latestSeason.championship_score_loser != null &&
                      ` – ${fmtPoints(latestSeason.championship_score_loser)}`}
                  </div>
                )}
              </div>
            ) : (
              <EmptyState
                title="Inaugural Champion"
                message="The first WLFS champion will be enshrined here after the 2026 season."
              />
            )}
          </Panel>
        </aside>
      </div>
    </div>
  );
}
