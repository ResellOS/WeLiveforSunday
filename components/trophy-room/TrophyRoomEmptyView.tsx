import { Panel } from "@/components/ui/Panel";
import { TrophyGlyph } from "@/components/trophy/TrophyGlyph";
import { TROPHY_VIEW_LABELS, type TrophyView } from "@/lib/trophy-room/views";

export function TrophyRoomEmptyView({ view }: { view: TrophyView }) {
  const title = TROPHY_VIEW_LABELS[view] ?? "Trophy Room";

  return (
    <Panel className="p-4 tr-empty-view">
      <span className="tr-empty-glow" aria-hidden="true" />
      <TrophyGlyph name="championship" className="tr-empty-glyph" />
      <h2 className="tr-empty-title">{title}</h2>
      <p className="tr-empty-subtitle">
        The first chapter has yet to be written.
      </p>
    </Panel>
  );
}
