import Image from "next/image";
import { Panel } from "@/components/ui/Panel";
import { cn } from "@/lib/format";

export function ExhibitArtPanel({
  src,
  alt,
  width,
  height,
  className = "",
  priority = false,
  sizes = "(min-width: 1024px) 16vw, 92vw",
  animated = false,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
  animated?: boolean;
}) {
  return (
    <div className={cn("tr-exhibit-shell", animated && "tr-exhibit-animated", className)}>
      <Panel className="panel--rewards p-0 tr-exhibit-panel">
        <div className="tr-exhibit-art-wrap">
          <span className="tr-exhibit-art-glow" aria-hidden="true" />
          {animated ? (
            <>
              <span className="tr-exhibit-particles" aria-hidden="true" />
              <span className="tr-exhibit-shimmer" aria-hidden="true" />
            </>
          ) : null}
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            className="tr-exhibit-art-img"
            sizes={sizes}
            priority={priority}
          />
        </div>
      </Panel>
    </div>
  );
}
