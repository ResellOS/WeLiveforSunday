export default function Footer() {
  return (
    <footer className="border-t border-gold/20 bg-background">
      <div className="mx-auto flex w-full max-w-[1920px] flex-col gap-3 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <p className="font-display text-sm font-bold tracking-wide text-gold-metallic">
          We Live for Sundays
        </p>
        <p className="text-xs uppercase tracking-wider text-offwhite/50 md:text-right">
          Built for Competition. Built for Legacy.
        </p>
      </div>
    </footer>
  );
}
