import { Panel } from "@/components/ui/Panel";
import type { TeamActivityItem } from "@/lib/teams/activity";

export function TeamActivityPanel({
  items,
}: {
  items: TeamActivityItem[];
}) {
  return (
    <Panel className="p-4 team-detail-panel">
      <h2 className="team-detail-panel-title">Recent Activity</h2>
      {items.length === 0 ? (
        <p className="team-detail-unavailable">
          No recent transactions involving this franchise.
        </p>
      ) : (
        <ul className="team-activity-list">
          {items.map((item) => (
            <li key={item.id} className="team-activity-item">
              <span className="team-activity-type">{item.type}</span>
              <span className="team-activity-desc">{item.description}</span>
              <span className="team-activity-date">{item.date}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
