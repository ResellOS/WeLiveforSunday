import { cn } from "@/lib/format";

export function StatTile({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("panel px-4 py-3 text-center", className)}>
      <div className="font-display text-2xl font-bold text-gold-metallic">
        {value}
      </div>
      <div className="mt-0.5 text-[11px] uppercase tracking-wider text-offwhite/50">
        {label}
      </div>
      {hint && <div className="mt-0.5 text-[11px] text-offwhite/40">{hint}</div>}
    </div>
  );
}

/** Horizontal row of stat tiles that wraps on small screens. */
export function StatBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {children}
    </div>
  );
}
