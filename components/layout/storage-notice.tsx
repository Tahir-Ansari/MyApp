"use client";

import { AlertTriangle } from "lucide-react";
import { useStorageStatus } from "@/lib/progress/store";

/** Small, non-blocking notice when progress cannot be saved or had to be reset. */
export function StorageNotice() {
  const status = useStorageStatus();
  if (status !== "unavailable" && status !== "recovered") return null;
  return (
    <div className="mb-6 flex items-start gap-3 rounded-lg border border-warning/30 bg-surface-2 p-3 text-sm text-foreground">
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
      <p className="leading-6">
        {status === "unavailable" ? (
          <>
            <span className="font-medium">Progress can&apos;t be saved in this browser.</span>{" "}
            <span className="text-muted">Storage is blocked or full (private browsing can cause this). You can keep learning, but progress will reset when you close the tab.</span>
          </>
        ) : (
          <>
            <span className="font-medium">Saved progress couldn&apos;t be read and was reset.</span>{" "}
            <span className="text-muted">The stored data was damaged or from an unknown version.</span>
          </>
        )}
      </p>
    </div>
  );
}
