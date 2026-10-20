"use client";

import { useId, useState } from "react";
import { Download, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePlatform } from "./platform";
import { usePwaState } from "./pwa-root";
import { setPwaState } from "./pwa-store";

interface InstallButtonProps {
  className?: string;
  /** "compact" for headers/top bars, "full" for settings or the dashboard. */
  variant?: "compact" | "full";
}

/**
 * Shows "Install app" only when the browser offers an install prompt (Chromium on Android/desktop),
 * or "Add to Home Screen" instructions on iOS Safari. Renders nothing when installed or unsupported.
 */
export function InstallButton({ className, variant = "compact" }: InstallButtonProps) {
  const { installEvent, installed, standalone } = usePwaState();
  const platform = usePlatform();
  const [showIosHelp, setShowIosHelp] = useState(false);
  const helpId = useId();

  if (standalone || installed || platform === null) return null;
  if (!installEvent && platform !== "ios") return null;

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
    <div className={cn("relative", className)}>
      <Button
        variant="secondary"
        className="min-h-11"
        onClick={install}
        aria-expanded={platform === "ios" ? showIosHelp : undefined}
        aria-controls={platform === "ios" ? helpId : undefined}
      >
        <Download aria-hidden />
        {variant === "full" ? "Install DevOps Quest" : "Install app"}
      </Button>
      {platform === "ios" && showIosHelp && (
        <div
          id={helpId}
          className="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-border bg-background-2 p-4 text-sm text-foreground shadow-card"
        >
          <p className="font-semibold">Install on iPhone or iPad</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted">
            <li>Open this page in Safari.</li>
            <li>
              Tap <strong className="font-medium text-foreground">Share</strong>{" "}
              <Share aria-label="share icon" className="inline size-4 align-text-bottom" />.
            </li>
            <li>
              Choose <strong className="font-medium text-foreground">Add to Home Screen</strong>, then{" "}
              <strong className="font-medium text-foreground">Add</strong>.
            </li>
          </ol>
          <p className="mt-2 text-xs text-subtle">Progress is saved on this device and doesn&apos;t sync to others.</p>
        </div>
      )}
    </div>
  );
}
