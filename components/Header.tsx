"use client";

import { useEffect, useState } from "react";
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
    label: "Trades",
    href: "/trades",
    icon: "/images/nav/historyicon.png",
    wide: false,
  },
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
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  // Close the mobile menu whenever the route changes (link navigation).
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Close on Escape, and lock body scroll while the menu is open.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [menuOpen]);

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

        {/* Desktop horizontal nav (≥1024px) — unchanged */}
        <nav className="site-nav" aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "nav-item",
                item.wide && "nav-item-wide",
                isActive(item.href) && "nav-item-active",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <NavIcon src={item.icon} />
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="header-tools">
          {/* Desktop-only inline tools (≥1024px) */}
          <div className="header-tools-inline">
            <SearchBar />
            <SeasonSelector />
          </div>

          {/* Mobile hamburger (<1024px) */}
          <button
            type="button"
            className="nav-toggle"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-haspopup="menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className="nav-toggle-box" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          </button>
        </div>
      </div>

      {/* Tap-outside-to-close overlay */}
      <div
        className={`mobile-menu-overlay${menuOpen ? " is-open" : ""}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Slide-in mobile menu */}
      <aside
        id="mobile-menu"
        className={`mobile-menu${menuOpen ? " is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
      >
        <div className="mobile-menu-header">
          <span className="mobile-menu-title">Menu</span>
          <button
            type="button"
            className="mobile-menu-close"
            aria-label="Close navigation menu"
            onClick={() => setMenuOpen(false)}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <nav className="mobile-nav" aria-label="Mobile primary">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-nav-link${
                isActive(item.href) ? " mobile-nav-link-active" : ""
              }`}
              onClick={() => setMenuOpen(false)}
              aria-current={isActive(item.href) ? "page" : undefined}
            >
              <NavIcon src={item.icon} />
              <span className="mobile-nav-link-label">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="mobile-menu-tools">
          <SearchBar />
          <SeasonSelector />
        </div>
      </aside>
    </header>
  );
}
