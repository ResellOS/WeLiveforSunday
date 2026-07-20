"use client";

interface TradeTugBarProps {
  /** Signed -50…+50. Positive favors side A (left). */
  score: number;
  sideAName: string;
  sideBName: string;
}

/**
 * Centered tug-of-war bar. Needle sits at 50% when even and slides toward
 * the side that received more dynasty value. No raw KTC figures.
 */
export function TradeTugBar({ score, sideAName, sideBName }: TradeTugBarProps) {
  const clamped = Math.max(-50, Math.min(50, score));
  // Map -50…+50 → 0%…100% (left = A favor, right = B favor visually? 
  // Spec: "pulled toward whichever team's side gained more value"
  // Side A is left, Side B is right. Positive score = A gained more → pull left.
  // Position of marker from left: 50 - (score/50)*50 = 50 - score
  // score +50 → marker at 0% (far left / A)
  // score 0 → 50%
  // score -50 → 100% (far right / B)
  const markerPct = 50 - clamped;

  const favor =
    clamped > 2 ? sideAName : clamped < -2 ? sideBName : "Even trade";

  return (
    <div
      className="th-tug"
      role="img"
      aria-label={`Value balance: ${favor}. Score ${clamped > 0 ? "+" : ""}${clamped} on a -50 to 50 scale.`}
    >
      <div className="th-tug-track">
        <span className="th-tug-mid" aria-hidden="true" />
        <span
          className={[
            "th-tug-fill",
            clamped > 0 && "th-tug-fill--a",
            clamped < 0 && "th-tug-fill--b",
          ]
            .filter(Boolean)
            .join(" ")}
          style={
            clamped >= 0
              ? {
                  left: `${markerPct}%`,
                  width: `${50 - markerPct}%`,
                }
              : {
                  left: "50%",
                  width: `${markerPct - 50}%`,
                }
          }
          aria-hidden="true"
        />
        <span
          className="th-tug-needle"
          style={{ left: `${markerPct}%` }}
          aria-hidden="true"
        />
      </div>
      <div className="th-tug-labels" aria-hidden="true">
        <span>A</span>
        <span>Even</span>
        <span>B</span>
      </div>
    </div>
  );
}
