"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center px-6 py-12 text-center">
      <p className="font-display text-lg font-semibold uppercase tracking-[0.12em] text-offwhite/90">
        Something went wrong
      </p>
      <p className="mt-2 max-w-md text-sm text-offwhite/55">
        The page hit an unexpected error. Try refreshing — if the problem
        persists, restart the dev server.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="metal-button mt-6 px-6 py-2 text-xs uppercase tracking-[0.14em]"
      >
        Try again
      </button>
    </div>
  );
}
