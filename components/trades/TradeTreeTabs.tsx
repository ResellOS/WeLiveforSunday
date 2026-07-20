"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/trades/tree", label: "Trade Tree" },
  { href: "/trades/history", label: "Trade History" },
  { href: "/trades/hall-of-fame", label: "Hall of Fame / Shame" },
] as const;

export function TradeTreeTabs() {
  const pathname = usePathname();

  return (
    <nav className="tt-tabs" aria-label="Trades sections">
      <div className="tt-tabs-track">
        {TABS.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={["tt-tab", active && "tt-tab--active"]
                .filter(Boolean)
                .join(" ")}
              aria-current={active ? "page" : undefined}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
