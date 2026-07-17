import Image from "next/image";

export const NAV_ICON_SIZE = 30;

export function NavIcon({ src }: { src: string }) {
  return (
    <span className="nav-icon-wrap">
      <span className="nav-icon-halo" aria-hidden="true" />
      <Image
        src={src}
        alt=""
        width={NAV_ICON_SIZE}
        height={NAV_ICON_SIZE}
        className="nav-icon"
        unoptimized
      />
    </span>
  );
}
