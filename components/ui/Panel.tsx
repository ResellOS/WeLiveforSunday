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
  return (
    <div className={cn("panel", hover && "panel-hover", className)}>
      {children}
    </div>
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
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-xl font-bold tracking-wide text-gold-metallic">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-sm text-offwhite/50">{subtitle}</p>
        )}
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
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gold/20 px-6 py-10 text-center">
      <span className="mb-2 text-2xl opacity-60">🏈</span>
      <p className="font-display text-sm font-semibold text-offwhite/80">
        {title}
      </p>
      <p className="mt-1 max-w-sm text-xs text-offwhite/50">{message}</p>
    </div>
  );
}
