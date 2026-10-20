import type { Metadata } from "next";
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
    <main className="mx-auto w-full max-w-2xl px-4 py-10 pb-[calc(6rem+env(safe-area-inset-bottom))]">
      <p className="text-sm font-medium text-amber-300">Offline</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">This page isn&apos;t saved on this device yet</h1>
      <p className="mt-3 text-foreground/75">
        You can keep learning with the lessons, quizzes, glossary and simulated terminal saved below. Your XP and
        progress keep saving on this device while you&apos;re offline.
      </p>
      <div className="mt-5">
        <RetryButton />
      </div>
      <div className="mt-8">
        <OfflinePagesList />
      </div>
    </main>
  );
}
