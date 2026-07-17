/**
 * Dramatic close-up render of the custom WLFS championship ring.
 * Pure SVG — aged gold band, dark enamel face, gem bezel, 2026 engraving.
 */
export function ChampionshipRing({
  year,
  className,
}: {
  year: string | number;
  className?: string;
}) {
  const uid = `ring-${year}`;

  return (
    <div className={className ?? "championship-ring"} aria-hidden="true">
      <span className="championship-ring-halo" aria-hidden="true" />
      <svg viewBox="0 0 200 210" fill="none">
        <defs>
          <linearGradient id={`${uid}-band`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f5d896" />
            <stop offset="0.22" stopColor="#e8c078" />
            <stop offset="0.45" stopColor="#97672f" />
            <stop offset="0.68" stopColor="#63431e" />
            <stop offset="0.88" stopColor="#c99a55" />
            <stop offset="1" stopColor="#3a2410" />
          </linearGradient>
          <linearGradient id={`${uid}-bezel`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff4d4" />
            <stop offset="0.35" stopColor="#f1d68d" />
            <stop offset="0.65" stopColor="#c99a55" />
            <stop offset="1" stopColor="#5a3c18" />
          </linearGradient>
          <radialGradient id={`${uid}-face`} cx="0.5" cy="0.42" r="0.62">
            <stop offset="0" stopColor="#1a1108" />
            <stop offset="0.75" stopColor="#0a0704" />
            <stop offset="1" stopColor="#040302" />
          </radialGradient>
          <radialGradient id={`${uid}-spot`} cx="0.5" cy="0.28" r="0.75">
            <stop offset="0" stopColor="#f1d68d" stopOpacity="0.55" />
            <stop offset="0.45" stopColor="#c99a55" stopOpacity="0.2" />
            <stop offset="1" stopColor="#c99a55" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${uid}-gem`} cx="0.35" cy="0.28" r="0.85">
            <stop offset="0" stopColor="#fffef8" />
            <stop offset="0.18" stopColor="#fef3d0" />
            <stop offset="0.45" stopColor="#e8c078" />
            <stop offset="0.78" stopColor="#9a7124" />
            <stop offset="1" stopColor="#63431e" />
          </radialGradient>
          <linearGradient id={`${uid}-spec`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.65" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>

        <ellipse cx="100" cy="98" rx="98" ry="94" fill={`url(#${uid}-spot)`} />

        <path
          d="M100 200c-38 0-64-27-64-62 0-14 4-26 11-36l14 12c-5 7-7 15-7 24 0 27 20 46 46 46s46-19 46-46c0-9-2-17-7-24l14-12c7 10 11 22 11 36 0 35-26 62-64 62Z"
          fill={`url(#${uid}-band)`}
        />
        <path
          d="M47 102 61 114c3-5 7-9 11-12l-9-16c-6 4-12 9-16 16Zm106 0-14 12c-3-5-7-9-11-12l9-16c6 4 12 9 16 16Z"
          fill="#4a3010"
        />
        <path
          d="M52 118c14 8 32 8 48 0"
          stroke="#f1d68d"
          strokeWidth="1.2"
          opacity="0.35"
        />

        <text
          x="100"
          y="190"
          textAnchor="middle"
          fill="#f1d68d"
          opacity="0.85"
          fontFamily="Georgia, serif"
          fontSize="13"
          fontWeight="700"
          letterSpacing="3"
        >
          {year}
        </text>

        <ellipse cx="100" cy="82" rx="62" ry="60" fill={`url(#${uid}-bezel)`} />
        <ellipse
          cx="100"
          cy="74"
          rx="58"
          ry="18"
          fill={`url(#${uid}-spec)`}
          opacity="0.35"
        />
        <ellipse cx="100" cy="82" rx="54" ry="52" fill="#2a1a0a" />

        {Array.from({ length: 20 }).map((_, i) => {
          const a = (i / 20) * Math.PI * 2;
          const x = 100 + Math.cos(a) * 58;
          const y = 82 + Math.sin(a) * 56;
          const bright = i % 3 === 0;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={bright ? 3 : 2.4}
              fill={bright ? "#fffef0" : "#e8c078"}
              opacity={bright ? 0.95 : 0.75}
            />
          );
        })}

        <ellipse cx="100" cy="82" rx="48" ry="46" fill={`url(#${uid}-face)`} />
        <ellipse
          cx="100"
          cy="82"
          rx="48"
          ry="46"
          stroke="#d4a94e"
          strokeWidth="1.6"
        />

        <path id={`${uid}-arc`} d="M 62 92 A 42 40 0 0 1 138 92" fill="none" />
        <text
          fill="#e8c078"
          fontFamily="Georgia, serif"
          fontSize="10.5"
          fontWeight="700"
          letterSpacing="2.5"
        >
          <textPath href={`#${uid}-arc`} startOffset="50%" textAnchor="middle">
            CHAMPION
          </textPath>
        </text>

        <ellipse cx="100" cy="86" rx="26" ry="24" fill={`url(#${uid}-gem)`} />
        <ellipse cx="100" cy="86" rx="26" ry="24" stroke="#3a2410" strokeWidth="1.4" />
        <path
          d="M100 62v48M76 80l48 12M76 92l48-12M88 74l24 24M112 74L88 98"
          stroke="#fffef0"
          strokeWidth="0.6"
          opacity="0.5"
        />
        <ellipse cx="92" cy="78" rx="4" ry="3" fill="#fff" opacity="0.55" />
        <ellipse cx="108" cy="90" rx="2.5" ry="2" fill="#fff" opacity="0.35" />

        <text
          x="100"
          y="91"
          textAnchor="middle"
          fill="#1a1008"
          fontFamily="Georgia, serif"
          fontSize="15"
          fontWeight="800"
          letterSpacing="1"
        >
          WLFS
        </text>

        <text
          x="100"
          y="120"
          textAnchor="middle"
          fill="#f1d68d"
          fontFamily="Georgia, serif"
          fontSize="11"
          fontWeight="700"
          letterSpacing="4"
        >
          {year}
        </text>
        <path d="M96 48l4-7 4 7-4 3-4-3Z" fill="#fff4d4" opacity="0.95" />
        <circle cx="100" cy="44" r="1.2" fill="#fff" opacity="0.8" />
      </svg>
    </div>
  );
}
