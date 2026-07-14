import Image from "next/image";
import { cn } from "@/lib/format";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function TeamAvatar({
  src,
  name,
  size = 40,
  className,
}: {
  src: string | null;
  name: string;
  size?: number;
  className?: string;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={size}
        height={size}
        className={cn("rounded-full border border-gold/20 object-cover", className)}
        unoptimized
      />
    );
  }
  return (
    <span
      style={{ width: size, height: size }}
      className={cn(
        "grid place-items-center rounded-full border border-gold/20 bg-gold/10 font-display text-xs font-bold text-gold",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
