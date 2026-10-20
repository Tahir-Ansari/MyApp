"use client";

// Reads what the service worker has actually cached, so the UI reports real offline availability
// instead of assuming every route works offline.

const CACHE_PREFIX = "dkq-";

export interface CachedPage {
  path: string;
  label: string;
}

function labelFor(path: string): string {
  if (path === "/") return "Dashboard";
  const parts = path.split("/").filter(Boolean);
  const words = (s: string) => s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  if (parts[0] === "lesson" && parts[1]) return `Lesson: ${words(parts[1])}`;
  return parts.map(words).join(" › ");
}

export async function listCachedPages(): Promise<CachedPage[]> {
  if (typeof caches === "undefined") return [];
  const names = (await caches.keys()).filter((n) => n.startsWith(CACHE_PREFIX));
  const paths = new Set<string>();
  for (const name of names) {
    const cache = await caches.open(name);
    for (const req of await cache.keys()) {
      const { pathname } = new URL(req.url);
      if (pathname.startsWith("/_next/") || pathname.includes(".") || pathname === "/offline") continue;
      paths.add(pathname);
    }
  }
  return [...paths].sort().map((path) => ({ path, label: labelFor(path) }));
}

export interface StorageInfo {
  usageBytes: number | null;
  quotaBytes: number | null;
  persisted: boolean | null;
  /** Whether this browser supports requesting persistent storage. */
  canPersist: boolean;
  localStorageWorks: boolean;
}

export async function getStorageInfo(): Promise<StorageInfo> {
  let localStorageWorks = false;
  try {
    const key = "__dkq_probe__";
    window.localStorage.setItem(key, "1");
    window.localStorage.removeItem(key);
    localStorageWorks = true;
  } catch {
    // private mode, blocked site data, or quota exceeded
  }
  const estimate = await navigator.storage?.estimate?.().catch(() => undefined);
  const persisted = (await navigator.storage?.persisted?.().catch(() => null)) ?? null;
  return {
    usageBytes: estimate?.usage ?? null,
    quotaBytes: estimate?.quota ?? null,
    persisted,
    canPersist: typeof navigator.storage?.persist === "function",
    localStorageWorks,
  };
}
