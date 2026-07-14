import type { Metadata } from "next";
import { getSeasons, getKtcValueMap, getNotableMoments } from "@/lib/queries";
import { getAllPlayers, getTransactions } from "@/lib/sleeper";
import type { PlayerMap } from "@/types/sleeper";
import {
  loadTradeStats,
  careerWins,
  careerPointsFor,
  playoffWins,
  topWeeklyScores,
  bottomWeeklyScores,
  biggestBlowouts,
  longestWinStreaks,
  type LeaderRow,
  type GameRecord,
} from "@/lib/records";
import { Panel, SectionHeading, EmptyState } from "@/components/ui/Panel";
import { fmtPoints } from "@/lib/format";
import { playerName } from "@/lib/sleeper";

export const metadata: Metadata = { title: "Record Book" };
export const dynamic = "force-dynamic";

/* --- small presentational helpers --- */

function LeaderList({
  title,
  rows,
  unit,
  limit = 5,
}: {
  title: string;
  rows: LeaderRow[];
  unit?: string;
  limit?: number;
}) {
  const top = rows.filter((r) => r.value > 0).slice(0, limit);
  return (
    <Panel className="p-4">
      <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-gold">
        {title}
      </h3>
      {top.length > 0 ? (
        <ol className="space-y-1.5 text-sm">
          {top.map((r, i) => (
            <li key={r.rosterId} className="flex items-center justify-between gap-2">
              <span className="truncate">
                <span className="mr-2 text-offwhite/40">{i + 1}.</span>
                {r.teamName}
              </span>
              <span className="shrink-0 font-display font-bold text-offwhite">
                {r.value.toLocaleString()}
                {unit ? ` ${unit}` : ""}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-xs text-offwhite/40">No data yet.</p>
      )}
    </Panel>
  );
}

function GameRecordList({
  title,
  rows,
  limit = 5,
}: {
  title: string;
  rows: GameRecord[];
  limit?: number;
}) {
  const top = rows.slice(0, limit);
  return (
    <Panel className="p-4">
      <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-gold">
        {title}
      </h3>
      {top.length > 0 ? (
        <ol className="space-y-1.5 text-sm">
          {top.map((r, i) => (
            <li key={`${r.rosterId}-${r.season}-${r.week}`} className="flex items-center justify-between gap-2">
              <span className="truncate">
                <span className="mr-2 text-offwhite/40">{i + 1}.</span>
                {r.teamName}
                <span className="ml-1 text-xs text-offwhite/40">
                  {r.season} Wk {r.week}
                </span>
              </span>
              <span className="shrink-0 font-display font-bold text-offwhite">
                {r.detail ?? `${fmtPoints(r.points)} pts`}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-xs text-offwhite/40">No data yet.</p>
      )}
    </Panel>
  );
}

export default async function RecordBookPage() {
  const leagueId = process.env.SLEEPER_LEAGUE_ID;

  if (!leagueId) {
    return (
      <EmptyState
        title="League not configured"
        message="Set SLEEPER_LEAGUE_ID in .env.local to compute records."
      />
    );
  }

  const [tradeStats, seasons, ktc, players, comebackMoments] = await Promise.all([
    loadTradeStats(leagueId),
    getSeasons(),
    getKtcValueMap(),
    getAllPlayers().catch((): PlayerMap => ({})),
    getNotableMoments("comeback"),
  ]);

  const { history, mostTrades, mostPlayersTraded } = tradeStats;

  // All-time leaders
  const wins = careerWins(history);
  const pf = careerPointsFor(history);
  const poWins = playoffWins(history);

  // Championships leader from the seasons table.
  const champCounts = new Map<number, number>();
  for (const s of seasons) {
    if (s.champion_roster_id != null) {
      champCounts.set(
        s.champion_roster_id,
        (champCounts.get(s.champion_roster_id) ?? 0) + 1,
      );
    }
  }
  const championships: LeaderRow[] = [...champCounts.entries()]
    .map(([rosterId, value]) => ({
      rosterId,
      teamName: history.latestTeams.get(rosterId)?.teamName ?? `Roster #${rosterId}`,
      value,
    }))
    .sort((a, b) => b.value - a.value);

  // Offensive / defensive records
  const highWeeks = topWeeklyScores(history);
  const lowWeeks = bottomWeeklyScores(history);
  const blowouts = biggestBlowouts(history);

  // Defensive: fewest/most points against, per season-team
  const paAgg = new Map<number, number>();
  const paIds = new Set<number>();
  for (const g of history.games) {
    paIds.add(g.rosterId);
    paAgg.set(g.rosterId, (paAgg.get(g.rosterId) ?? 0) + g.opponentPoints);
  }
  const mostPA: LeaderRow[] = [...paIds]
    .map((id) => ({
      rosterId: id,
      teamName: history.latestTeams.get(id)?.teamName ?? `Roster #${id}`,
      value: Math.round((paAgg.get(id) ?? 0) * 100) / 100,
    }))
    .sort((a, b) => b.value - a.value);

  // Streaks
  const streaks = longestWinStreaks(history);

  // Trade Records — Biggest Trade by KTC value (join player ids -> names -> ktc)
  let biggestTrade: { value: number; season: string; week: number } | null = null;
  for (const season of history.seasons) {
    for (let week = 1; week <= 18; week++) {
      const txns = await getTransactions(season.leagueId, week).catch(() => []);
      for (const t of txns ?? []) {
        if (t.type !== "trade" || t.status !== "complete") continue;
        const ids = new Set<string>([
          ...Object.keys(t.adds ?? {}),
          ...Object.keys(t.drops ?? {}),
        ]);
        let value = 0;
        for (const pid of ids) {
          const name = playerName(players, pid);
          value += ktc.get(name.toLowerCase()) ?? 0;
        }
        if (!biggestTrade || value > biggestTrade.value) {
          biggestTrade = { value, season: season.season, week };
        }
      }
    }
  }

  // Misc — comeback wins from notable_moments
  const comebackCounts = new Map<number, number>();
  for (const m of comebackMoments) {
    if (m.roster_id != null) {
      comebackCounts.set(m.roster_id, (comebackCounts.get(m.roster_id) ?? 0) + 1);
    }
  }
  const mostComebacks: LeaderRow[] = [...comebackCounts.entries()]
    .map(([rosterId, value]) => ({
      rosterId,
      teamName: history.latestTeams.get(rosterId)?.teamName ?? `Roster #${rosterId}`,
      value,
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-8">
      <SectionHeading
        title="Record Book"
        subtitle="All-time highs, lows, streaks, and the numbers behind WLFS — computed from Sleeper history."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          {/* All-time leaders */}
          <div>
            <SectionHeading title="All-Time Leaders" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <LeaderList title="Wins" rows={wins} />
              <LeaderList title="Points For" rows={pf} unit="pts" />
              <LeaderList title="Championships" rows={championships} />
              <LeaderList title="Playoff Wins" rows={poWins} />
              <LeaderList title="Most Trades" rows={mostTrades} />
            </div>
          </div>

          {/* Offensive records */}
          <div>
            <SectionHeading title="Offensive Records" />
            <div className="grid gap-4 sm:grid-cols-2">
              <GameRecordList title="Highest Weekly Scores" rows={highWeeks} />
              <GameRecordList title="Biggest Blowouts" rows={blowouts} />
            </div>
          </div>

          {/* Defensive records */}
          <div>
            <SectionHeading title="Defensive Records" />
            <div className="grid gap-4 sm:grid-cols-2">
              <GameRecordList title="Lowest Weekly Scores" rows={lowWeeks} />
              <LeaderList title="Most Points Against (career)" rows={mostPA} unit="pts" />
            </div>
          </div>

          {/* Win streaks */}
          <div>
            <SectionHeading title="Win Streaks" />
            <div className="grid gap-4 sm:grid-cols-2">
              <LeaderList title="Longest Streak (Overall)" rows={streaks.overall} unit="W" />
              <LeaderList title="Longest Streak (Playoffs)" rows={streaks.playoff} unit="W" />
            </div>
          </div>

          {/* Trade records */}
          <div>
            <SectionHeading title="Trade Records" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <LeaderList title="Most Trades" rows={mostTrades} />
              <LeaderList title="Most Players Acquired" rows={mostPlayersTraded} />
              <Panel className="p-4">
                <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-gold">
                  Biggest Trade (KTC)
                </h3>
                {biggestTrade && biggestTrade.value > 0 ? (
                  <div>
                    <div className="font-display text-2xl font-bold text-gold-metallic">
                      {biggestTrade.value.toLocaleString()}
                    </div>
                    <div className="text-xs text-offwhite/50">
                      combined KTC · {biggestTrade.season} Wk {biggestTrade.week}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-offwhite/40">
                    Needs completed trades and populated ktc_values.
                  </p>
                )}
              </Panel>
            </div>
          </div>

          {/* Misc records */}
          <div>
            <SectionHeading title="Miscellaneous Records" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <LeaderList title="Most Comeback Wins" rows={mostComebacks} />
              <Panel className="p-4">
                <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-gold">
                  Youngest / Oldest Champion
                </h3>
                <p className="text-xs text-offwhite/40">
                  Populated from champion roster ages once seasons are recorded.
                </p>
              </Panel>
              <Panel className="p-4">
                <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-gold">
                  Largest Comeback
                </h3>
                {comebackMoments[0] ? (
                  <div>
                    <div className="font-semibold text-offwhite">
                      {comebackMoments[0].title}
                    </div>
                    <div className="text-xs text-offwhite/50">
                      {comebackMoments[0].stat_highlight ?? comebackMoments[0].description}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-offwhite/40">
                    Recorded in notable_moments (category: comeback).
                  </p>
                )}
              </Panel>
            </div>
          </div>
        </div>

        {/* Championship history sidebar */}
        <aside>
          <Panel className="p-4">
            <SectionHeading title="Championship History" />
            {seasons.length > 0 ? (
              <ul className="space-y-3">
                {seasons.map((s) => (
                  <li key={s.id} className="flex items-center gap-3">
                    <span className="text-2xl">🏆</span>
                    <div>
                      <div className="font-display font-bold text-gold-metallic">
                        {s.year}
                      </div>
                      <div className="text-sm text-offwhite/70">
                        {s.champion_roster_id != null
                          ? (history.latestTeams.get(s.champion_roster_id)?.teamName ??
                            `Roster #${s.champion_roster_id}`)
                          : "—"}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="No champions yet"
                message="Championship history appears here as seasons are recorded."
              />
            )}
          </Panel>
        </aside>
      </div>
    </div>
  );
}
