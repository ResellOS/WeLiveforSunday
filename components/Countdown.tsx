"use client";

import { useEffect, useState } from "react";

function parts(ms: number) {
  const clamped = Math.max(0, ms);
  const days = Math.floor(clamped / 86_400_000);
  const hours = Math.floor((clamped % 86_400_000) / 3_600_000);
  const minutes = Math.floor((clamped % 3_600_000) / 60_000);
  const seconds = Math.floor((clamped % 60_000) / 1000);
  return { days, hours, minutes, seconds };
}

export function Countdown({
  label,
  targetISO,
}: {
  label: string;
  /** Target instant as an ISO string (serializable across the server boundary). */
  targetISO: string;
}) {
  const target = new Date(targetISO).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = now == null ? target - Date.now() : target - now;
  const { days, hours, minutes, seconds } = parts(remaining);
  const passed = remaining <= 0;

  const cells: Array<[number, string]> = [
    [days, "D"],
    [hours, "H"],
    [minutes, "M"],
    [seconds, "S"],
  ];

  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-offwhite/50">
        {label}
      </div>
      {passed ? (
        <div className="mt-1 font-display text-lg font-bold text-crimson-300">
          Passed
        </div>
      ) : (
        <div className="mt-1 flex gap-2" suppressHydrationWarning>
          {cells.map(([v, u]) => (
            <div key={u} className="text-center">
              <span className="font-display text-xl font-bold tabular-nums text-gold-metallic">
                {String(v).padStart(2, "0")}
              </span>
              <span className="ml-0.5 text-[10px] text-offwhite/40">{u}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
