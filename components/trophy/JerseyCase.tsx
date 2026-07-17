/**
 * Museum-style championship jersey display case: dark glass box, bronze
 * frame, pedestal medallion, season plaque. Renders a real jersey image
 * when one exists; otherwise a shadowed awaiting-champion silhouette.
 */
export function JerseyCase({
  year,
  headline,
  status,
  imageUrl,
  playerName,
  current = false,
}: {
  year: string | number;
  headline: string;
  status: string;
  imageUrl?: string | null;
  playerName?: string | null;
  current?: boolean;
}) {
  return (
    <div className={current ? "jersey-case jersey-case-current" : "jersey-case"}>
      <div className="jersey-glass">
        <span className="jersey-spotlight" aria-hidden="true" />
        <span className="jersey-glass-reflection" aria-hidden="true" />
        <span className="jersey-hanger" aria-hidden="true" />
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={playerName ?? "Championship jersey"}
            className="jersey-photo"
          />
        ) : (
          <svg
            className="jersey-silhouette"
            viewBox="0 0 120 110"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M42 12 60 6l18 6 26 14-9 20-13-6v56H38V40l-13 6-9-20 26-14Z"
              fill="#0b0906"
              stroke="#63431e"
              strokeWidth="1.6"
            />
            <path
              d="M48 13c3 5 7 8 12 8s9-3 12-8"
              stroke="#63431e"
              strokeWidth="1.6"
            />
            <path d="M38 52h44M38 60h44" stroke="#2f1e0c" strokeWidth="1.4" />
            <text
              x="60"
              y="82"
              textAnchor="middle"
              fill="#63431e"
              fontFamily="Georgia, serif"
              fontSize="22"
              fontWeight="800"
              opacity="0.8"
            >
              ?
            </text>
          </svg>
        )}
        {/* pedestal + medallion */}
        <div className="jersey-pedestal" aria-hidden="true">
          <svg viewBox="0 0 36 36" fill="none" className="jersey-medallion">
            <circle cx="18" cy="18" r="15" fill="#2f1e0c" stroke="#c99a55" strokeWidth="1.6" />
            <circle cx="18" cy="18" r="10" fill="#0c0805" stroke="#97672f" strokeWidth="1" />
            <path d="m18 11 2 4.2 4.6.5-3.4 3.2.9 4.6-4.1-2.3-4.1 2.3.9-4.6-3.4-3.2 4.6-.5L18 11Z" fill="#c99a55" />
          </svg>
        </div>
      </div>
      <div className="jersey-plaque">
        <span className="jersey-year">{year}</span>
        <span className="jersey-headline">{playerName ?? headline}</span>
        <span className="jersey-status">{status}</span>
      </div>
    </div>
  );
}
