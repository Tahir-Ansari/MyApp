import { LESSON_ENTRIES, MODULES, getEntriesForModule, getEntriesForTrack } from "@/lib/curriculum/catalog";
import type { LessonEntry, TrackId } from "@/lib/curriculum/types";
import type { ProgressState } from "./state";

/**
 * - completed: the slug is in `completedLessons`.
 * - next: the first lesson (catalog order, optionally within one track) that is not completed and
 *   whose prerequisites are all completed. Exactly one lesson per scope.
 * - available: prerequisites met, not completed, not the next one.
 * - locked: at least one prerequisite is not completed.
 */
export type LessonState = "completed" | "next" | "available" | "locked";

export type ModuleState = "completed" | "next" | "available" | "locked";

function isLessonUnlocked(entry: LessonEntry, done: ReadonlySet<string>): boolean {
  return entry.prerequisites.every((slug) => done.has(slug));
}

function completedSet(progress: ProgressState): Set<string> {
  return new Set(progress.completedLessons);
}

/** The first lesson in catalog order that is not completed and is unlocked. Null when all are done. */
export function getNextLesson(progress: ProgressState, track?: TrackId): LessonEntry | null {
  const done = completedSet(progress);
  const entries = track ? getEntriesForTrack(track) : LESSON_ENTRIES;
  return entries.find((e) => !done.has(e.slug) && isLessonUnlocked(e, done)) ?? null;
}

/** Lesson states keyed by slug. `track` scopes which lesson is marked "next". */
export function getLessonStates(progress: ProgressState, track?: TrackId): Map<string, LessonState> {
  const done = completedSet(progress);
  const next = getNextLesson(progress, track);
  const states = new Map<string, LessonState>();
  for (const entry of LESSON_ENTRIES) {
    let state: LessonState;
    if (done.has(entry.slug)) state = "completed";
    else if (next && entry.slug === next.slug) state = "next";
    else if (isLessonUnlocked(entry, done)) state = "available";
    else state = "locked";
    states.set(entry.slug, state);
  }
  return states;
}

export interface CompletionCount {
  completed: number;
  total: number;
}

function countCompleted(entries: LessonEntry[], done: ReadonlySet<string>): CompletionCount {
  return { completed: entries.filter((e) => done.has(e.slug)).length, total: entries.length };
}

export function getTrackCompletion(progress: ProgressState, track: TrackId): CompletionCount {
  return countCompleted(getEntriesForTrack(track), completedSet(progress));
}

export function getModuleCompletion(progress: ProgressState, moduleId: string): CompletionCount {
  return countCompleted(getEntriesForModule(moduleId), completedSet(progress));
}

/** Completed lessons that still exist in the catalog (ignores stale slugs). */
export function getCompletedLessonCount(progress: ProgressState): number {
  const done = completedSet(progress);
  return LESSON_ENTRIES.filter((e) => done.has(e.slug)).length;
}

/**
 * Module state for the mission track: completed when every lesson is done, next when it holds
 * the next lesson, available when its first open lesson is unlocked, otherwise locked.
 */
export function getModuleStates(progress: ProgressState, track?: TrackId): Map<string, ModuleState> {
  const lessonStates = getLessonStates(progress, track);
  const states = new Map<string, ModuleState>();
  for (const mod of MODULES) {
    const entries = getEntriesForModule(mod.id);
    const list = entries.map((e) => lessonStates.get(e.slug));
    let state: ModuleState;
    if (list.every((s) => s === "completed")) state = "completed";
    else if (list.includes("next")) state = "next";
    else if (list.some((s) => s === "available")) state = "available";
    else state = "locked";
    states.set(mod.id, state);
  }
  return states;
}

export function sumMinutes(entries: readonly { estimatedMinutes: number }[]): number {
  return entries.reduce((total, e) => total + e.estimatedMinutes, 0);
}
