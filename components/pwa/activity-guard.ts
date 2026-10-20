"use client";

import { useEffect, useSyncExternalStore } from "react";

// Lets quiz, challenge, and terminal components tell the PWA layer "the learner is mid-activity",
// so the update prompt waits instead of inviting a reload that would lose their in-progress answers.

let activeCount = 0;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Call with `true` while an activity has unsaved, in-progress state. */
export function useBlockAppUpdate(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    activeCount++;
    notify();
    return () => {
      activeCount--;
      notify();
    };
  }, [active]);
}

/** True while any mounted component has called useBlockAppUpdate(true). */
export function useAppUpdateBlocked(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => activeCount > 0,
    () => false,
  );
}
