"use client";

import Image from "next/image";
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
      <div className="mx-auto flex h-16 w-full max-w-[1920px] items-center gap-6 px-4 sm:px-6 lg:px-8">
        {/* Official logo — full logoalt.png, uncropped */}
        <Link href="/" className="flex shrink-0 items-center">
          <Image
            src="/logoalt.png"
            alt="WLFS — We Live for Sundays"
            width={1536}
            height={483}
            priority
            className="h-12 w-auto"
          />
        </Link>

        {/* Primary nav — unchanged */}
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

        {/* Right: season selector + search — unchanged */}
        <div className="ml-auto flex items-center gap-3">
          <SeasonSelector />
          <SearchBar />
        </div>
      </div>
    </header>
  );
}
