import Link from "next/link";

const FOOTER_LINKS = [
  { label: "Home", href: "/" },
  { label: "Teams", href: "/teams" },
  { label: "History", href: "/history" },
  { label: "Trophy Room", href: "/trophy-room" },
  { label: "Record Book", href: "/record-book" },
] as const;

export default function Footer() {
  return (
    <footer className="border-t border-gold/20 bg-background">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded bg-gold-metallic font-display text-sm font-bold text-background">
            W
          </span>
          <span className="font-display text-sm font-bold tracking-wide text-gold-metallic">
            We Live for Sundays
          </span>
        </div>

        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          {FOOTER_LINKS.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link text-sm">
              {item.label}
            </Link>
          ))}
        </nav>

        <p className="text-xs text-offwhite/40">
          © {new Date().getFullYear()} WLFS. Powered by the Sleeper API.
        </p>
      </div>
    </footer>
  );
}
