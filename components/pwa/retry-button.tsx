"use client";

// The offline page is served in place of whatever URL was requested. Capture that URL at module load,
// before hydration can normalise the address bar, so "Try again" retries the page the learner wanted.
const requestedHref = typeof window !== "undefined" ? window.location.href : "";

export function RetryButton() {
  return (
    <button
      type="button"
      onClick={() => window.location.assign(requestedHref || window.location.href)}
      className="inline-flex min-h-11 items-center rounded-lg bg-indigo-500 px-4 text-sm font-medium text-white hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
    >
      Try again
    </button>
  );
}
