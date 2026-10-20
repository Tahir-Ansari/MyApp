import { useSyncExternalStore } from "react";
import { getLessonEntry } from "@/lib/curriculum/catalog";
import { toLocalDateKey } from "@/lib/utils";
import { getUnlockedAchievementIds } from "./achievements";
import { XP_REWARDS } from "./levels";
import { EMPTY_PROGRESS, PROGRESS_STORAGE_KEY, parseProgress, type ProgressState } from "./state";

/**
 * localStorage-backed progress store. Client-only at runtime; the server snapshot is the empty
 * state, so prerendered HTML and the first client render always show zero progress and hydrate
 * without mismatches, then update to the saved values.
 */

/** Fired in this tab after a write; the native "storage" event covers other tabs. */
const CHANGE_EVENT = "dkq-progress-change";

let cachedRaw: string | null | undefined;
let cachedState: ProgressState = EMPTY_PROGRESS;

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(PROGRESS_STORAGE_KEY);
  } catch {
    return null;
  }
}

function getSnapshot(): ProgressState {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedState = parseProgress(raw);
  }
  return cachedState;
}

function getServerSnapshot(): ProgressState {
  return EMPTY_PROGRESS;
}

function subscribe(onChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === PROGRESS_STORAGE_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

/** Current saved progress. Use only in client components. */
export function useProgress(): ProgressState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Persists progress. Returns false when storage is unavailable (private mode, quota, blocked). */
export function writeProgress(state: ProgressState): boolean {
  try {
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(state));
  } catch {
    return false;
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
  return true;
}

/** Removes all saved progress on this device. */
export function resetProgress(): boolean {
  try {
    window.localStorage.removeItem(PROGRESS_STORAGE_KEY);
  } catch {
    return false;
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
  return true;
}

/**
 * Pure: returns progress with a lesson marked complete. Awards lesson XP only on first completion,
 * records today's local date as an activity day, and records newly derivable achievements.
 * Not wired to any UI yet; the lesson player will call it.
 */
export function applyLessonCompletion(
  progress: ProgressState,
  slug: string,
  now: Date = new Date(),
): ProgressState {
  if (!getLessonEntry(slug) || progress.completedLessons.includes(slug)) return progress;
  const today = toLocalDateKey(now);
  const next: ProgressState = {
    ...progress,
    xp: progress.xp + XP_REWARDS.lesson,
    completedLessons: [...progress.completedLessons, slug],
    activityDays: progress.activityDays.includes(today)
      ? progress.activityDays
      : [...progress.activityDays, today].sort(),
  };
  const unlocked = new Set([...next.unlockedAchievements, ...getUnlockedAchievementIds(next)]);
  return { ...next, unlockedAchievements: [...unlocked] };
}
