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
  computePowerRankings,
  placeholderFantasyNews,
  buildNflScheduleBoard,
  loadNflTickerBoard,
} from "@/lib/home";
import { loadTopFantasyPerformers } from "@/lib/server/topPerformers";
import { loadLeagueActivity } from "@/lib/leagueActivity";
import { getLatestSeason } from "@/lib/queries";
import { TRADE_DEADLINE, ROOKIE_DRAFT_DATE } from "@/lib/config";
import { Panel, SectionHeading, EmptyState } from "@/components/ui/Panel";
import { StandingsTable } from "@/components/StandingsTable";
import { Countdown } from "@/components/Countdown";
import { SleeperNews } from "@/components/SleeperNews";
import Image from "next/image";
import { FeaturedModule } from "@/components/home/FeaturedModule";
import { LeagueChat } from "@/components/home/LeagueChat";
import { WeeklyMatchupsPager } from "@/components/home/WeeklyMatchupsPager";
import { NflScoreTicker } from "@/components/home/NflScoreTicker";
import { FantasyPerformersCarousel } from "@/components/home/FantasyPerformersCarousel";
import { fmtPoints } from "@/lib/format";

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
  const powerRankings = computePowerRankings(standings);
  const newsItems = placeholderFantasyNews();
  const nflBoard = await loadNflTickerBoard(state).catch(() => ({
    games: buildNflScheduleBoard(state.season_type, week),
    label: `Week ${week}`,
  }));
  const fantasyBoard = await loadTopFantasyPerformers(leagueId, week);
  const leagueActivity = await loadLeagueActivity(leagueId, week, standings);

  const kickoff = nextNflKickoff(state.season_type);

  const hasChampion =
    latestSeason?.champion_roster_id != null &&
    latestSeason.champion_roster_id > 0;
  const champTeam = hasChampion
    ? teamsByRoster.get(latestSeason!.champion_roster_id!)
    : undefined;

  return (
    <div className="home-dashboard home-page">
      <span className="home-atmosphere-vignette" aria-hidden="true" />
      <span className="home-atmosphere-particles" aria-hidden="true" />
      <span className="home-atmosphere-texture" aria-hidden="true" />
      <span className="home-atmosphere-light" aria-hidden="true" />
      <div className="home-grid">
        <Panel className="home-area-featured panel--featured p-4">
          <FeaturedModule
            motw={motw}
            teamsByRoster={teamsByRoster}
            live={live}
            week={week}
            powerRankings={powerRankings}
          />
        </Panel>

        <Panel className="home-area-countdown panel--countdown space-y-1 p-4">
          <SectionHeading title="Countdowns" />
          <Countdown
            label="Next NFL Kickoff"
            targetISO={kickoff.toISOString()}
            icon="kickoff"
          />
          <div className="divider-gold" />
          <Countdown
            label="Trade Deadline"
            targetISO={TRADE_DEADLINE.toISOString()}
            icon="trade"
          />
          <div className="divider-gold" />
          <Countdown
            label="Rookie Draft"
            targetISO={ROOKIE_DRAFT_DATE.toISOString()}
            icon="draft"
          />
        </Panel>

        <Panel className="home-area-standings panel--standings p-4">
          <SectionHeading
            title="Current Standings"
            subtitle={`${standings.length} teams · top ${playoffTeams} make the playoffs`}
            action={<span className="panel-action">View Full Standings</span>}
          />
          <StandingsTable standings={standings} playoffCutoff={playoffTeams} />
          <span className="metal-button mt-3 w-full">View Full Standings</span>
        </Panel>

        <Panel className="home-area-news panel--news p-4">
          <SectionHeading
            title="Sleeper News"
            action={<span className="panel-action">View All News</span>}
          />
          <SleeperNews items={newsItems} />
          <span className="metal-button mt-3 w-full">View All News</span>
        </Panel>

        <Panel className="home-area-matchups panel--scoreboard p-4">
          {pairs.length > 0 ? (
            <WeeklyMatchupsPager
              pairs={pairs}
              teams={standings}
              live={live}
              week={week}
            />
          ) : (
            <>
              <SectionHeading
                title="This Week's Matchups"
                subtitle={`Week ${week}${live ? " · live" : ""}`}
                action={<span className="panel-action">View All Matchups</span>}
              />
              <EmptyState
                title="Schedule not released"
                message="Featured matchups appear here once the NFL season begins."
              />
            </>
          )}
          <LeagueChat initial={leagueActivity} />
        </Panel>

        <Panel className="home-area-champion panel--champion p-4">
          <SectionHeading
            title="Past Champion"
            action={<span className="panel-action">View Champions</span>}
          />
          {hasChampion && latestSeason ? (
            <div className="inaugural-champion inaugural-champion-live">
              <div>
                <p className="inaugural-kicker">
                  {latestSeason.year} Champion
                </p>
                <p className="mt-2 font-display text-2xl font-bold text-gold-metallic">
                  {champTeam?.teamName ??
                    `Roster #${latestSeason.champion_roster_id}`}
                </p>
                {latestSeason.championship_score_winner != null && (
                  <p className="inaugural-copy">
                    Championship score:{" "}
                    {fmtPoints(latestSeason.championship_score_winner)}
                    {latestSeason.championship_score_loser != null &&
                      ` – ${fmtPoints(latestSeason.championship_score_loser)}`}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="champion-artwork-wrap">
              <Image
                src="/images/first-champion.png"
                alt="WLFS inaugural champion to be crowned after the 2026 season"
                fill
                className="champion-artwork-img"
                sizes="(min-width: 1024px) 28vw, 100vw"
                priority
              />
              <div className="champion-artwork-particles" aria-hidden="true" />
            </div>
          )}
        </Panel>
      </div>

      <div className="home-bottom-strip">
        <Panel className="home-area-ticker panel--ticker p-4">
          <NflScoreTicker games={nflBoard.games} label={nflBoard.label} />
        </Panel>
        <Panel className="home-area-performers panel--performers p-4">
          <FantasyPerformersCarousel
            performers={fantasyBoard.performers}
            label={fantasyBoard.label}
            projected={fantasyBoard.projected}
          />
        </Panel>
      </div>
    </div>
  );
}
