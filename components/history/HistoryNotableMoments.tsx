import { Panel } from "@/components/ui/Panel";
import { MomentIcon } from "@/components/history/MomentIcon";
import { format as fmtDate } from "date-fns";

export function HistoryNotableMoments({
  moments,
}: {
  moments: Array<{ title: string; detail: string; date: string | null }>;
}) {
  return (
    <Panel className="panel--news p-4">
      <div className="section-heading">
        <div>
          <h2 className="section-title section-title-sm">Notable Moments</h2>
        </div>
      </div>
      <ul className="moment-list">
        {moments.map((m) => (
          <li key={m.title} className="moment-item moment-card">
            <MomentIcon title={m.title} />
            <div>
              {m.date && (
                <span className="moment-date">
                  {fmtDate(new Date(m.date), "MMM d, yyyy")}
                </span>
              )}
              <span className="moment-title">{m.title}</span>
              {m.detail && <p className="moment-detail">{m.detail}</p>}
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
