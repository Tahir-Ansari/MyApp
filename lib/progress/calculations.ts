import { LESSON_ENTRIES, getEntriesForModule, getEntriesForTrack, getLessonEntry } from "@/lib/curriculum/catalog";
import type { LessonEntry, TrackId } from "@/lib/curriculum/types";
import { CHALLENGES } from "@/lib/challenges/definitions";
import { toLocalDateKey } from "@/lib/utils";
import { LEVELS, QUIZ_PASS_RATIO, type LevelDefinition } from "./config";
import type { ChallengeStatus, ProgressState } from "./types";

export function totalXp(state: ProgressState): number {
  return Object.values(state.awards).reduce((sum, a) => sum + a.amount, 0);
}

export interface LevelInfo {
  current: LevelDefinition;
  next: LevelDefinition | null;
  xp: number;
  xpIntoLevel: number;
  xpForLevel: number;
  /** 0–1 progress toward the next level (1 at max level). */
  ratio: number;
}

export function levelInfo(xp: number): LevelInfo {
  let index = 0;
  for (let i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i].minXp) index = i;
  const current = LEVELS[index];
  const next = LEVELS[index + 1] ?? null;
  const xpForLevel = next ? next.minXp - current.minXp : 0;
  const xpIntoLevel = xp - current.minXp;
  return { current, next, xp, xpIntoLevel, xpForLevel, ratio: next ? xpIntoLevel / xpForLevel : 1 };
}

export function quizPassMark(total: number): number {
  return Math.max(1, Math.ceil(total * QUIZ_PASS_RATIO));
}

export type LessonStatus = "completed" | "available" | "locked";

export function lessonStatus(entry: LessonEntry, state: ProgressState | null): LessonStatus {
  if (state?.lessons[entry.slug]) return "completed";
  if (!state) return entry.prerequisites.length === 0 ? "available" : "locked";
  return entry.prerequisites.every((p) => state.lessons[p]) ? "available" : "locked";
}

export function isLessonComplete(state: ProgressState, slug: string) {
  return Boolean(state.lessons[slug]);
}

/** The lesson the learner should open next. */
export function nextLesson(state: ProgressState | null): LessonEntry | null {
  if (!state) return LESSON_ENTRIES[0];
  const completed = Object.entries(state.lessons).sort((a, b) => b[1].completedAt.localeCompare(a[1].completedAt));
  const recent = completed[0] ? getLessonEntry(completed[0][0]) : undefined;
  if (recent) {
    const sameTrack = getEntriesForTrack(recent.track).find((e) => !state.lessons[e.slug] && lessonStatus(e, state) === "available");
    if (sameTrack) return sameTrack;
  }
  return LESSON_ENTRIES.find((e) => !state.lessons[e.slug] && lessonStatus(e, state) === "available") ?? null;
}

export interface CompletionStats {
  completed: number;
  total: number;
  ratio: number;
}

function stats(entries: LessonEntry[], state: ProgressState | null): CompletionStats {
  const completed = state ? entries.filter((e) => state.lessons[e.slug]).length : 0;
  return { completed, total: entries.length, ratio: entries.length ? completed / entries.length : 0 };
}

export const trackStats = (track: TrackId, state: ProgressState | null) => stats(getEntriesForTrack(track), state);
export const moduleStats = (moduleId: string, state: ProgressState | null) => stats(getEntriesForModule(moduleId), state);
export const overallStats = (state: ProgressState | null) => stats(LESSON_ENTRIES, state);

export function challengeStatus(state: ProgressState | null, id: string): ChallengeStatus {
  return state?.challenges[id]?.status ?? "not-started";
}

export function completedChallengeCount(state: ProgressState | null) {
  if (!state) return 0;
  return CHALLENGES.filter((c) => state.challenges[c.id]?.status === "completed").length;
}

/** Number of consecutive local days, ending today or yesterday, with learning activity on this device. */
export function currentStreak(state: ProgressState | null, now: Date = new Date()): number {
  if (!state || state.activeDays.length === 0) return 0;
  const days = new Set(state.activeDays);
  const cursor = new Date(now);
  if (!days.has(toLocalDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(toLocalDateKey(cursor))) return 0;
  }
  let streak = 0;
  while (days.has(toLocalDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function lessonDays(state: ProgressState): number {
  return new Set(Object.values(state.lessons).map((l) => l.localDate)).size;
}

export function recentAwards(state: ProgressState | null, limit = 6) {
  if (!state) return [];
  return Object.values(state.awards).sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}
