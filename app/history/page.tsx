import type { Metadata } from "next";
import { Suspense } from "react";
import { getSeasons, getMilestones } from "@/lib/queries";
import { loadLeagueHistory, getSeasonChain } from "@/lib/records";
import { computeAllSeasonMVPs } from "@/lib/stats";
import { Panel } from "@/components/ui/Panel";
import { TrophyGlyph } from "@/components/trophy/TrophyGlyph";
import { HistorySidebar } from "@/components/history/HistorySidebar";
import { HistoryPageContent } from "@/components/history/HistoryPageContent";
import { HistoryAllTimeSummary } from "@/components/history/HistoryAllTimeSummary";
import { HistoryNotableMoments } from "@/components/history/HistoryNotableMoments";
import {
  parseHistoryView,
  CEREMONIAL_MOMENTS,
} from "@/lib/history/views";

export const metadata: Metadata = { title: "History" };
export const dynamic = "force-dynamic";

const INAUGURAL_YEAR = 2026;

export default async function HistoryPage({
  searchParams,
}: {
  searchParams?: { view?: string };
}) {
  const view = parseHistoryView(searchParams?.view);
  const leagueId = process.env.SLEEPER_LEAGUE_ID;

  const [seasons, milestones, history, chain] = await Promise.all([
    getSeasons(),
    getMilestones(),
    leagueId ? loadLeagueHistory(leagueId) : Promise.resolve(null),
    leagueId ? getSeasonChain(leagueId) : Promise.resolve([]),
  ]);

  const mvps = await computeAllSeasonMVPs(seasons, chain);
  const mvpByYear = Object.fromEntries(
    mvps.map((m) => [m.year, m.mvp]),
  );

  const teamNames: Record<number, string> = {};
  if (history?.latestTeams) {
    for (const [id, t] of history.latestTeams) {
      teamNames[id] = t.teamName;
    }
  }

  const seasonByYear = Object.fromEntries(seasons.map((s) => [s.year, s]));
  const franchiseCount = history?.latestTeams.size || 16;
  const playoffTeams = chain[0]?.settings?.playoff_teams ?? 8;
  const completedSeasons = seasons.filter(
    (s) => s.champion_roster_id != null,
  ).length;

  const feedMoments = CEREMONIAL_MOMENTS.map((m) => ({
    title: m.title,
    detail: m.detail,
    date: null as string | null,
  }));

  const firstChampionLabel =
    completedSeasons > 0 ? "Crowned" : "To Be Crowned";

  return (
    <div className="trophy-page history-page">
      <div className="history-grid">
        <aside className="trophy-side">
          <Suspense fallback={<div className="history-sidebar-loading" />}>
            <HistorySidebar />
          </Suspense>
        </aside>

        <section className="trophy-main">
          <Panel className="panel--banner trophy-banner-body">
            <div className="trophy-banner-title">
              <span className="trophy-banner-icon" aria-hidden="true">
                <TrophyGlyph name="milestones" />
              </span>
              <div>
                <h1 className="trophy-banner-word">League History</h1>
                <p className="trophy-banner-sub">
                  Every season. Every champion. Every moment that shaped the
                  dynasty.
                </p>
              </div>
            </div>
          </Panel>

          <HistoryPageContent
            view={view}
            seasonByYear={seasonByYear}
            teamNames={teamNames}
            mvpByYear={mvpByYear}
            milestones={milestones}
          />
        </section>

        <aside className="trophy-feature">
          <HistoryAllTimeSummary
            franchiseCount={franchiseCount}
            playoffTeams={playoffTeams}
            firstChampionLabel={firstChampionLabel}
          />
          <HistoryNotableMoments moments={feedMoments} />
        </aside>
      </div>

      <Panel className="panel--legacy trophy-legacy-body history-legacy-bar">
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
            <span className="legacy-value">{INAUGURAL_YEAR}</span>
            <span className="legacy-label">Inaugural Season</span>
          </div>
        </div>
        <span className="legacy-divider" aria-hidden="true" />
        <div className="legacy-stat">
          <TrophyGlyph name="playoffs" className="legacy-glyph" />
          <div>
            <span className="legacy-value">{playoffTeams} Teams</span>
            <span className="legacy-label">Playoff Field</span>
          </div>
        </div>
        <span className="legacy-divider" aria-hidden="true" />
        <div className="legacy-stat">
          <TrophyGlyph name="payout" className="legacy-glyph" />
          <div>
            <span className="legacy-value legacy-value-sm">$600+</span>
            <span className="legacy-label">Ring + Jersey Reward</span>
          </div>
        </div>
        <span className="legacy-divider" aria-hidden="true" />
        <div className="legacy-stat">
          <TrophyGlyph name="championship" className="legacy-glyph" />
          <div>
            <span className="legacy-value legacy-value-sm">
              {firstChampionLabel}
            </span>
            <span className="legacy-label">First Champion</span>
          </div>
        </div>
      </Panel>
    </div>
  );
}
