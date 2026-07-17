import { Panel } from "@/components/ui/Panel";
import {
  formatRoundList,
  groupPicksBySeason,
  type OwnedPick,
} from "@/lib/teams/draftCapital";

export function TeamDraftCapitalPanel({
  picks,
}: {
  picks: OwnedPick[];
}) {
  if (picks.length === 0) {
    return (
      <Panel className="p-4 team-detail-panel">
        <h2 className="team-detail-panel-title">Draft Capital</h2>
        <p className="team-detail-unavailable">
          Draft pick data could not be resolved.
        </p>
      </Panel>
    );
  }

  const bySeason = groupPicksBySeason(picks);

  return (
    <Panel className="p-4 team-detail-panel">
      <h2 className="team-detail-panel-title">Draft Capital</h2>
      <p className="team-detail-panel-sub">
        {picks.length} future selections · * traded pick
      </p>
      <div className="team-detail-picks">
        {Array.from(bySeason.entries()).map(([season, sp]) => (
          <div key={season} className="team-detail-pick-season">
            <span className="team-detail-pick-year">{season}</span>
            <span className="team-detail-pick-rounds">{formatRoundList(sp)}</span>
            {sp.some((p) => p.isTraded) && (
              <ul className="team-detail-pick-trades">
                {sp
                  .filter((p) => p.isTraded)
                  .map((p) => (
                    <li key={`${p.season}-${p.round}-${p.originalRosterId}`}>
                      Round {p.round} — originally Roster #{p.originalRosterId}
                    </li>
                  ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </Panel>
  );
}
