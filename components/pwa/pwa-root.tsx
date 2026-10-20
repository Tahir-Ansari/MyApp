"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useAppUpdateBlocked } from "./activity-guard";
import { getPwaState, getServerPwaState, setPwaState, subscribePwa } from "./pwa-store";

export function usePwaState() {
  return useSyncExternalStore(subscribePwa, getPwaState, getServerPwaState);
}

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;
const PROBE_INTERVAL_MS = 10_000;

/** Lightweight reachability check. HEAD requests bypass the service worker cache. */
async function probeServer(): Promise<boolean> {
  try {
    const res = await fetch("/manifest.webmanifest", { method: "HEAD", cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}

function useConnectivity() {
  useEffect(() => {
    let probeTimer: ReturnType<typeof setInterval> | undefined;
    let backTimer: ReturnType<typeof setTimeout> | undefined;

    const goOnline = () => {
      clearInterval(probeTimer);
      probeTimer = undefined;
      if (!getPwaState().online) {
        setPwaState({ online: true, backOnline: true });
        clearTimeout(backTimer);
        backTimer = setTimeout(() => setPwaState({ backOnline: false }), 4000);
      }
    };
    const goOffline = () => {
      setPwaState({ online: false, backOnline: false });
      // navigator.onLine can be true with no real internet ("lie-fi"), so poll until the server answers.
      if (!probeTimer) {
        probeTimer = setInterval(async () => {
          if (navigator.onLine && (await probeServer())) goOnline();
        }, PROBE_INTERVAL_MS);
      }
    };
    const onOnlineEvent = async () => {
      if (await probeServer()) goOnline();
      else goOffline();
    };

    if (!navigator.onLine) goOffline();
    window.addEventListener("online", onOnlineEvent);
    window.addEventListener("offline", goOffline);
    const onSwMessage = (e: MessageEvent) => {
      if (e.data?.type === "NETWORK_FAILED") goOffline();
    };
    navigator.serviceWorker?.addEventListener("message", onSwMessage);
    return () => {
      window.removeEventListener("online", onOnlineEvent);
      window.removeEventListener("offline", goOffline);
      navigator.serviceWorker?.removeEventListener("message", onSwMessage);
      clearInterval(probeTimer);
      clearTimeout(backTimer);
    };
  }, []);
}

function useServiceWorker() {
  useEffect(() => {
    setPwaState({
      standalone:
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true,
    });

    if (!("serviceWorker" in navigator)) {
      setPwaState({ swStatus: "unsupported" });
      return;
    }
    if (process.env.NODE_ENV !== "production") {
      // The SW is generated from the production build; never let a stale one serve the dev server.
      navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
      setPwaState({ swStatus: "disabled" });
      return;
    }

    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | undefined;
    let onVisible: (() => void) | undefined;
    const hadController = Boolean(navigator.serviceWorker.controller);

    const trackInstalling = (worker: ServiceWorker | null) => {
      worker?.addEventListener("statechange", () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller) setPwaState({ updateReady: true });
        if (worker.state === "activated" && !hadController) setPwaState({ offlineReadyJustNow: true });
        if (worker.state === "redundant" && !navigator.serviceWorker.controller) {
          setPwaState({ swStatus: "error", swError: "Offline caching did not finish. It will retry on your next visit." });
        }
      });
    };

    const checkForUpdate = (reg: ServiceWorkerRegistration) => {
      if (navigator.onLine) reg.update().catch(() => {}); // a failed check is harmless; we retry later
    };

    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((reg) => {
        if (cancelled) return;
        setPwaState({ swStatus: "ready" });
        if (reg.waiting && navigator.serviceWorker.controller) setPwaState({ updateReady: true });
        trackInstalling(reg.installing);
        reg.addEventListener("updatefound", () => trackInstalling(reg.installing));
        interval = setInterval(() => checkForUpdate(reg), UPDATE_CHECK_INTERVAL_MS);
        onVisible = () => {
          if (document.visibilityState === "visible") checkForUpdate(reg);
        };
        document.addEventListener("visibilitychange", onVisible);
      })
      .catch((err: unknown) => {
        // The app works without a service worker; it just loses offline support.
        setPwaState({ swStatus: "error", swError: err instanceof Error ? err.message : String(err) });
      });

    return () => {
      cancelled = true;
      clearInterval(interval);
      if (onVisible) document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
}

async function applyUpdate() {
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg?.waiting) {
    window.location.reload();
    return;
  }
  let reloaded = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloaded) return;
    reloaded = true;
    window.location.reload();
  });
  reg.waiting.postMessage({ type: "SKIP_WAITING" });
}

function ConnectionBanner() {
  const { online, backOnline } = usePwaState();
  if (online && !backOnline) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center px-4 pt-[max(0.5rem,env(safe-area-inset-top))]">
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-auto flex max-w-md items-center gap-2 rounded-full border px-4 py-2 text-sm shadow-lg ${
          online
            ? "border-emerald-500/40 bg-emerald-950/90 text-emerald-100"
            : "border-amber-500/40 bg-amber-950/90 text-amber-100"
        }`}
      >
        <span aria-hidden className={`size-2 shrink-0 rounded-full ${online ? "bg-emerald-400" : "bg-amber-400"}`} />
        {online ? (
          <span>Back online.</span>
        ) : (
          <span>
            <strong className="font-semibold">Offline.</strong> Saved lessons still work, and progress saves on this
            device.
          </span>
        )}
      </div>
    </div>
  );
}

function Toast({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] flex justify-center px-4 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-6">
      <div
        role="status"
        aria-live="polite"
        className="flex w-full max-w-md flex-wrap items-center gap-3 rounded-xl border border-border bg-background p-4 text-sm text-foreground shadow-2xl"
      >
        {children}
      </div>
    </div>
  );
}

const btn =
  "min-h-11 rounded-lg px-4 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400";

function UpdateToast() {
  const { updateReady, offlineReadyJustNow } = usePwaState();
  const busy = useAppUpdateBlocked();
  const [dismissed, setDismissed] = useState(false);

  if (updateReady && !busy && !dismissed) {
    return (
      <Toast>
        <p className="min-w-0 flex-1">
          <strong className="font-semibold">A new version is ready.</strong> Refresh when it suits you — your progress
          is kept.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            className={`${btn} text-foreground/70 hover:text-foreground`}
            // The waiting worker also activates on its own once every tab/window of the app is closed.
            onClick={() => setDismissed(true)}
          >
            Later
          </button>
          <button type="button" className={`${btn} bg-indigo-500 text-white hover:bg-indigo-400`} onClick={applyUpdate}>
            Refresh
          </button>
        </div>
      </Toast>
    );
  }
  if (offlineReadyJustNow) {
    return (
      <Toast>
        <p className="min-w-0 flex-1">
          <strong className="font-semibold">Ready for offline learning.</strong> Lessons, quizzes, the glossary and the
          terminal now work without a connection.
        </p>
        <button
          type="button"
          className={`${btn} bg-indigo-500 text-white hover:bg-indigo-400`}
          onClick={() => setPwaState({ offlineReadyJustNow: false })}
        >
          Got it
        </button>
      </Toast>
    );
  }
  return null;
}

/** Mount once in the root layout. Registers the service worker and renders connectivity/update notices. */
export function PwaRoot() {
  useServiceWorker();
  useConnectivity();
  return (
    <>
      <ConnectionBanner />
      <UpdateToast />
    </>
  );
}
