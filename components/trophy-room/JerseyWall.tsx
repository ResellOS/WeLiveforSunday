import Image from "next/image";
import { Panel } from "@/components/ui/Panel";
import type { JerseyRow } from "@/lib/queries";

const VAULT_YEARS = [2026, 2027, 2028, 2029];
const INAUGURAL_YEAR = 2026;

export function JerseyWall({
  jerseyByYear,
}: {
  jerseyByYear: Map<number, JerseyRow>;
}) {
  return (
    <div className="tr-jersey-wall-panel tr-panel-enter tr-panel-enter-delay-1">
      <Panel className="panel--jerseys p-0">
        <div className="tr-jersey-wall-stage">
          <Image
            src="/images/trophy-jersey-art.png"
            alt="Championship jersey wall — inaugural seasons 2026 through 2029"
            fill
            className="tr-jersey-wall-bg"
            sizes="(min-width: 1024px) 60vw, 100vw"
            priority
          />
          <span className="tr-jersey-wall-glow" aria-hidden="true" />
          <span className="tr-jersey-wall-spotlight" aria-hidden="true" />

          <div className="tr-jersey-wall-slots">
            {VAULT_YEARS.map((year) => {
              const jersey = jerseyByYear.get(year);
              const isInaugural = year === INAUGURAL_YEAR;
              const hasJersey = Boolean(jersey?.image_url);
              const headline =
                jersey?.player_name ??
                (isInaugural ? "Champion's Jersey" : "Awaiting Champion");

              return (
                <div
                  key={year}
                  className={[
                    "tr-jersey-slot",
                    isInaugural || hasJersey ? "tr-jersey-slot-active" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <div className="tr-jersey-slot-glass">
                    {hasJersey && jersey?.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={jersey.image_url}
                        alt={jersey.player_name ?? "Championship jersey"}
                        className="tr-jersey-slot-photo"
                      />
                    ) : null}
                  </div>
                  {hasJersey ? (
                    <div className="tr-jersey-slot-plaque">
                      <span className="tr-jersey-slot-year">{year}</span>
                      <span className="tr-jersey-slot-headline">{headline}</span>
                    </div>
                  ) : (
                    <span className="sr-only">
                      {year} — {headline}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Panel>
    </div>
  );
}
