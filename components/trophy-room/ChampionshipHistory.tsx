import { Panel } from "@/components/ui/Panel";
import { ChampionTrophy } from "@/components/ChampionTrophy";

const INAUGURAL_YEAR = 2026;
const FUTURE_YEARS = [2027, 2028, 2029];

export function ChampionshipHistory() {
  return (
    <div className="tr-championship-history-panel tr-panel-enter">
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
          <div className="vault vault-current vault-inaugural tr-vault-hero tr-vault-card-enter">
            <span className="vault-spotlight tr-vault-hero-spotlight" aria-hidden="true" />
            <span className="tr-vault-shimmer" aria-hidden="true" />
            <div className="vault-stage">
              <ChampionTrophy year={INAUGURAL_YEAR} />
            </div>
            <span className="vault-year">{INAUGURAL_YEAR}</span>
            <span className="vault-title vault-title-inaugural">Inaugural Champion</span>
            <p className="vault-copy tr-vault-hero-copy">
              Sixteen franchises. One first champion. The opening chapter of WLFS
              history begins here.
            </p>
            <span className="vault-status tr-vault-status-pending">To Be Crowned</span>
          </div>

          {FUTURE_YEARS.map((year, i) => (
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
              <span className="vault-status tr-vault-status-future">Awaiting History</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
