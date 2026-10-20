"use client";

import { useEffect, useState } from "react";
import { listCachedPages, type CachedPage } from "./cache-info";

/** Lists pages that are genuinely in the offline cache, using plain links so navigation is served by the service worker. */
export function OfflinePagesList() {
  const [pages, setPages] = useState<CachedPage[] | null>(null);

  useEffect(() => {
    listCachedPages()
      .then(setPages)
      .catch(() => setPages([]));
  }, []);

  if (pages === null) return <p className="text-foreground/60">Checking saved pages…</p>;
  if (pages.length === 0) {
    return (
      <p className="text-foreground/70">
        No pages are saved on this device yet. Open the app once while online and it will save lessons for offline use.
      </p>
    );
  }

  const core = pages.filter((p) => !p.path.startsWith("/lesson/"));
  const lessons = pages.filter((p) => p.path.startsWith("/lesson/"));
  const link =
    "flex min-h-11 items-center rounded-lg border border-border px-3 text-sm hover:bg-foreground/5 focus-visible:outline-2 focus-visible:outline-indigo-400";

  return (
    <div className="space-y-6">
      <section aria-labelledby="offline-core">
        <h2 id="offline-core" className="text-sm font-semibold uppercase tracking-wide text-foreground/60">
          Available offline
        </h2>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          {core.map((p) => (
            <li key={p.path}>
              {/* Plain <a>: a full navigation is answered from the cache while offline. */}
              <a href={p.path} className={link}>
                {p.label}
              </a>
            </li>
          ))}
        </ul>
      </section>
      {lessons.length > 0 && (
        <details className="rounded-lg border border-border p-3">
          <summary className="min-h-11 cursor-pointer content-center text-sm font-medium">
            {lessons.length} saved lessons
          </summary>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {lessons.map((p) => (
              <li key={p.path}>
                <a href={p.path} className={link}>
                  {p.label}
                </a>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
