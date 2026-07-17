import { Panel } from "@/components/ui/Panel";
import { TrophyGlyph, type TrophyGlyphKey } from "@/components/trophy/TrophyGlyph";
import { teamAccentColor } from "@/lib/teamColor";

export type RecordEntry = {
  glyph: TrophyGlyphKey;
  label: string;
  holder: string | null;
  value: string | null;
  placeholder: string;
};

export type RecordVariant = "offensive" | "defensive" | "streak" | "trade" | "misc";

function splitValue(value: string): { stat: string; meta?: string } {
  const idx = value.indexOf(" · ");
  if (idx === -1) return { stat: value };
  return {
    stat: value.slice(0, idx),
    meta: value.slice(idx + 3),
  };
}

export function RecordRow({
  entry,
  variant,
}: {
  entry: RecordEntry;
  variant: RecordVariant;
}) {
  const hasData = Boolean(entry.holder && entry.value);
  const parts = entry.value ? splitValue(entry.value) : null;

  return (
    <button
      type="button"
      className={`record-row record-row-${variant} record-row-expandable`}
      aria-label={`${entry.label}${hasData ? `: ${entry.holder}` : ""}`}
    >
      <TrophyGlyph name={entry.glyph} className="record-glyph" />
      <span className="record-label">{entry.label}</span>
      {hasData && entry.holder && entry.value ? (
        <span className="record-holder">
          <span
            className="record-team"
            style={{ color: teamAccentColor(entry.holder) }}
          >
            {entry.holder}
          </span>
          <span className="record-value">{parts?.stat ?? entry.value}</span>
          {parts?.meta && (
            <span className="record-meta">{parts.meta}</span>
          )}
        </span>
      ) : (
        <span className="record-tbd">{entry.placeholder}</span>
      )}
      <span className="record-expand-hint" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="m9 6 6 6-6 6" />
        </svg>
      </span>
    </button>
  );
}

export function RecordSection({
  title,
  entries,
  variant,
}: {
  title: string;
  entries: RecordEntry[];
  variant: RecordVariant;
}) {
  return (
    <Panel className={`panel--rewards record-section record-section-${variant} p-4`}>
      <h2 className="trophy-panel-title record-section-title">{title}</h2>
      <div className="record-list">
        {entries.map((e) => (
          <RecordRow key={e.label} entry={e} variant={variant} />
        ))}
      </div>
    </Panel>
  );
}
