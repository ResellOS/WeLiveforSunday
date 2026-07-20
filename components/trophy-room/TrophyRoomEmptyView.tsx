import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { TrophyGlyph } from "@/components/trophy/TrophyGlyph";
import { TROPHY_VIEW_LABELS, type TrophyView } from "@/lib/trophy-room/views";

const VIEW_ACTIONS: Partial<
  Record<TrophyView, { href: string; label: string }>
> = {
  records: { href: "/record-book", label: "Open Record Book" },
  championship: { href: "/history?view=champions", label: "View League Champions" },
  "highest-scorer": { href: "/record-book#offensive-records", label: "View Scoring Records" },
  "most-points-week": { href: "/record-book#offensive-records", label: "View Weekly Records" },
  "most-points-playoffs": { href: "/record-book#offensive-records", label: "View Playoff Records" },
  "trade-of-year": { href: "/record-book#trade-records", label: "View Trade Records" },
  "biggest-comeback": { href: "/record-book#misc-records", label: "View Comeback Records" },
};

export function TrophyRoomEmptyView({ view }: { view: TrophyView }) {
  const title = TROPHY_VIEW_LABELS[view] ?? "Trophy Room";
  const action = VIEW_ACTIONS[view];

  return (
    <Panel className="p-4 tr-empty-view">
      <span className="tr-empty-glow" aria-hidden="true" />
      <TrophyGlyph name="championship" className="tr-empty-glyph" />
      <h2 className="tr-empty-title">{title}</h2>
      <p className="tr-empty-subtitle">
        The first chapter has yet to be written.
      </p>
      {action ? (
        <Link href={action.href} className="metal-button mt-4 inline-flex">
          {action.label}
        </Link>
      ) : (
        <Link href="/trophy-room" className="metal-button mt-4 inline-flex">
          Back to Championship History
        </Link>
      )}
    </Panel>
  );
}
