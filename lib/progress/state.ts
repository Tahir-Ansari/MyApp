/**
 * The saved progress shape and its validation. Pure: safe to import from server and client code.
 */

export const PROGRESS_STORAGE_KEY = "dkq-progress-v1";
export const PROGRESS_VERSION = 1;

export interface ProgressState {
  version: typeof PROGRESS_VERSION;
  xp: number;
  /** Lesson slugs, in completion order. */
  completedLessons: string[];
  /** Challenge ids, in completion order. */
  completedChallenges: string[];
  /** Achievement ids awarded explicitly (e.g. by a quiz or challenge). */
  unlockedAchievements: string[];
  /** Local calendar days (YYYY-MM-DD) with learning activity on this device. */
  activityDays: string[];
}

export const EMPTY_PROGRESS: ProgressState = Object.freeze({
  version: PROGRESS_VERSION,
  xp: 0,
  completedLessons: [],
  completedChallenges: [],
  unlockedAchievements: [],
  activityDays: [],
}) as ProgressState;

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

function stringList(value: unknown, filter?: (s: string) => boolean): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  for (const item of value) {
    if (typeof item === "string" && item.length > 0 && item.length < 200 && (!filter || filter(item))) {
      seen.add(item);
    }
  }
  return [...seen];
}

/** Validates unknown data into a ProgressState. Anything malformed falls back to the empty state. */
export function parseProgress(raw: string | null | undefined): ProgressState {
  if (!raw) return EMPTY_PROGRESS;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return EMPTY_PROGRESS;
  }
  if (typeof data !== "object" || data === null) return EMPTY_PROGRESS;
  const obj = data as Record<string, unknown>;
  if (obj.version !== PROGRESS_VERSION) return EMPTY_PROGRESS;
  const xp = typeof obj.xp === "number" && Number.isFinite(obj.xp) && obj.xp > 0 ? Math.floor(obj.xp) : 0;
  return {
    version: PROGRESS_VERSION,
    xp,
    completedLessons: stringList(obj.completedLessons),
    completedChallenges: stringList(obj.completedChallenges),
    unlockedAchievements: stringList(obj.unlockedAchievements),
    activityDays: stringList(obj.activityDays, (s) => DAY_RE.test(s)).sort(),
  };
}
