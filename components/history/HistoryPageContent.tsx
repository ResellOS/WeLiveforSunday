import { ChampionTrophy } from "@/components/ChampionTrophy";
import { Panel } from "@/components/ui/Panel";
import { HistoryEmptyView } from "@/components/history/HistoryEmptyView";
import { HistoryTimeline } from "@/components/history/HistoryTimeline";
import { HistorySeasonRecaps } from "@/components/history/HistorySeasonRecaps";
import type { HistoryView } from "@/lib/history/views";
import type { SeasonRow, MilestoneRow } from "@/lib/queries";
import { teamAccentColor } from "@/lib/teamColor";

export interface HistoryPageContentProps {
  view: HistoryView;
  seasonByYear: Record<number, SeasonRow>;
  teamNames: Record<number, string>;
  mvpByYear: Record<number, { playerId: string; name: string } | undefined>;
  milestones: MilestoneRow[];
}

const EMPTY_COPY: Record<
  Exclude<HistoryView, "timeline" | "champions" | "season-results" | "milestones">,
  { title: string }
> = {
  playoffs: { title: "Playoff History" },
  leaders: { title: "League Leaders" },
  records: { title: "Record Breakers" },
  trades: { title: "Trades History" },
  rules: { title: "Rule Changes" },
  information: { title: "League Information" },
};

function resolveName(
  rosterId: number | null | undefined,
  teamNames: Record<number, string>,
): string | null {
  if (rosterId == null) return null;
  return teamNames[rosterId] ?? `Roster #${rosterId}`;
}

export function HistoryPageContent({
  view,
  seasonByYear,
  teamNames,
  mvpByYear,
  milestones,
}: HistoryPageContentProps) {
  const seasonMap = new Map(
    Object.entries(seasonByYear).map(([k, v]) => [Number(k), v]),
  );
  const mvpMap = new Map(
    Object.entries(mvpByYear).map(([k, v]) => [Number(k), v]),
  );
  const teamName = (id: number | null | undefined) => resolveName(id, teamNames);

  switch (view) {
    case "timeline":
      return (
        <>
          <HistoryTimeline seasonByYear={seasonMap} teamName={teamName} />
          <HistorySeasonRecaps
            seasonByYear={seasonMap}
            teamName={teamName}
            mvpByYear={mvpMap}
          />
        </>
      );

    case "champions": {
      const crowned = Object.values(seasonByYear).filter(
        (s) => s.champion_roster_id != null,
      );
      if (crowned.length === 0) {
        return <HistoryEmptyView title="Champions" />;
      }
      return (
        <Panel className="panel--vaults p-4">
          <h2 className="section-title">League Champions</h2>
          <div className="vault-grid history-champions-grid">
            {crowned.map((s) => {
              const champ = teamName(s.champion_roster_id);
              return (
                <div key={s.year} className="vault vault-current vault-crowned">
                  <div className="vault-stage">
                    <ChampionTrophy year={s.year} />
                  </div>
                  <span className="vault-year">{s.year}</span>
                  <span
                    className="vault-title"
                    style={{
                      color: champ ? teamAccentColor(champ) : undefined,
                    }}
                  >
                    {champ}
                  </span>
                  <span className="vault-status vault-status-won">
                    League Champion
                  </span>
                </div>
              );
            })}
          </div>
        </Panel>
      );
    }

    case "season-results":
      return (
        <HistorySeasonRecaps
          seasonByYear={seasonMap}
          teamName={teamName}
          mvpByYear={mvpMap}
        />
      );

    case "milestones":
      if (milestones.length === 0) {
        return <HistoryEmptyView title="League Milestones" />;
      }
      return (
        <Panel className="panel--news p-4">
          <h2 className="section-title">League Milestones</h2>
          <ul className="moment-list">
            {milestones.map((m) => (
              <li key={m.id} className="moment-item moment-card">
                <div>
                  {m.date && <span className="moment-date">{m.date}</span>}
                  <span className="moment-title">{m.title}</span>
                  {m.description && (
                    <p className="moment-detail">{m.description}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      );

    default: {
      const copy = EMPTY_COPY[view as keyof typeof EMPTY_COPY];
      const action =
        view === "records"
          ? { href: "/record-book", label: "Open Record Book" }
          : view === "leaders"
            ? { href: "/record-book#all-time-leaders", label: "View All-Time Leaders" }
            : undefined;
      return (
        <HistoryEmptyView
          title={copy?.title ?? "History"}
          actionHref={action?.href}
          actionLabel={action?.label}
        />
      );
    }
  }
}
