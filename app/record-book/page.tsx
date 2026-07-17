import type { Metadata } from "next";
import { getSeasons, getKtcValueMap, getNotableMoments, getJerseys } from "@/lib/queries";
import { getAllPlayers, getTransactions, playerName } from "@/lib/sleeper";
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
} from "@/lib/records";
import { Panel, EmptyState } from "@/components/ui/Panel";
import { MuseumDirectory, type DirectoryItem } from "@/components/trophy/MuseumDirectory";
import { TrophyGlyph } from "@/components/trophy/TrophyGlyph";
import { JerseyCase } from "@/components/trophy/JerseyCase";
import { LeaderDashboard } from "@/components/record-book/LeaderDashboard";
import {
  RecordSection,
  type RecordEntry,
} from "@/components/record-book/RecordSection";
import { teamAccentColor } from "@/lib/teamColor";
import { fmtPoints } from "@/lib/format";

export const metadata: Metadata = { title: "Record Book" };
export const dynamic = "force-dynamic";

const INAUGURAL_YEAR = 2026;
const PLAQUE_YEARS = [2026, 2027, 2028, 2029];

const CATEGORIES: DirectoryItem[] = [
  { key: "overview", label: "Overview" },
  { key: "wins", label: "Wins" },
  { key: "winningPct", label: "Winning %" },
  { key: "championship", label: "Championships" },
  { key: "playoffs", label: "Playoff Wins" },
  { key: "highestScorer", label: "Points For" },
  { key: "pointsAgainst", label: "Points Against" },
  { key: "tradeOfYear", label: "Trades" },
  { key: "winStreaks", label: "Win Streaks" },
  { key: "blowouts", label: "Blowouts" },
  { key: "mostPointsWeek", label: "Weekly Records" },
  { key: "mostPointsPlayoffs", label: "Playoff Records" },
  { key: "biggestComeback", label: "Comebacks" },
  { key: "leagueRecords", label: "League Records" },
];

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

  const [tradeStats, seasons, ktc, players, comebackMoments, jerseys] =
    await Promise.all([
      loadTradeStats(leagueId),
      getSeasons(),
      getKtcValueMap(),
      getAllPlayers().catch((): PlayerMap => ({})),
      getNotableMoments("comeback"),
      getJerseys(),
    ]);

  const { history, mostTrades, mostPlayersTraded } = tradeStats;

  const wins = careerWins(history).filter((r) => r.value > 0);
  const pf = careerPointsFor(history).filter((r) => r.value > 0);
  const poWins = playoffWins(history).filter((r) => r.value > 0);
  const highWeeks = topWeeklyScores(history);
  const lowWeeks = bottomWeeklyScores(history);
  const blowouts = biggestBlowouts(history);
  const streaks = longestWinStreaks(history);
  const trades = mostTrades.filter((r) => r.value > 0);
  const playersTraded = mostPlayersTraded.filter((r) => r.value > 0);

  let biggestTrade: { value: number; season: string; week: number } | null =
    null;
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

  const completedSeasons = seasons.filter(
    (s) => s.champion_roster_id != null,
  ).length;
  const franchiseCount = history.latestTeams.size || 16;
  const firstChampion =
    completedSeasons > 0
      ? (history.latestTeams.get(seasons[seasons.length - 1].champion_roster_id!)
          ?.teamName ?? "Crowned")
      : null;
  const seasonByYear = new Map(seasons.map((s) => [s.year, s]));
  const jerseyByYear = new Map(jerseys.map((j) => [j.season_year, j]));

  const gameRef = (season: string, week: number) => `${season} · Wk ${week}`;

  const offensive: RecordEntry[] = [
    {
      glyph: "highestScorer",
      label: "Most Points For (Season)",
      holder: pf[0]?.teamName ?? null,
      value: pf[0] ? `${pf[0].value.toLocaleString()} pts` : null,
      placeholder: `Awaiting ${INAUGURAL_YEAR} Champion`,
    },
    {
      glyph: "mostPointsWeek",
      label: "Highest Weekly Score",
      holder: highWeeks[0]?.teamName ?? null,
      value: highWeeks[0]
        ? `${fmtPoints(highWeeks[0].points)} · ${gameRef(highWeeks[0].season, highWeeks[0].week)}`
        : null,
      placeholder: "To Be Set",
    },
    {
      glyph: "blowouts",
      label: "Largest Blowout Win",
      holder: blowouts[0]?.teamName ?? null,
      value: blowouts[0]
        ? (blowouts[0].detail ?? `${fmtPoints(blowouts[0].points)} pts`)
        : null,
      placeholder: "Awaiting Week 1",
    },
    {
      glyph: "mostPointsPlayoffs",
      label: "Most Playoff Points (Game)",
      holder: null,
      value: null,
      placeholder: "Awaiting First Postseason",
    },
  ];

  const defensive: RecordEntry[] = [
    {
      glyph: "pointsAgainst",
      label: "Fewest Points Against (Season)",
      holder: null,
      value: null,
      placeholder: `Awaiting ${INAUGURAL_YEAR} Season`,
    },
    {
      glyph: "leagueMvp",
      label: "Lowest Weekly Score Against",
      holder: lowWeeks[0]?.teamName ?? null,
      value: lowWeeks[0]
        ? `${fmtPoints(lowWeeks[0].points)} · ${gameRef(lowWeeks[0].season, lowWeeks[0].week)}`
        : null,
      placeholder: "To Be Set",
    },
    {
      glyph: "bestRegular",
      label: "Highest Winning Margin",
      holder: null,
      value: null,
      placeholder: "Awaiting Week 1",
    },
  ];

  const streakEntries: RecordEntry[] = [
    {
      glyph: "winStreaks",
      label: "Longest Win Streak (Overall)",
      holder: streaks.overall[0]?.value ? streaks.overall[0].teamName : null,
      value: streaks.overall[0]?.value
        ? `${streaks.overall[0].value} W`
        : null,
      placeholder: "No Record Yet",
    },
    {
      glyph: "wins",
      label: "Longest Win Streak (Season)",
      holder: null,
      value: null,
      placeholder: "No Record Yet",
    },
    {
      glyph: "playoffs",
      label: "Longest Win Streak (Playoffs)",
      holder: streaks.playoff[0]?.value ? streaks.playoff[0].teamName : null,
      value: streaks.playoff[0]?.value
        ? `${streaks.playoff[0].value} W`
        : null,
      placeholder: "Awaiting First Postseason",
    },
  ];

  const misc: RecordEntry[] = [
    {
      glyph: "managerOfYear",
      label: "Youngest Champion",
      holder: null,
      value: null,
      placeholder: `Awaiting ${INAUGURAL_YEAR} Champion`,
    },
    {
      glyph: "biggestComeback",
      label: "Most Comeback Wins",
      holder: comebackMoments[0]?.title ?? null,
      value: comebackMoments[0]?.stat_highlight ?? null,
      placeholder: "No Record Yet",
    },
    {
      glyph: "recordBreakers",
      label: "Largest Comeback Win",
      holder: null,
      value: null,
      placeholder: "To Be Set",
    },
  ];

  const tradeEntries: RecordEntry[] = [
    {
      glyph: "tradeOfYear",
      label: "Most Trades (All-Time)",
      holder: trades[0]?.teamName ?? null,
      value: trades[0] ? String(trades[0].value) : null,
      placeholder: "No League Trades Recorded",
    },
    {
      glyph: "franchises",
      label: "Most Players Traded",
      holder: playersTraded[0]?.teamName ?? null,
      value: playersTraded[0] ? String(playersTraded[0].value) : null,
      placeholder: "No League Trades Recorded",
    },
    {
      glyph: "payout",
      label: "Largest Trade (KTC Value)",
      holder:
        biggestTrade && biggestTrade.value > 0
          ? gameRef(biggestTrade.season, biggestTrade.week)
          : null,
      value:
        biggestTrade && biggestTrade.value > 0
          ? biggestTrade.value.toLocaleString()
          : null,
      placeholder: "No League Trades Recorded",
    },
  ];

  const leaderCards = [
    {
      key: "wins",
      icon: "wins" as const,
      label: "Wins Leader",
      value: wins[0] ? String(wins[0].value) : "Waiting for History",
      subtext: wins[0]?.teamName ?? null,
      numeric: Boolean(wins[0]),
      waiting: !wins[0],
    },
    {
      key: "points",
      icon: "highestScorer" as const,
      label: "Points Leader",
      value: pf[0] ? pf[0].value.toLocaleString() : "Waiting for History",
      subtext: pf[0]?.teamName ?? null,
      numeric: Boolean(pf[0]),
      waiting: !pf[0],
    },
    {
      key: "championships",
      icon: "championship" as const,
      label: "Championships",
      value: firstChampion ?? "Waiting for History",
      waiting: !firstChampion,
    },
    {
      key: "playoffs",
      icon: "playoffs" as const,
      label: "Playoff Wins",
      value: poWins[0] ? String(poWins[0].value) : "Waiting for History",
      subtext: poWins[0]?.teamName ?? null,
      numeric: Boolean(poWins[0]),
      waiting: !poWins[0],
    },
    {
      key: "trades",
      icon: "tradeOfYear" as const,
      label: "Most Trades",
      value: trades[0] ? String(trades[0].value) : "Waiting for History",
      subtext: trades[0]?.teamName ?? null,
      numeric: Boolean(trades[0]),
      waiting: !trades[0],
    },
  ];

  return (
    <div className="trophy-page record-book-page">
      <div className="history-grid">
        <aside className="trophy-side">
          <MuseumDirectory
            title="Browse Records"
            items={CATEGORIES}
            ariaLabel="Record categories"
          />

          <Panel className="panel--rewards p-3">
            <div className="foundation-body">
              <TrophyGlyph name="leagueRecords" className="reward-glyph" />
              <div>
                <span className="reward-value">Since {INAUGURAL_YEAR}</span>
                <span className="reward-label">All Records</span>
              </div>
            </div>
            <p className="foundation-copy">
              Every mark in this book will be set by a founding franchise.
            </p>
          </Panel>
        </aside>

        <section className="trophy-main">
          <Panel className="panel--banner trophy-banner-body">
            <div className="trophy-banner-title">
              <span className="trophy-banner-icon" aria-hidden="true">
                <TrophyGlyph name="leagueRecords" />
              </span>
              <div>
                <h1 className="trophy-banner-word">Record Book</h1>
                <p className="trophy-banner-sub">
                  The numbers don&apos;t lie. Legends are written here.
                </p>
              </div>
            </div>
          </Panel>

          <Panel className="panel--vaults p-4">
            <div className="section-heading">
              <div>
                <h2 className="section-title">All-Time Leaders</h2>
                <p className="section-subtitle">
                  The first names in the book arrive with the inaugural season
                </p>
              </div>
            </div>
            <LeaderDashboard cards={leaderCards} />
          </Panel>

          <div className="record-sections">
            <RecordSection
              title="Offensive Records"
              entries={offensive}
              variant="offensive"
            />
            <RecordSection
              title="Defensive Records"
              entries={defensive}
              variant="defensive"
            />
            <RecordSection
              title="Win Streaks"
              entries={streakEntries}
              variant="streak"
            />
            <RecordSection
              title="Miscellaneous Records"
              entries={misc}
              variant="misc"
            />
            <RecordSection
              title="Trade Records"
              entries={tradeEntries}
              variant="trade"
            />
          </div>
        </section>

        <aside className="trophy-feature">
          <Panel className="panel--ringfeature p-4">
            <h2 className="trophy-panel-title">Championship History</h2>
            <div className="rb-championship-wall">
              {PLAQUE_YEARS.map((year) => {
                const s = seasonByYear.get(year);
                const champ =
                  s?.champion_roster_id != null
                    ? (history.latestTeams.get(s.champion_roster_id)
                        ?.teamName ?? `Roster #${s.champion_roster_id}`)
                    : null;
                const isInaugural = year === INAUGURAL_YEAR;
                const jersey = jerseyByYear.get(year);
                const team = champ
                  ? history.latestTeams.get(s!.champion_roster_id!)
                  : null;
                const record =
                  team != null
                    ? `${team.wins}-${team.losses}${team.ties > 0 ? `-${team.ties}` : ""}`
                    : null;

                return (
                  <div
                    key={year}
                    className={
                      champ || isInaugural
                        ? "rb-jersey-slot rb-jersey-slot-current"
                        : "rb-jersey-slot"
                    }
                  >
                    {!champ && !isInaugural && (
                      <span className="rb-jersey-shimmer" aria-hidden="true" />
                    )}
                    <JerseyCase
                      year={year}
                      headline={
                        champ ??
                        (isInaugural
                          ? "Reserved For First Champion"
                          : "Awaiting Champion")
                      }
                      status={
                        champ
                          ? record
                            ? `${record} · League Champion`
                            : "League Champion"
                          : isInaugural
                            ? "History Begins Here"
                            : "Awaiting Champion"
                      }
                      imageUrl={jersey?.image_url}
                      playerName={jersey?.player_name}
                      current={isInaugural && !champ}
                    />
                    {champ && (
                      <span
                        className="rb-champ-name"
                        style={{ color: teamAccentColor(champ) }}
                      >
                        {champ}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <span className="metal-button mt-3 w-full">
              View Full Championship History
            </span>
          </Panel>
        </aside>
      </div>

      <Panel className="panel--legacy trophy-legacy-body">
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
            <span className="legacy-value">{completedSeasons}</span>
            <span className="legacy-label">Seasons Completed</span>
          </div>
        </div>
        <span className="legacy-divider" aria-hidden="true" />
        <div className="legacy-stat">
          <TrophyGlyph name="leagueRecords" className="legacy-glyph" />
          <div>
            <span className="legacy-value legacy-value-sm">
              {wins.length > 0 ? "In The Books" : "Waiting To Be Written"}
            </span>
            <span className="legacy-label">League Records</span>
          </div>
        </div>
        <span className="legacy-divider" aria-hidden="true" />
        <div className="legacy-stat">
          <TrophyGlyph name="payout" className="legacy-glyph" />
          <div>
            <span className="legacy-value">$600+</span>
            <span className="legacy-label">Champion Payout</span>
          </div>
        </div>
        <span className="legacy-divider" aria-hidden="true" />
        <div className="legacy-stat">
          <TrophyGlyph name="championship" className="legacy-glyph" />
          <div>
            <span className="legacy-value legacy-value-sm">
              {firstChampion ?? "To Be Determined"}
            </span>
            <span className="legacy-label">First Champion</span>
          </div>
        </div>
      </Panel>
    </div>
  );
}
