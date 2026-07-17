"use client";

import { useEffect, useRef, useState } from "react";

function parts(ms: number) {
  const clamped = Math.max(0, ms);
  const days = Math.floor(clamped / 86_400_000);
  const hours = Math.floor((clamped % 86_400_000) / 3_600_000);
  const minutes = Math.floor((clamped % 3_600_000) / 60_000);
  const seconds = Math.floor((clamped % 60_000) / 1000);
  return { days, hours, minutes, seconds };
}

export type CountdownIcon = "kickoff" | "trade" | "draft";

const ICON_PATHS: Record<CountdownIcon, React.ReactNode> = {
  kickoff: (
    <>
      <defs>
        <linearGradient id="cd-kick" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f1d68d" />
          <stop offset="1" stopColor="#63431e" />
        </linearGradient>
      </defs>
      <path
        d="M4 18c0-7.2 4.2-12.2 8-14.8 3.8 2.6 8 7.6 8 14.8"
        fill="url(#cd-kick)"
        fillOpacity="0.2"
      />
      <path d="M4 18c0-7.2 4.2-12.2 8-14.8 3.8 2.6 8 7.6 8 14.8" />
      <ellipse cx="12" cy="16.5" rx="7.5" ry="1.8" />
      <path d="M8.5 10.5 12 7l3.5 3.5M12 7v5.5" />
      <circle cx="12" cy="5.5" r="1.2" fill="currentColor" />
    </>
  ),
  trade: (
    <>
      <path d="M3.5 7.5h11.5" strokeWidth="2" />
      <path d="m13.2 4.2 3.3 3.3-3.3 3.3" strokeWidth="2" />
      <path d="M20.5 16.5H9" strokeWidth="2" />
      <path d="m10.8 13.2-3.3 3.3 3.3 3.3" strokeWidth="2" />
      <circle cx="6" cy="7.5" r="1.5" fill="currentColor" />
      <circle cx="18" cy="16.5" r="1.5" fill="currentColor" />
    </>
  ),
  draft: (
    <>
      <path
        d="M5 14.5V9.5c0-4 3.2-6.8 7-6.8s7 2.8 7 6.8v5"
        fill="currentColor"
        fillOpacity="0.12"
      />
      <path d="M5 14.5V9.5c0-4 3.2-6.8 7-6.8s7 2.8 7 6.8v5" />
      <path d="M4 14.5h16v2.5H4z" />
      <path d="M9 14.5V11h6v3.5" />
      <path d="M12 4.5v3M10 6.5h4" />
      <circle cx="12" cy="3.2" r="1" fill="currentColor" />
    </>
  ),
};

function FlipDigit({ value }: { value: string }) {
  const prev = useRef(value);
  const [flipping, setFlipping] = useState(false);

  useEffect(() => {
    if (prev.current !== value) {
      setFlipping(true);
      prev.current = value;
      const t = setTimeout(() => setFlipping(false), 320);
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <span
      className={[
        "countdown-digit",
        flipping && "countdown-digit-flip",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {value}
    </span>
  );
}

export function Countdown({
  label,
  targetISO,
  icon = "kickoff",
}: {
  label: string;
  targetISO: string;
  icon?: CountdownIcon;
}) {
  const target = new Date(targetISO).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const mounted = now != null;
  const remaining = mounted ? target - now : 0;
  const { days, hours, minutes, seconds } = parts(remaining);
  const passed = mounted && remaining <= 0;

  const cells: Array<[number, string]> = [
    [days, "DAYS"],
    [hours, "HRS"],
    [minutes, "MIN"],
    [seconds, "SEC"],
  ];

  return (
    <div className="countdown-row">
      <span className="countdown-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          {ICON_PATHS[icon]}
        </svg>
      </span>
      <div className="countdown-label">{label}</div>
      {!mounted ? (
        <div className="countdown-cells" aria-hidden="true">
          {cells.map(([, u]) => (
            <div key={u} className="text-center">
              <span className="countdown-digit">--</span>
              <span className="countdown-unit">{u}</span>
            </div>
          ))}
        </div>
      ) : passed ? (
        <div className="countdown-passed">Passed</div>
      ) : (
        <div className="countdown-cells">
          {cells.map(([v, u]) => (
            <div key={u} className="text-center">
              <FlipDigit value={String(v).padStart(2, "0")} />
              <span className="countdown-unit">{u}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
