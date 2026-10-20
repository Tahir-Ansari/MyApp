"use client";

import { useId, useState, useSyncExternalStore } from "react";
import { usePwaState } from "./pwa-root";
import { setPwaState } from "./pwa-store";

type Platform = "ios" | "other";

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  // iPadOS reports itself as Mac; touch support tells them apart.
  const isIos = /iPad|iPhone|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
  return isIos ? "ios" : "other";
}

const noopSubscribe = () => () => {};

interface InstallButtonProps {
  className?: string;
  /** "compact" for headers/top bars, "full" for settings or the dashboard. */
  variant?: "compact" | "full";
}

/**
 * Shows "Install app" only when the browser offers an install prompt (Chromium on Android/desktop),
 * or "Add to Home Screen" instructions on iOS Safari. Renders nothing when installed or unsupported.
 */
export function InstallButton({ className = "", variant = "compact" }: InstallButtonProps) {
  const { installEvent, installed, standalone } = usePwaState();
  const platform = useSyncExternalStore<Platform | null>(noopSubscribe, detectPlatform, () => null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const helpId = useId();

  if (standalone || installed || platform === null) return null;
  if (!installEvent && platform !== "ios") return null;

  const base =
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border px-3 text-sm font-medium text-foreground hover:bg-foreground/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400";

  async function install() {
    if (!installEvent) {
      setShowIosHelp((v) => !v);
      return;
    }
    try {
      await installEvent.prompt();
      const { outcome } = await installEvent.userChoice;
      // A prompt can only be used once; Chrome fires a new beforeinstallprompt if it is offered again.
      setPwaState({ installEvent: null, installed: outcome === "accepted" });
    } catch {
      setPwaState({ installEvent: null });
    }
  }

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={install}
        className={base}
        aria-expanded={platform === "ios" ? showIosHelp : undefined}
        aria-controls={platform === "ios" ? helpId : undefined}
      >
        <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v12m0 0-4-4m4 4 4-4M5 21h14" />
        </svg>
        {variant === "full" ? "Install DevOps Quest" : "Install app"}
      </button>
      {platform === "ios" && showIosHelp && (
        <div
          id={helpId}
          className="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-border bg-background p-4 text-sm text-foreground shadow-2xl"
        >
          <p className="font-semibold">Install on iPhone or iPad</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-foreground/80">
            <li>Open this page in Safari.</li>
            <li>
              Tap <strong>Share</strong> (the square with an arrow).
            </li>
            <li>
              Choose <strong>Add to Home Screen</strong>, then <strong>Add</strong>.
            </li>
          </ol>
          <p className="mt-2 text-foreground/60">Progress stays on this device and does not sync to others.</p>
        </div>
      )}
    </div>
  );
}
