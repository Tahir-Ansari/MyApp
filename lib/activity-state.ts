"use client";

import { useBlockAppUpdate } from "@/components/pwa/activity-guard";

/**
 * Marks the learner as mid-activity (quiz, challenge, terminal task),
 * so app-level prompts such as "a new version is ready" wait until they finish.
 */
export function useActivityInProgress(active: boolean) {
  useBlockAppUpdate(active);
}
