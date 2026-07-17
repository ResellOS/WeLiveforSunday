"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavIcon } from "@/components/NavIcon";
import SeasonSelector from "@/components/SeasonSelector";
import SearchBar from "@/components/SearchBar";

const NAV_ITEMS = [
  { label: "Home", href: "/", icon: "/images/nav/homeicon.png", wide: false },
  { label: "Teams", href: "/teams", icon: "/images/nav/teamsicon.png", wide: false },
  {
    label: "History",
    href: "/history",
    icon: "/images/nav/historyicon.png",
    wide: false,
  },
  {
    label: "Trophy Room",
    href: "/trophy-room",
    icon: "/images/nav/trophyroomicon.png",
    wide: true,
  },
  {
    label: "Record Book",
    href: "/record-book",
    icon: "/images/nav/recordbookicon.png",
    wide: true,
  },
] as const;

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="site-header sticky top-0 z-50">
      <div className="header-inner">
        <Link href="/" className="brand-logo-link" aria-label="WLFS home">
          <Image
            src="/logoalt.png"
            alt="WLFS — We Live for Sundays"
            width={1536}
            height={483}
            priority
            className="brand-logo-img"
          />
        </Link>

        <nav className="site-nav" aria-label="Primary">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "nav-item",
                  item.wide && "nav-item-wide",
                  isActive && "nav-item-active",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <NavIcon src={item.icon} />
                <span className="nav-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="header-tools">
          <SearchBar />
          <SeasonSelector />
        </div>
      </div>
    </header>
  );
}
