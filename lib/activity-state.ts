"use client";

import { useEffect } from "react";

/**
 * Tracks whether the learner is mid-activity (quiz, challenge, terminal task),
 * so app-level features such as an update prompt can wait until they finish.
 */

let activeCount = 0;
const listeners = new Set<(active: boolean) => void>();

export function isActivityInProgress() {
  return activeCount > 0;
}

export function onActivityChange(listener: (active: boolean) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useActivityInProgress(active: boolean) {
  useEffect(() => {
    if (!active) return;
    activeCount += 1;
    listeners.forEach((l) => l(activeCount > 0));
    return () => {
      activeCount -= 1;
      listeners.forEach((l) => l(activeCount > 0));
    };
  }, [active]);
}
