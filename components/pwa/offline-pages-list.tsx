"use client";

import { useEffect, useState } from "react";
import { BookOpen, ChevronRight, LayoutGrid } from "lucide-react";
import { Card } from "@/components/ui/card";
import { listCachedPages, type CachedPage } from "./cache-info";

/** Lists pages that are genuinely in the offline cache, using plain links so navigation is served by the service worker. */
export function OfflinePagesList() {
  const [pages, setPages] = useState<CachedPage[] | null>(null);

  useEffect(() => {
    listCachedPages()
      .then(setPages)
      .catch(() => setPages([]));
  }, []);

  if (pages === null) return <p className="text-sm text-muted">Checking saved pages…</p>;
  if (pages.length === 0) {
    return (
      <Card className="bg-grid p-4 sm:p-5">
        <p className="font-medium">No pages saved on this device yet</p>
        <p className="mt-1 text-sm text-muted">Open the app once while online and it will save lessons for offline use.</p>
      </Card>
    );
  }

  // App sections first, then lessons.
  const sorted = [...pages.filter((p) => !p.path.startsWith("/lesson/")), ...pages.filter((p) => p.path.startsWith("/lesson/"))];

  return (
    <section aria-labelledby="offline-saved">
      <h2 id="offline-saved" className="mb-3 text-base font-semibold tracking-tight">
        Saved on this device <span className="font-mono text-xs font-normal text-muted">({pages.length})</span>
      </h2>
      <Card>
        <ul className="divide-y divide-border">
          {sorted.map((p) => {
            const Icon = p.path.startsWith("/lesson/") ? BookOpen : LayoutGrid;
            return (
              <li key={p.path}>
                {/* Plain <a>: a full navigation is answered from the cache while offline. */}
                <a href={p.path} className="flex min-h-11 items-center gap-3 px-4 py-2.5 text-sm hover:bg-surface-2">
                  <Icon aria-hidden className="size-4 shrink-0 text-subtle" />
                  <span className="min-w-0 flex-1 truncate">{p.label}</span>
                  <ChevronRight aria-hidden className="size-4 shrink-0 text-subtle" />
                </a>
              </li>
            );
          })}
        </ul>
      </Card>
    </section>
  );
}
