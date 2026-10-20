"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getStorageInfo, listCachedPages, type StorageInfo } from "./cache-info";
import { InstallButton } from "./install-button";
import { usePwaState } from "./pwa-root";

function formatBytes(n: number | null): string {
  if (n === null) return "unknown";
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

const SW_LABEL = {
  unsupported: "Not supported in this browser — the app works online only.",
  disabled: "Off in development mode.",
  registering: "Setting up…",
  ready: "Active",
  error: "Unavailable",
} as const;

/** "App & offline" section for the settings page. */
export function OfflineSettingsPanel() {
  const { swStatus, swError, standalone, installed, online } = usePwaState();
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [storage, setStorage] = useState<StorageInfo | null>(null);
  const [persistMessage, setPersistMessage] = useState<string | null>(null);

  useEffect(() => {
    listCachedPages()
      .then((p) => setPageCount(p.length))
      .catch(() => setPageCount(0));
    getStorageInfo()
      .then(setStorage)
      .catch(() => setStorage(null));
  }, [swStatus]);

  async function requestPersistence() {
    const granted = await navigator.storage?.persist?.().catch(() => false);
    setPersistMessage(
      granted
        ? "Storage is protected. The browser won't clear it automatically when space runs low."
        : "The browser didn't grant protected storage. Installing the app usually enables it.",
    );
    setStorage(await getStorageInfo());
  }

  const row = "flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 sm:px-5";

  return (
    <section aria-labelledby="pwa-settings-heading">
      <h2 id="pwa-settings-heading" className="mb-3 text-base font-semibold tracking-tight">
        App &amp; offline
      </h2>
      <Card>
        <dl className="divide-y divide-border text-sm">
          <div className={row}>
            <dt className="text-muted">Connection</dt>
            <dd>{online ? "Online" : "Offline (using saved content)"}</dd>
          </div>
          <div className={row}>
            <dt className="text-muted">Offline support</dt>
            <dd className="min-w-0">
              {SW_LABEL[swStatus]}
              {swError && (
                <span className="mt-1 flex items-start gap-1.5 text-xs text-warning">
                  <AlertTriangle aria-hidden className="mt-0.5 size-3.5 shrink-0" />
                  {swError}
                </span>
              )}
            </dd>
          </div>
          <div className={row}>
            <dt className="text-muted">Pages saved for offline</dt>
            <dd className="font-mono">{pageCount === null ? "…" : pageCount}</dd>
          </div>
          <div className={row}>
            <dt className="text-muted">Progress storage</dt>
            <dd>
              {storage === null ? (
                "Checking…"
              ) : storage.localStorageWorks ? (
                "Saving on this device"
              ) : (
                <span className="flex items-center gap-1.5 text-warning">
                  <AlertTriangle aria-hidden className="size-4" />
                  Unavailable — progress lasts only until you close the app
                </span>
              )}
            </dd>
          </div>
          <div className={row}>
            <dt className="text-muted">Space used</dt>
            <dd className="font-mono">{storage ? formatBytes(storage.usageBytes) : "…"}</dd>
          </div>
          <div className={row}>
            <dt className="text-muted">Protected from automatic clearing</dt>
            <dd className="flex items-center gap-3">
              {storage?.persisted ? "Yes" : "No"}
              {storage?.canPersist && !storage.persisted && (
                <Button variant="secondary" className="min-h-11" onClick={requestPersistence}>
                  Protect
                </Button>
              )}
            </dd>
          </div>
          <div className={row}>
            <dt className="text-muted">Installed as an app</dt>
            <dd className="flex items-center gap-3">
              {standalone || installed ? "Yes" : "No"}
              <InstallButton variant="full" />
            </dd>
          </div>
        </dl>
        {persistMessage && (
          <p role="status" className="border-t border-border px-4 py-3 text-sm text-muted sm:px-5">
            {persistMessage}
          </p>
        )}
      </Card>
      <p className="mt-3 flex items-start gap-2 text-sm text-muted">
        <HardDrive aria-hidden className="mt-0.5 size-4 shrink-0 text-subtle" />
        Your progress is saved only in this browser on this device. It doesn&apos;t sync between devices, or between
        the installed app and other browsers, and clearing site data removes it.
      </p>
    </section>
  );
}
