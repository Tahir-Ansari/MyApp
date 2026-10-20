"use client";

import { useEffect, useId, useState, useSyncExternalStore } from "react";
import { Download, Share, SquarePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePwaState } from "./pwa-root";
import { setPwaState } from "./pwa-store";

/** Wait a moment after the page loads so the prompt never ambushes the learner. */
const SHOW_DELAY_MS = 4000;
/** "Not now" hides the prompt for this long. */
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;
const SNOOZE_KEY = "dkq-install-prompt-snoozed-until";

type Platform = "ios" | "other";

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  // iPadOS reports itself as Mac; touch support tells them apart.
  const isIos = /iPad|iPhone|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
  return isIos ? "ios" : "other";
}

const noopSubscribe = () => () => {};

function isSnoozed(): boolean {
  try {
    return Number(localStorage.getItem(SNOOZE_KEY) ?? 0) > Date.now();
  } catch {
    return false;
  }
}

function snooze() {
  try {
    localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS));
  } catch {
    // Storage blocked: the prompt simply comes back on the next visit.
  }
}

/**
 * Invites visitors to install the app a few seconds after they arrive.
 * Chromium (Android/desktop): opens the browser's install dialog. iOS Safari: shows Add to Home Screen steps.
 * Hidden when already installed, when the browser can't install, while other system notices are showing,
 * and for 7 days after "Not now". Render inside PwaRoot's notice stack.
 */
export function InstallPrompt() {
  const { installEvent, installed, standalone, updateReady, offlineReadyJustNow } = usePwaState();
  const platform = useSyncExternalStore<Platform | null>(noopSubscribe, detectPlatform, () => null);
  const [ready, setReady] = useState(false);
  const [closed, setClosed] = useState(false);
  const [showIosSteps, setShowIosSteps] = useState(false);
  const titleId = useId();
  const stepsId = useId();

  useEffect(() => {
    if (isSnoozed()) return;
    const timer = setTimeout(() => setReady(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const canInstall = Boolean(installEvent) || platform === "ios";
  if (!ready || closed || standalone || installed || !canInstall) return null;
  // One system notice at a time: update and offline-ready notices take priority.
  if (updateReady || offlineReadyJustNow) return null;

  function dismiss() {
    snooze();
    setClosed(true);
  }

  async function install() {
    if (!installEvent) {
      setShowIosSteps((v) => !v);
      return;
    }
    try {
      await installEvent.prompt();
      const { outcome } = await installEvent.userChoice;
      // A prompt can only be used once; Chrome fires a new beforeinstallprompt if it is offered again.
      setPwaState({ installEvent: null, installed: outcome === "accepted" });
      if (outcome === "dismissed") snooze();
    } catch {
      setPwaState({ installEvent: null });
    }
    setClosed(true);
  }

  return (
    <section
      aria-labelledby={titleId}
      className="pointer-events-auto relative w-full rounded-xl border border-accent-border bg-surface-2 p-4 pr-12 text-sm text-foreground shadow-card"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="grid size-10 shrink-0 place-items-center rounded-lg border border-accent-border bg-accent-soft text-accent-strong"
        >
          <Download className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id={titleId} className="font-semibold">
            Install DevOps Quest
          </h2>
          <p className="mt-0.5 leading-6 text-muted">
            Open it from your home screen and keep learning offline. Progress stays on this device.
          </p>
        </div>
      </div>

      {platform === "ios" && showIosSteps && (
        <ol id={stepsId} className="mt-3 list-decimal space-y-1 rounded-lg bg-surface p-3 pl-8 text-muted">
          <li>Open this page in Safari.</li>
          <li>
            Tap <strong className="font-medium text-foreground">Share</strong>{" "}
            <Share aria-hidden className="inline size-4 align-text-bottom text-foreground" />
          </li>
          <li>
            Choose <strong className="font-medium text-foreground">Add to Home Screen</strong>{" "}
            <SquarePlus aria-hidden className="inline size-4 align-text-bottom text-foreground" />, then{" "}
            <strong className="font-medium text-foreground">Add</strong>.
          </li>
        </ol>
      )}

      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <Button variant="ghost" className="min-h-11" onClick={dismiss}>
          Not now
        </Button>
        <Button
          className="min-h-11"
          onClick={install}
          aria-expanded={platform === "ios" ? showIosSteps : undefined}
          aria-controls={platform === "ios" && showIosSteps ? stepsId : undefined}
        >
          <Download aria-hidden />
          {platform === "ios" ? (showIosSteps ? "Hide steps" : "How to install") : "Install app"}
        </Button>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="absolute right-1.5 top-1.5 min-h-11 min-w-11"
        onClick={dismiss}
        aria-label="Dismiss install prompt"
      >
        <X aria-hidden />
      </Button>
    </section>
  );
}
