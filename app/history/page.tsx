import type { Metadata } from "next";
import Link from "next/link";
import { getSeasons, getMilestones, getNotableMoments } from "@/lib/queries";
import { loadLeagueHistory, getSeasonChain } from "@/lib/records";
import { computeAllSeasonMVPs } from "@/lib/stats";
import { Panel, SectionHeading, EmptyState } from "@/components/ui/Panel";
import { NotableMomentsFeed } from "@/components/NotableMomentsFeed";
import { fmtPoints } from "@/lib/format";
import { format as fmtDate } from "date-fns";

export const metadata: Metadata = { title: "History" };
export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const leagueId = process.env.SLEEPER_LEAGUE_ID;

  const [seasons, milestones, moments, history, chain] = await Promise.all([
    getSeasons(),
    getMilestones(),
    getNotableMoments(),
    leagueId ? loadLeagueHistory(leagueId) : Promise.resolve(null),
    leagueId ? getSeasonChain(leagueId) : Promise.resolve([]),
  ]);

  const mvps = await computeAllSeasonMVPs(seasons, chain);
  const mvpByYear = new Map(mvps.map((m) => [m.year, m.mvp.name]));

  const champName = (rosterId: number | null) =>
    rosterId == null
      ? "—"
      : (history?.latestTeams.get(rosterId)?.teamName ?? `Roster #${rosterId}`);

  // All-time summary
  const seasonsCompleted = seasons.length;
  const differentChampions = new Set(
    seasons.map((s) => s.champion_roster_id).filter((v) => v != null),
  ).size;
  const playoffGames = history
    ? history.games.filter((g) => g.isPlayoff).length / 2
    : 0;
  const highestTitleScore = seasons
    .map((s) => s.championship_score_winner)
    .filter((v): v is number => v != null);
  const bestTitleScore = highestTitleScore.length
    ? Math.max(...highestTitleScore)
    : null;

  return (
    <div className="space-y-8">
      <SectionHeading
        title="League History"
        subtitle="Every season, champion, and milestone in WLFS lore."
        action={
          <Link
            href="/record-book"
            className="rounded-md border border-gold/40 px-3 py-1.5 text-sm font-medium text-gold transition-colors hover:bg-gold/10"
          >
            View Full Records →
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main */}
        <div className="space-y-8 lg:col-span-2">
          {/* Season timeline */}
          <div>
            <SectionHeading title="Season Timeline" />
            {seasons.length > 0 ? (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {seasons.map((s) => (
                  <div
                    key={s.id}
                    className="panel panel-hover w-48 shrink-0 p-4 text-center"
                  >
                    <div className="text-3xl">🏆</div>
                    <div className="mt-1 font-display text-lg font-bold text-gold-metallic">
                      {s.year}
                    </div>
                    <div className="mt-1 truncate text-sm text-offwhite">
                      {champName(s.champion_roster_id)}
                    </div>
                    {s.championship_score_winner != null && (
                      <div className="mt-1 text-xs text-offwhite/40">
                        {fmtPoints(s.championship_score_winner)} pts
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No seasons recorded"
                message="Add rows to the seasons table to build the timeline."
              />
            )}
          </div>

          {/* Season recaps table */}
          <div>
            <SectionHeading title="Season Recaps" />
            {seasons.length > 0 ? (
              <Panel className="overflow-x-auto p-2">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wider text-offwhite/50">
                      <th className="px-3 py-2">Season</th>
                      <th className="px-3 py-2">Champion</th>
                      <th className="px-3 py-2">Runner-Up</th>
                      <th className="px-3 py-2">Title Score</th>
                      <th className="px-3 py-2">MVP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seasons.map((s) => (
                      <tr key={s.id} className="border-t border-white/5">
                        <td className="px-3 py-2.5 font-display font-bold text-gold/80">
                          {s.year}
                        </td>
                        <td className="px-3 py-2.5">{champName(s.champion_roster_id)}</td>
                        <td className="px-3 py-2.5 text-offwhite/70">
                          {champName(s.runner_up_roster_id)}
                        </td>
                        <td className="px-3 py-2.5 tabular-nums text-offwhite/70">
                          {s.championship_score_winner != null
                            ? `${fmtPoints(s.championship_score_winner)}${
                                s.championship_score_loser != null
                                  ? ` – ${fmtPoints(s.championship_score_loser)}`
                                  : ""
                              }`
                            : "—"}
                        </td>
                        <td className="px-3 py-2.5 text-gold/90">
                          {mvpByYear.get(s.year) ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Panel>
            ) : (
              <EmptyState
                title="No recaps yet"
                message="Season recaps populate from the seasons table."
              />
            )}
          </div>

          {/* Notable moments */}
          <div>
            <SectionHeading title="Notable Moments" />
            <NotableMomentsFeed moments={moments} />
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <Panel className="p-4">
            <SectionHeading title="All-Time Summary" />
            <dl className="space-y-2 text-sm">
              <SummaryRow label="Seasons Completed" value={seasonsCompleted} />
              <SummaryRow label="Different Champions" value={differentChampions} />
              <SummaryRow label="Playoff Games" value={playoffGames} />
              <SummaryRow
                label="Highest Title Score"
                value={bestTitleScore != null ? fmtPoints(bestTitleScore) : "—"}
              />
            </dl>
          </Panel>

          <Panel className="p-4">
            <SectionHeading title="League Milestones" />
            {milestones.length > 0 ? (
              <ul className="space-y-3">
                {milestones.map((m) => (
                  <li key={m.id} className="border-l-2 border-gold/40 pl-3">
                    {m.date && (
                      <div className="text-[11px] uppercase tracking-wider text-gold/70">
                        {fmtDate(new Date(m.date), "MMM d, yyyy")}
                      </div>
                    )}
                    <div className="text-sm font-semibold text-offwhite">
                      {m.title}
                    </div>
                    {m.description && (
                      <p className="text-xs text-offwhite/60">{m.description}</p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="No milestones yet"
                message="Add rows to league_milestones to chronicle key dates."
              />
            )}
          </Panel>
        </aside>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-2">
      <dt className="text-offwhite/60">{label}</dt>
      <dd className="font-display font-bold text-gold-metallic">{value}</dd>
    </div>
  );
}
