/** Football-themed milestone icons for the history timeline feed. */
export function MomentIcon({ title }: { title: string }) {
  const key = title.toLowerCase();

  let glyph = (
    <>
      <circle cx="12" cy="12" r="7.5" />
      <path d="M8.5 12h7M12 8.5v7" />
    </>
  );

  if (key.includes("champion") || key.includes("crown") || key.includes("title")) {
    glyph = (
      <>
        <path d="M8 4.2h8v5.2c0 3.2-1.6 5.4-4 6.6-2.4-1.2-4-3.4-4-6.6V4.2Z" />
        <path d="M8 6H5.2v2.1c0 2.2 1.2 3.7 2.8 4.2M16 6h2.8v2.1c0 2.2-1.2 3.7-2.8 4.2" />
        <path d="M12 15.8V19M9.2 20.2h5.6" />
      </>
    );
  } else if (key.includes("kickoff") || key.includes("founded") || key.includes("opening")) {
    glyph = (
      <>
        <path d="M4 18c0-7.2 4.2-12.2 8-14.8 3.8 2.6 8 7.6 8 14.8" />
        <ellipse cx="12" cy="16.5" rx="7.5" ry="1.8" />
        <path d="M9 10.5 12 7l3 3.5" />
      </>
    );
  } else if (key.includes("rule")) {
    glyph = (
      <>
        <path d="M7 4.2h10v15.6H7z" />
        <path d="M9.5 8h5M9.5 11.5h5M9.5 15h3.5" />
      </>
    );
  } else if (key.includes("record") || key.includes("leader")) {
    glyph = (
      <>
        <path d="M12 3.5 14.8 9l5.7.8-4.2 4 1 5.6L12 17.8 8.7 19.4l1-5.6-4.2-4 5.7-.8L12 3.5Z" />
      </>
    );
  } else if (key.includes("trade")) {
    glyph = (
      <>
        <path d="M3.5 8.5h11.5" />
        <path d="m13.2 5.2 3.3 3.3-3.3 3.3" />
        <path d="M20.5 15.5H9" />
        <path d="m10.8 12.2-3.3 3.3 3.3 3.3" />
      </>
    );
  } else if (key.includes("comeback")) {
    glyph = (
      <>
        <path d="M5 14.5V9.5c0-4 3.2-6.8 7-6.8s7 2.8 7 6.8v5" />
        <path d="M9 14.5h6v3.5H9z" />
        <path d="m14 7 2-2 2 2" />
      </>
    );
  } else if (key.includes("draft")) {
    glyph = (
      <>
        <path d="M5 14.5V9.5c0-4 3.2-6.8 7-6.8s7 2.8 7 6.8v5" />
        <path d="M4 14.5h16v2.5H4z" />
        <path d="M12 4.5v3" />
      </>
    );
  } else if (key.includes("franchise") || key.includes("accepted") || key.includes("joined")) {
    glyph = (
      <>
        <circle cx="9" cy="8.5" r="2.6" />
        <circle cx="16.2" cy="9.2" r="2.1" />
        <path d="M3.8 18.8c.7-3.4 2.8-5.2 5.2-5.2s4.5 1.8 5.2 5.2" />
        <path d="M14.2 15.2c1.9.2 3.4 1.5 4 3.6" />
      </>
    );
  }

  return (
    <span className="moment-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none">
        {glyph}
      </svg>
    </span>
  );
}
