import { Panel } from "@/components/ui/Panel";
import { TrophyGlyph } from "@/components/trophy/TrophyGlyph";

export function HistoryEmptyView({
  title,
  subtitle = "History has not been written yet.",
  kicker = "The first chapter begins this season.",
}: {
  title: string;
  subtitle?: string;
  kicker?: string;
}) {
  return (
    <Panel className="p-4 history-empty-view">
      <span className="history-empty-glow" aria-hidden="true" />
      <TrophyGlyph name="legacy" className="history-empty-glyph" />
      <h2 className="history-empty-title">{title}</h2>
      <p className="history-empty-subtitle">{subtitle}</p>
      <p className="history-empty-kicker">{kicker}</p>
    </Panel>
  );
}
