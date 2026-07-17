import { Panel } from "@/components/ui/Panel";
import { TrophyGlyph, type TrophyGlyphKey } from "@/components/trophy/TrophyGlyph";

export interface DirectoryItem {
  key: TrophyGlyphKey;
  label: string;
}

/** Engraved dark-metal museum directory used by trophy/history/record pages. */
export function MuseumDirectory({
  title,
  items,
  activeIndex = 0,
  ariaLabel,
}: {
  title?: string;
  items: DirectoryItem[];
  activeIndex?: number;
  ariaLabel: string;
}) {
  return (
    <Panel className="panel--directory p-3">
      {title && <h2 className="trophy-panel-title trophy-panel-title-sm">{title}</h2>}
      <nav className="trophy-directory" aria-label={ariaLabel}>
        {items.map((item, i) => (
          <div
            key={item.key}
            className={
              i === activeIndex ? "trophy-cat trophy-cat-active" : "trophy-cat"
            }
            aria-current={i === activeIndex ? "true" : undefined}
          >
            <TrophyGlyph name={item.key} className="trophy-cat-glyph" />
            <span>{item.label}</span>
          </div>
        ))}
      </nav>
    </Panel>
  );
}
