import type { Metadata } from "next";
import { Suspense } from "react";
import { getSeasons, getJerseys } from "@/lib/queries";
import { loadLeagueHistory, getSeasonChain } from "@/lib/records";
import { ChampionshipHistoryLink } from "@/components/trophy-room/ChampionshipHistory";
import { Panel } from "@/components/ui/Panel";
import { TrophyGlyph } from "@/components/trophy/TrophyGlyph";
import { TrophyRoomSidebar } from "@/components/trophy-room/TrophyRoomSidebar";
import { CareerEarningsExhibit } from "@/components/trophy-room/CareerEarningsExhibit";
import { LeagueLegacyExhibit } from "@/components/trophy-room/LeagueLegacyExhibit";
import { TrophyRoomMainContent } from "@/components/trophy-room/TrophyRoomMainContent";
import { DynastyMilestones } from "@/components/trophy-room/DynastyMilestones";
import { DynastyMoments } from "@/components/trophy-room/DynastyMoments";
import { parseTrophyView } from "@/lib/trophy-room/views";

export const metadata: Metadata = { title: "Trophy Room" };
export const dynamic = "force-dynamic";

export default async function TrophyRoomPage({
  searchParams,
}: {
  searchParams?: { view?: string };
}) {
  const view = parseTrophyView(searchParams?.view);
  const leagueId = process.env.SLEEPER_LEAGUE_ID;

  const [seasons, jerseys, history, chain] = await Promise.all([
    getSeasons(),
    getJerseys(),
    leagueId ? loadLeagueHistory(leagueId) : Promise.resolve(null),
    leagueId ? getSeasonChain(leagueId) : Promise.resolve([]),
  ]);

  const teamNames: Record<number, string> = {};
  if (history?.latestTeams) {
    for (const [id, t] of history.latestTeams) {
      teamNames[id] = t.teamName;
    }
  }

  const championByYear = Object.fromEntries(
    seasons
      .filter((s) => s.champion_roster_id != null || s.year === 2026)
      .map((s) => [s.year, { champion_roster_id: s.champion_roster_id }]),
  );
  if (!championByYear[2026]) {
    championByYear[2026] = { champion_roster_id: null };
  }

  const jerseyByYear = Object.fromEntries(
    jerseys
      .filter((j) => j.season_year != null)
      .map((j) => [j.season_year as number, j]),
  );

  const franchiseCount = history?.latestTeams.size || 16;
  const playoffTeams = chain[0]?.settings?.playoff_teams ?? 8;

  return (
    <div className="trophy-page trophy-room-page tr-polish">
      <Panel className="panel--banner trophy-banner-body tr-panel-enter">
        <div className="trophy-banner-title">
          <div>
            <h1 className="trophy-banner-word">Trophy Room</h1>
            <p className="trophy-banner-sub">
              Honoring the champions. Preserving the history. Building the
              dynasty.
            </p>
          </div>
        </div>
        <ChampionshipHistoryLink>View Championship History</ChampionshipHistoryLink>
      </Panel>

      <div className="trophy-grid">
        <aside className="trophy-side">
          <Suspense fallback={<div className="tr-sidebar-loading" />}>
            <TrophyRoomSidebar />
          </Suspense>
          <CareerEarningsExhibit />
          <LeagueLegacyExhibit />
        </aside>

        <section className="trophy-main">
          <TrophyRoomMainContent
            view={view}
            championByYear={championByYear}
            jerseyByYear={jerseyByYear}
            teamNames={teamNames}
          />
        </section>

        <aside className="trophy-feature">
          <DynastyMilestones />
          <DynastyMoments />
        </aside>
      </div>

      <Panel className="panel--legacy trophy-legacy-body tr-legacy-bar">
        <div className="legacy-stat">
          <TrophyGlyph name="franchises" className="legacy-glyph" />
          <div>
            <span className="legacy-value">{franchiseCount}</span>
            <span className="legacy-label">Founding Franchises</span>
          </div>
        </div>
        <span className="legacy-divider" aria-hidden="true" />
        <div className="legacy-stat">
          <TrophyGlyph name="season" className="legacy-glyph" />
          <div>
            <span className="legacy-value">1</span>
            <span className="legacy-label">Inaugural Season</span>
          </div>
        </div>
        <span className="legacy-divider" aria-hidden="true" />
        <div className="legacy-stat">
          <TrophyGlyph name="playoffs" className="legacy-glyph" />
          <div>
            <span className="legacy-value">{playoffTeams}</span>
            <span className="legacy-label">Playoff Teams</span>
          </div>
        </div>
        <span className="legacy-divider" aria-hidden="true" />
        <div className="legacy-stat">
          <TrophyGlyph name="payout" className="legacy-glyph" />
          <div>
            <span className="legacy-value">$600+</span>
            <span className="legacy-label">Championship Payout</span>
          </div>
        </div>
        <span className="legacy-divider" aria-hidden="true" />
        <div className="legacy-stat">
          <TrophyGlyph name="legacy" className="legacy-glyph" />
          <div>
            <span className="legacy-value">1</span>
            <span className="legacy-label">Legacy To Begin</span>
          </div>
        </div>
      </Panel>
    </div>
  );
}
