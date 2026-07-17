import { cn } from "@/lib/format";

export function Panel({
  className,
  children,
  hover = false,
}: {
  className?: string;
  children: React.ReactNode;
  hover?: boolean;
}) {
  const tokens = (className ?? "").split(/\s+/).filter(Boolean);
  const shellKeep = new Set([
    "home-col-foot",
    "home-col-fill",
    "home-area-featured",
    "home-area-motw",
    "home-area-closest",
    "home-area-countdown",
    "home-area-standings",
    "home-area-news",
    "home-area-matchups",
    "home-area-champion",
    "home-area-ticker",
    "home-area-performers",
  ]);

  const shellClass = tokens
    .filter((c) => c.startsWith("panel--") || shellKeep.has(c))
    .join(" ");
  const bodyClass = tokens
    .filter((c) => !c.startsWith("panel--") && !shellKeep.has(c))
    .join(" ");

  return (
    <section className={cn("panel", hover && "panel-hover", shellClass)}>
      <span className="panel-frame" aria-hidden="true" />
      <span className="corner corner-tl" aria-hidden="true" />
      <span className="corner corner-tr" aria-hidden="true" />
      <span className="corner corner-bl" aria-hidden="true" />
      <span className="corner corner-br" aria-hidden="true" />
      <div className={cn("panel-body", bodyClass)}>{children}</div>
    </section>
  );
}

export function SectionHeading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="section-subtitle">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-8 text-center">
      <p className="font-display text-sm font-semibold uppercase tracking-[0.1em] text-offwhite/80">
        {title}
      </p>
      <p className="mt-1 max-w-sm text-xs text-offwhite/50">{message}</p>
    </div>
  );
}
