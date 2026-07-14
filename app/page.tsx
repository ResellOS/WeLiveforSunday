import { getNFLState, getMatchups } from "@/lib/sleeper";
import {
  loadLeagueSnapshot,
  pairMatchups,
  effectiveWeek,
  isPlayoffWeek,
  type StandingRow,
} from "@/lib/league";
import {
  nextNflKickoff,
  pickMatchupOfWeek,
  pickClosestMatchup,
  leaguePulse,
} from "@/lib/home";
import { getLatestSeason } from "@/lib/queries";
import { TRADE_DEADLINE, ROOKIE_DRAFT_DATE, LEAGUE_TAGLINE } from "@/lib/config";
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
  const closestLabel = isPlayoffWeek(week, league)
    ? "Closest Playoff Matchup"
    : "Closest Matchup";

  const pulse = leaguePulse(standings);
  const kickoff = nextNflKickoff(state.season_type);

  const champTeam =
    latestSeason?.champion_roster_id != null
      ? teamsByRoster.get(latestSeason.champion_roster_id)
      : undefined;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="text-center">
        <p className="mb-2 font-display text-xs uppercase tracking-[0.3em] text-gold">
          {league.name} · {league.season}
        </p>
        <h1 className="font-display text-3xl font-bold text-gold-metallic sm:text-5xl">
          We Live for Sundays
        </h1>
        <p className="mt-3 text-sm text-offwhite/60">{LEAGUE_TAGLINE}</p>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Featured matchups */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <SectionHeading title="Matchup of the Week" />
              {motw ? (
                <MatchupCard pair={motw} teamsByRoster={teamsByRoster} live={live} />
              ) : (
                <EmptyState
                  title="No matchups yet"
                  message={`Week ${week} isn't scheduled — check back when the season kicks off.`}
                />
              )}
            </div>
            <div>
              <SectionHeading title={closestLabel} />
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
            </div>
          </div>

          {/* Standings */}
          <Panel className="p-4">
            <SectionHeading
              title="Current Standings"
              subtitle={`${standings.length} teams · top ${playoffTeams} make the playoffs`}
            />
            <StandingsTable standings={standings} playoffCutoff={playoffTeams} />
          </Panel>

          {/* This week's matchups */}
          <Panel className="p-4">
            <SectionHeading
              title="This Week's Matchups"
              subtitle={`Week ${week}${live ? " · live" : ""}`}
            />
            {pairs.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
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
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Countdowns */}
          <Panel className="space-y-4 p-4">
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

          {/* League pulse */}
          <Panel className="space-y-3 p-4">
            <SectionHeading title="League Pulse" />
            {pulse.length > 0 ? (
              pulse.map((line, i) => (
                <p
                  key={i}
                  className="border-l-2 border-gold/40 pl-3 text-sm text-offwhite/80"
                >
                  {line}
                </p>
              ))
            ) : (
              <p className="text-sm text-offwhite/50">
                Headlines appear once the season is underway.
              </p>
            )}
          </Panel>

          {/* Past champion */}
          <Panel className="p-4">
            <SectionHeading title="Reigning Champion" />
            {latestSeason ? (
              <div className="text-center">
                <div className="text-4xl">🏆</div>
                <div className="mt-2 font-display text-lg font-bold text-gold-metallic">
                  {champTeam?.teamName ?? `Roster #${latestSeason.champion_roster_id}`}
                </div>
                <div className="text-sm text-offwhite/60">
                  {latestSeason.year} Champion
                </div>
                {latestSeason.championship_score_winner != null && (
                  <div className="mt-2 text-xs text-offwhite/50">
                    Title game:{" "}
                    {fmtPoints(latestSeason.championship_score_winner)}
                    {latestSeason.championship_score_loser != null &&
                      ` – ${fmtPoints(latestSeason.championship_score_loser)}`}
                  </div>
                )}
              </div>
            ) : (
              <EmptyState
                title="No champion crowned yet"
                message="The first WLFS champion will be enshrined here after the inaugural season."
              />
            )}
          </Panel>
        </aside>
      </div>
    </div>
  );
}
