import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { ChampionTrophy } from "@/components/ChampionTrophy";
import { teamAccentColor } from "@/lib/teamColor";
import type { ReactNode } from "react";

const INAUGURAL_YEAR = 2026;
const VAULT_YEARS = [2026, 2027, 2028, 2029];

export function ChampionshipHistory({
  championByYear,
  teamNames,
}: {
  championByYear: Record<number, { champion_roster_id: number | null }>;
  teamNames: Record<number, string>;
}) {
  const teamName = (rosterId: number | null | undefined) => {
    if (rosterId == null) return null;
    return teamNames[rosterId] ?? `Roster #${rosterId}`;
  };

  return (
    <div
      id="championship-history"
      className="tr-championship-history-panel tr-panel-enter"
    >
      <Panel className="panel--vaults p-4">
        <div className="section-heading tr-championship-heading">
          <div>
            <h2 className="section-title">Championship History</h2>
            <p className="section-subtitle">
              The vault opens with the {INAUGURAL_YEAR} inaugural season
            </p>
          </div>
        </div>

        <div className="vault-grid tr-championship-vault-grid">
          {VAULT_YEARS.map((year, i) => {
            const champId = championByYear[year]?.champion_roster_id ?? null;
            const champ = teamName(champId);
            const isInaugural = year === INAUGURAL_YEAR;
            const isFuture = year > INAUGURAL_YEAR && !champ;

            if (champ) {
              return (
                <div
                  key={year}
                  className="vault vault-current vault-crowned tr-vault-card-enter tr-vault-hero"
                  style={{ animationDelay: `${i * 90}ms` }}
                >
                  <div className="vault-stage">
                    <ChampionTrophy year={year} />
                  </div>
                  <span className="vault-year">{year}</span>
                  <span
                    className="vault-title"
                    style={{ color: teamAccentColor(champ) }}
                  >
                    {champ}
                  </span>
                  <span className="vault-status vault-status-won">League Champion</span>
                </div>
              );
            }

            if (isInaugural) {
              return (
                <div
                  key={year}
                  className="vault vault-current vault-inaugural tr-vault-hero tr-vault-card-enter"
                >
                  <span className="vault-spotlight tr-vault-hero-spotlight" aria-hidden="true" />
                  <span className="tr-vault-shimmer" aria-hidden="true" />
                  <div className="vault-stage">
                    <ChampionTrophy year={year} />
                  </div>
                  <span className="vault-year">{year}</span>
                  <span className="vault-title vault-title-inaugural">
                    Inaugural Champion
                  </span>
                  <p className="vault-copy tr-vault-hero-copy">
                    Sixteen franchises. One first champion. The opening chapter of
                    WLFS history begins here.
                  </p>
                  <span className="vault-status tr-vault-status-pending">
                    To Be Crowned
                  </span>
                </div>
              );
            }

            return (
              <div
                key={year}
                className="vault vault-future tr-vault-future-entry tr-vault-card-enter"
                style={{ animationDelay: `${(i + 1) * 90}ms` }}
              >
                <span className="vault-lock-shimmer" aria-hidden="true" />
                <div className="vault-stage vault-stage-dim">
                  <ChampionTrophy year={year} />
                </div>
                <span className="vault-year">{year}</span>
                <span className="vault-title">Champion</span>
                <span className="vault-status tr-vault-status-future">
                  {isFuture ? "Awaiting History" : "Awaiting Champion"}
                </span>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

export function ChampionshipHistoryLink({
  className = "panel-action",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href="/history?view=champions" className={className}>
      {children}
    </Link>
  );
}
