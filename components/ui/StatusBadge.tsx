import { cn } from "@/lib/format";
import type { ContenderStatus } from "@/lib/league";

const STYLES: Record<ContenderStatus, string> = {
  Contender: "border-gold/50 bg-gold/15 text-gold",
  "Playoff Hopeful": "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  Borderline: "border-offwhite/30 bg-offwhite/5 text-offwhite/70",
  Retooling: "border-sky-500/40 bg-sky-500/10 text-sky-300",
  Rebuilding: "border-crimson/50 bg-crimson/15 text-crimson-200",
};

export function StatusBadge({ status }: { status: ContenderStatus }) {
  return (
    <span
      className={cn(
        "inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide",
        STYLES[status],
      )}
    >
      {status}
    </span>
  );
}
