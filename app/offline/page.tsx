import type { Metadata } from "next";
import Link from "next/link";
import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OfflinePagesList } from "@/components/pwa/offline-pages-list";
import { RetryButton } from "@/components/pwa/retry-button";

export const metadata: Metadata = {
  title: "You're offline",
  description: "This page isn't saved on your device yet.",
  robots: { index: false },
};

// Served by the service worker when a page that was never cached is requested without a connection.
export default function OfflinePage() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-8">
      <header>
        <p className="mb-2 flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-[0.14em] text-warning">
          <WifiOff aria-hidden className="size-4" />
          Offline
        </p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">This page isn&apos;t saved on this device yet</h1>
        <p className="mt-2 text-sm leading-6 text-muted sm:text-base">
          You can keep learning with the pages saved below: lessons, quizzes, the glossary and the simulated terminal
          all work offline. XP and progress keep saving on this device.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <RetryButton />
          <Button asChild variant="secondary" className="min-h-11">
            {/* Offline, a failed soft navigation falls back to a full load, which the service worker serves from cache. */}
            <Link href="/">Go to dashboard</Link>
          </Button>
        </div>
      </header>
      <OfflinePagesList />
    </div>
  );
}
