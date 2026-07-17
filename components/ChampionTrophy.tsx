/** Dimensional gold championship trophy with engraved year plate. */
export function ChampionTrophy({ year }: { year: string | number }) {
  return (
    <div className="champion-trophy" aria-hidden="true">
      <svg viewBox="0 0 120 140" fill="none">
        <defs>
          <linearGradient id="trophy-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#e8c078" />
            <stop offset="0.42" stopColor="#c99a54" />
            <stop offset="0.72" stopColor="#8a5f28" />
            <stop offset="1" stopColor="#b9813d" />
          </linearGradient>
          <linearGradient id="trophy-gold-dark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#9c6c32" />
            <stop offset="1" stopColor="#4a3010" />
          </linearGradient>
          <radialGradient id="trophy-glow" cx="0.5" cy="0.42" r="0.65">
            <stop offset="0" stopColor="#c99a54" stopOpacity="0.35" />
            <stop offset="1" stopColor="#c99a54" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="60" cy="52" r="52" fill="url(#trophy-glow)" />
        <path
          d="M22 22h12v6h-7c-1 10 3 17 11 20l-2 6C24 50 18 38 22 22Zm76 0H86v6h7c1 10-3 17-11 20l2 6c12-4 18-16 14-32Z"
          fill="url(#trophy-gold-dark)"
        />
        <path
          d="M34 14h52v18c0 17-9 30-26 35-17-5-26-18-26-35V14Z"
          fill="url(#trophy-gold)"
        />
        <path d="M34 14h52v5H34z" fill="#e8c078" opacity="0.5" />
        <path
          d="m60 28 3.4 6.9 7.6 1.1-5.5 5.4 1.3 7.6L60 45.4 53.2 49l1.3-7.6-5.5-5.4 7.6-1.1L60 28Z"
          fill="#4a3010"
        />
        <path d="M56 67h8v14h-8z" fill="url(#trophy-gold-dark)" />
        <path d="M50 81h20l3 8H47l3-8Z" fill="url(#trophy-gold)" />
        <path d="M42 89h36v22H42z" fill="url(#trophy-gold-dark)" />
        <rect
          x="46"
          y="93"
          width="28"
          height="14"
          fill="#20150a"
          stroke="#c99a54"
          strokeWidth="1"
        />
        <text
          x="60"
          y="103.5"
          textAnchor="middle"
          fill="#d0a05b"
          fontFamily="Georgia, serif"
          fontSize="10"
          fontWeight="600"
          letterSpacing="1"
        >
          {year}
        </text>
        <path d="M38 111h44v6H38z" fill="url(#trophy-gold)" />
        <path d="M34 117h52v6H34z" fill="url(#trophy-gold-dark)" />
      </svg>
    </div>
  );
}
