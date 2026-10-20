"use client";

// Tiny external store for PWA state (service worker, install prompt, connectivity).
// Self-contained on purpose: no app imports, so it can be mounted anywhere.

export type SwStatus = "unsupported" | "disabled" | "registering" | "ready" | "error";

/** Chromium-only event; not in lib.dom.d.ts. */
export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export interface PwaState {
  swStatus: SwStatus;
  swError: string | null;
  /** A new service worker has installed and is waiting for the learner to refresh. */
  updateReady: boolean;
  /** Set once after the first service worker activates (offline caching finished). */
  offlineReadyJustNow: boolean;
  online: boolean;
  /** Set briefly after connectivity returns. */
  backOnline: boolean;
  installEvent: BeforeInstallPromptEvent | null;
  installed: boolean;
  standalone: boolean;
}

const serverState: PwaState = {
  swStatus: "registering",
  swError: null,
  updateReady: false,
  offlineReadyJustNow: false,
  online: true,
  backOnline: false,
  installEvent: null,
  installed: false,
  standalone: false,
};

let state: PwaState = serverState;
const listeners = new Set<() => void>();

export function getPwaState(): PwaState {
  return state;
}
export function getServerPwaState(): PwaState {
  return serverState;
}
export function subscribePwa(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export function setPwaState(patch: Partial<PwaState>): void {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

// Capture the install prompt as early as possible: it can fire before any component mounts.
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    setPwaState({ installEvent: e as BeforeInstallPromptEvent });
  });
  window.addEventListener("appinstalled", () => {
    setPwaState({ installEvent: null, installed: true });
    // Installed apps get persistent storage in Chromium; ask anyway so progress and caches are not evicted.
    navigator.storage?.persist?.().catch(() => {});
  });
}
