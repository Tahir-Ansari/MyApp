import { STORAGE_KEY } from "./config";
import type { ChallengeRecord, ProgressState, QuizRecord, Settings, StorageStatus } from "./types";

/**
 * The only module that touches localStorage.
 * Everything else reads and writes progress through ./store.ts.
 */

export function createEmptyProgress(now: Date = new Date()): ProgressState {
  return {
    version: 1,
    createdAt: now.toISOString(),
    lessons: {},
    quizzes: {},
    activities: {},
    challenges: {},
    awards: {},
    achievements: {},
    activeDays: [],
    playgroundCommands: 0,
    settings: { motion: "system" },
  };
}

function getStorage(): Storage | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    const probe = "__dkq_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isString = (v: unknown): v is string => typeof v === "string";
const isNumber = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

function pickRecord<T>(value: unknown, guard: (v: unknown) => v is T): Record<string, T> {
  if (!isRecord(value)) return {};
  const out: Record<string, T> = {};
  for (const [k, v] of Object.entries(value)) if (guard(v)) out[k] = v;
  return out;
}

const isLesson = (v: unknown): v is { completedAt: string; localDate: string } =>
  isRecord(v) && isString(v.completedAt) && isString(v.localDate);

const isQuiz = (v: unknown): v is QuizRecord =>
  isRecord(v) && isNumber(v.bestScore) && isNumber(v.total) && isNumber(v.attempts) && typeof v.passed === "boolean" && typeof v.perfect === "boolean";

const isChallenge = (v: unknown): v is ChallengeRecord =>
  isRecord(v) && (v.status === "in-progress" || v.status === "completed") && isString(v.startedAt) && isNumber(v.attempts);

const isAward = (v: unknown): v is { key: string; amount: number; label: string; at: string } =>
  isRecord(v) && isString(v.key) && isNumber(v.amount) && v.amount >= 0 && v.amount <= 1000 && isString(v.label) && isString(v.at);

function sanitizeSettings(value: unknown): Settings {
  const motion = isRecord(value) ? value.motion : undefined;
  return { motion: motion === "reduce" || motion === "full" ? motion : "system" };
}

/** Validates unknown data and returns a safe ProgressState, or null if unusable. */
export function migrate(raw: unknown): ProgressState | null {
  if (!isRecord(raw)) return null;
  const version = raw.version;
  // Future versions are migrated here. Unversioned data is treated as v1-shaped.
  if (version !== undefined && version !== 1) return null;
  const base = createEmptyProgress();
  return {
    version: 1,
    createdAt: isString(raw.createdAt) ? raw.createdAt : base.createdAt,
    lessons: pickRecord(raw.lessons, isLesson),
    quizzes: pickRecord(raw.quizzes, isQuiz),
    activities: pickRecord(raw.activities, isString),
    challenges: pickRecord(raw.challenges, isChallenge),
    awards: pickRecord(raw.awards, isAward),
    achievements: pickRecord(raw.achievements, isString),
    activeDays: Array.isArray(raw.activeDays) ? raw.activeDays.filter(isString).slice(-400) : [],
    playgroundCommands: isNumber(raw.playgroundCommands) ? Math.max(0, Math.floor(raw.playgroundCommands)) : 0,
    settings: sanitizeSettings(raw.settings),
  };
}

export interface LoadResult {
  state: ProgressState;
  status: StorageStatus;
}

export function loadProgress(): LoadResult {
  const storage = getStorage();
  if (!storage) return { state: createEmptyProgress(), status: "unavailable" };
  let text: string | null = null;
  try {
    text = storage.getItem(STORAGE_KEY);
  } catch {
    return { state: createEmptyProgress(), status: "unavailable" };
  }
  if (!text) return { state: createEmptyProgress(), status: "ok" };
  try {
    const migrated = migrate(JSON.parse(text));
    if (migrated) return { state: migrated, status: "ok" };
  } catch {
    // fall through
  }
  return { state: createEmptyProgress(), status: "recovered" };
}

/** Returns false when the data could not be persisted (private mode, quota, disabled storage). */
export function saveProgress(state: ProgressState): boolean {
  const storage = getStorage();
  if (!storage) return false;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function clearProgress(): boolean {
  const storage = getStorage();
  if (!storage) return false;
  try {
    storage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

/** Subscribe to progress changes made in other tabs. */
export function onExternalChange(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) callback();
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}
