import Image from "next/image";
import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { ChampionTrophy } from "@/components/ChampionTrophy";
import { teamAccentColor } from "@/lib/teamColor";

const INAUGURAL_YEAR = 2026;
const VAULT_YEARS = [2026, 2027, 2028, 2029];

export function HistoryTimeline({
  seasonByYear,
  teamName,
}: {
  seasonByYear: Map<number, { champion_roster_id: number | null }>;
  teamName: (rosterId: number | null | undefined) => string | null;
}) {
  return (
    <Panel className="panel--vaults p-4">
      <div className="section-heading">
        <div>
          <h2 className="section-title">Season Timeline</h2>
          <p className="section-subtitle">
            The story begins with the {INAUGURAL_YEAR} inaugural season
          </p>
        </div>
      </div>
      <div className="history-timeline-scroll">
        <div className="vault-grid history-timeline-track">
          {VAULT_YEARS.map((year) => {
            const season = seasonByYear.get(year);
            const champ = teamName(season?.champion_roster_id);
            const isInaugural = year === INAUGURAL_YEAR;

            if (champ) {
              return (
                <div key={year} className="vault vault-current vault-crowned">
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
                  <span className="vault-status vault-status-won">
                    League Champion
                  </span>
                </div>
              );
            }

            if (isInaugural) {
              return (
                <div
                  key={year}
                  className="vault vault-current vault-inaugural"
                >
                  <span className="vault-spotlight" aria-hidden="true" />
                  <div className="vault-stage vault-stage-art">
                    <div className="history-inaugural-art">
                      <Image
                        src="/images/first-champion.png"
                        alt="WLFS inaugural champion to be crowned after the 2026 season"
                        fill
                        className="history-inaugural-img"
                        sizes="220px"
                        priority
                      />
                      <span
                        className="history-inaugural-particles"
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                  <span className="vault-year">{year}</span>
                  <span className="vault-title vault-title-inaugural">
                    Inaugural Season
                  </span>
                  <p className="vault-copy">
                    The first chapter of WLFS history begins.
                  </p>
                  <Link href="/trophy-room" className="vault-cta">
                    History Begins Here
                  </Link>
                </div>
              );
            }

            return (
              <div key={year} className="vault vault-future">
                <span className="vault-lock-shimmer" aria-hidden="true" />
                <div className="vault-stage vault-stage-dim">
                  <ChampionTrophy year={year} />
                </div>
                <span className="vault-year">{year}</span>
                <span className="vault-status">Awaiting Champion</span>
              </div>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}
