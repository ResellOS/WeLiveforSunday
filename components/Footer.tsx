export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="mx-auto flex w-full max-w-[1920px] flex-col gap-3 px-4 py-3 sm:px-5 md:flex-row md:items-center md:justify-between lg:px-6">
        <p className="footer-tagline">— We Live For Sundays —</p>
        <div className="flex items-center gap-3 self-end md:self-auto">
          <p className="footer-legacy">Built for Competition. Built for Legacy.</p>
          <svg
            className="footer-football"
            viewBox="0 0 28 20"
            fill="none"
            aria-hidden="true"
          >
            <path d="M3 16c1.2-7.3 6.1-12 13.4-12 3.4 0 5.8 1.2 7.7 3.5-1.2 7.3-6.1 12-13.4 12C7.3 19.5 4.9 18.3 3 16Z" />
            <path d="m10 7 6 6m-4.2-7.8 6 6M9.3 9.8l6 6" />
          </svg>
        </div>
      </div>
    </footer>
  );
}
