"use client";

import { useEffect, useState } from "react";
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

  const row = "flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3";

  return (
    <section aria-labelledby="pwa-settings-heading" className="rounded-xl border border-border p-4 sm:p-6">
      <h2 id="pwa-settings-heading" className="text-lg font-semibold">
        App &amp; offline
      </h2>
      <dl className="mt-2 divide-y divide-border text-sm">
        <div className={row}>
          <dt className="text-foreground/70">Connection</dt>
          <dd>{online ? "Online" : "Offline (using saved content)"}</dd>
        </div>
        <div className={row}>
          <dt className="text-foreground/70">Offline support</dt>
          <dd>
            {SW_LABEL[swStatus]}
            {swError && <span className="block text-amber-300">{swError}</span>}
          </dd>
        </div>
        <div className={row}>
          <dt className="text-foreground/70">Pages saved for offline</dt>
          <dd>{pageCount === null ? "Checking…" : pageCount}</dd>
        </div>
        <div className={row}>
          <dt className="text-foreground/70">Progress storage</dt>
          <dd>
            {storage === null
              ? "Checking…"
              : storage.localStorageWorks
                ? "Saving on this device"
                : "Unavailable — progress lasts only until you close the app"}
          </dd>
        </div>
        <div className={row}>
          <dt className="text-foreground/70">Space used</dt>
          <dd>{storage ? formatBytes(storage.usageBytes) : "…"}</dd>
        </div>
        <div className={row}>
          <dt className="text-foreground/70">Protected from automatic clearing</dt>
          <dd className="flex items-center gap-3">
            {storage?.persisted ? "Yes" : "No"}
            {storage?.canPersist && !storage.persisted && (
              <button
                type="button"
                onClick={requestPersistence}
                className="min-h-11 rounded-lg border border-border px-3 font-medium hover:bg-foreground/5 focus-visible:outline-2 focus-visible:outline-indigo-400"
              >
                Protect
              </button>
            )}
          </dd>
        </div>
        <div className={row}>
          <dt className="text-foreground/70">Installed as an app</dt>
          <dd className="flex items-center gap-3">
            {standalone || installed ? "Yes" : "No"}
            <InstallButton variant="full" />
          </dd>
        </div>
      </dl>
      {persistMessage && (
        <p role="status" className="mt-2 text-sm text-foreground/80">
          {persistMessage}
        </p>
      )}
      <p className="mt-4 text-sm text-foreground/70">
        Your progress is stored only in this browser on this device. It does not sync between devices or between
        the installed app and other browsers, and clearing site data removes it.
      </p>
    </section>
  );
}
