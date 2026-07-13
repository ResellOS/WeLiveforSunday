"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SeasonSelector from "@/components/SeasonSelector";
import SearchBar from "@/components/SearchBar";

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Teams", href: "/teams" },
  { label: "History", href: "/history" },
  { label: "Trophy Room", href: "/trophy-room" },
  { label: "Record Book", href: "/record-book" },
] as const;

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-gold/20 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        {/* Logo (left) */}
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-gold-metallic font-display text-lg font-bold text-background shadow-md shadow-gold/20">
            W
          </span>
          <span className="hidden font-display text-lg font-bold tracking-wide text-gold-metallic sm:inline">
            We Live for Sundays
          </span>
        </Link>

        {/* Primary nav */}
        <nav className="hidden items-center gap-6 lg:flex">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  isActive
                    ? "text-sm font-semibold text-gold"
                    : "nav-link text-sm font-medium"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: season selector + search */}
        <div className="ml-auto flex items-center gap-3">
          <SeasonSelector />
          <SearchBar />
        </div>
      </div>
    </header>
  );
}
