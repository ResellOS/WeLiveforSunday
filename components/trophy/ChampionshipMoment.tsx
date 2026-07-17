/**
 * Cinematic future championship moment: raised trophy, indistinct crowd
 * silhouettes, confetti, and stadium backlighting — no identifiable people.
 */
export function ChampionshipMoment() {
  return (
    <div className="champ-moment-scene" aria-hidden="true">
      <svg viewBox="0 0 260 130" fill="none" preserveAspectRatio="xMidYMax slice">
        <defs>
          <radialGradient id="moment-light" cx="0.5" cy="0.12" r="0.9">
            <stop offset="0" stopColor="#f1d68d" stopOpacity="0.55" />
            <stop offset="0.35" stopColor="#c99a55" stopOpacity="0.28" />
            <stop offset="0.7" stopColor="#63431e" stopOpacity="0.12" />
            <stop offset="1" stopColor="#040505" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="moment-trophy" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff4d4" />
            <stop offset="0.4" stopColor="#f1d68d" />
            <stop offset="1" stopColor="#97672f" />
          </linearGradient>
          <linearGradient id="moment-smoke" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#040505" stopOpacity="0.95" />
            <stop offset="0.5" stopColor="#63431e" stopOpacity="0.15" />
            <stop offset="1" stopColor="#040505" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="moment-vignette" cx="0.5" cy="0.5" r="0.72">
            <stop offset="0.55" stopColor="#040505" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity="0.75" />
          </radialGradient>
        </defs>

        <rect width="260" height="130" fill="#030302" />
        <ellipse cx="130" cy="22" rx="130" ry="88" fill="url(#moment-light)" />

        {/* light rays */}
        <path
          d="M130 0 118 52h24L130 0Zm-48 8-18 44h14l-20-44Zm96 0 20 44h-14l18-44Z"
          fill="#f1d68d"
          opacity="0.06"
        />

        <path d="M0 44h260v6H0zM0 58h260v4H0z" fill="#0b0906" />
        <path d="M36 12l6 32h3l-6-32h-3Zm182 0-6 32h-3l6-32h3Z" fill="#151009" />
        <circle cx="37" cy="10" r="5" fill="#f1d68d" opacity="0.7" />
        <circle cx="219" cy="10" r="5" fill="#f1d68d" opacity="0.7" />
        <circle cx="37" cy="10" r="8" fill="#f1d68d" opacity="0.12" />
        <circle cx="219" cy="10" r="8" fill="#f1d68d" opacity="0.12" />

        {[
          [58, 24], [84, 14], [104, 34], [122, 10], [142, 28], [162, 16],
          [184, 30], [206, 20], [72, 44], [150, 44], [196, 46], [116, 50],
          [48, 18], [174, 8], [138, 38], [92, 32], [218, 36], [66, 52],
        ].map(([x, y], i) => (
          <rect
            key={i}
            x={x}
            y={y}
            width={i % 4 === 0 ? 4 : 3}
            height={i % 4 === 0 ? 4 : 3}
            fill={i % 3 === 0 ? "#fff4d4" : i % 3 === 1 ? "#f1d68d" : "#c99a55"}
            opacity={0.55 + (i % 5) * 0.08}
            transform={`rotate(${(i * 37) % 90} ${x} ${y})`}
          />
        ))}

        <rect width="260" height="130" fill="url(#moment-smoke)" />
        <rect width="260" height="130" fill="url(#moment-vignette)" />

        <path
          d="M0 130v-32c10-6 18-4 26-10 8 6 14 2 22 9 8-8 16-3 24-10 9 7 15 3 24 10 8-7 18-4 26-9v42H0Z"
          fill="#070605"
        />
        <path
          d="M138 130v-40c9-6 17-3 25-9 8 6 15 2 23 9 8-8 17-3 25-10 9 7 16 3 25 10 8-6 16-4 24-9v49H138Z"
          fill="#070605"
        />

        <path
          d="M122 130v-30c0-6 3-11 8-13 5 2 8 7 8 13v30h-16Z"
          fill="#0b0906"
        />
        <path
          d="M120 92l-8-18 5-2 7 14m20 6 8-18-5-2-7 14"
          stroke="#0b0906"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <circle cx="130" cy="84" r="7" fill="#0b0906" />

        <ellipse cx="130" cy="58" rx="22" ry="18" fill="#f1d68d" opacity="0.08" />
        <path
          d="M120 56h20v7c0 7-4 12-10 14-6-2-10-7-10-14v-7Z"
          fill="url(#moment-trophy)"
        />
        <path
          d="M116 58h-5c0 6 3 10 8 12m26-12h5c0 6-3 10-8 12"
          stroke="#c99a55"
          strokeWidth="2.4"
        />
        <path d="M127 77h6v6h-6zM123 83h14v4h-14z" fill="url(#moment-trophy)" />
        <ellipse cx="130" cy="56" rx="8" ry="4" fill="#fff" opacity="0.25" />
      </svg>
    </div>
  );
}
