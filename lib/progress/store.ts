"use client";

import { useSyncExternalStore } from "react";
import { ACHIEVEMENTS, isUnlocked } from "@/lib/achievements/definitions";
import { toLocalDateKey } from "@/lib/utils";
import { levelInfo, quizPassMark, totalXp } from "./calculations";
import { XP_REWARDS } from "./config";
import { clearProgress, createEmptyProgress, loadProgress, onExternalChange, saveProgress } from "./storage";
import type { ProgressState, Settings, StorageStatus } from "./types";

/* ------------------------------------------------------------------ */
/* Toasts: small, non-blocking feedback for XP and unlocks             */
/* ------------------------------------------------------------------ */

export interface Toast {
  id: number;
  kind: "xp" | "achievement" | "level" | "notice";
  title: string;
  detail?: string;
}

let toasts: Toast[] = [];
let toastSeq = 0;
const toastListeners = new Set<() => void>();
const emitToasts = () => toastListeners.forEach((l) => l());

export function pushToast(toast: Omit<Toast, "id">) {
  const id = ++toastSeq;
  toasts = [...toasts.slice(-3), { ...toast, id }];
  emitToasts();
  if (typeof window !== "undefined") window.setTimeout(() => dismissToast(id), toast.kind === "achievement" || toast.kind === "level" ? 5000 : 3200);
}

export function dismissToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emitToasts();
}

const EMPTY_TOASTS: Toast[] = [];

export function useToasts(): Toast[] {
  return useSyncExternalStore(
    (cb) => {
      toastListeners.add(cb);
      return () => toastListeners.delete(cb);
    },
    () => toasts,
    () => EMPTY_TOASTS,
  );
}

/* ------------------------------------------------------------------ */
/* Progress store                                                      */
/* ------------------------------------------------------------------ */

let progress: ProgressState | null = null;
let storageStatus: StorageStatus = "ok";
const listeners = new Set<() => void>();
let unsubscribeExternal: (() => void) | null = null;

function emit() {
  listeners.forEach((l) => l());
}

function ensureLoaded() {
  if (progress !== null || typeof window === "undefined") return;
  const result = loadProgress();
  progress = result.state;
  storageStatus = result.status;
  if (!unsubscribeExternal) {
    unsubscribeExternal = onExternalChange(() => {
      const reloaded = loadProgress();
      progress = reloaded.state;
      emit();
    });
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): ProgressState | null {
  ensureLoaded();
  return progress;
}

const getServerSnapshot = () => null;

/** Returns null during server render and hydration, then the saved progress. */
export function useProgress(): ProgressState | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useStorageStatus(): StorageStatus | null {
  return useSyncExternalStore(
    subscribe,
    () => {
      ensureLoaded();
      return storageStatus;
    },
    () => null,
  );
}

/** Applies a change, checks achievements and level-ups, persists, and notifies subscribers. */
function commit(mutate: (draft: ProgressState, now: Date) => void) {
  ensureLoaded();
  const before = progress ?? createEmptyProgress();
  const draft = structuredClone(before);
  const now = new Date();
  mutate(draft, now);

  for (const def of ACHIEVEMENTS) {
    if (!draft.achievements[def.id] && isUnlocked(def, draft)) {
      draft.achievements[def.id] = now.toISOString();
      pushToast({ kind: "achievement", title: `Achievement unlocked: ${def.title}`, detail: def.description });
    }
  }
  const oldLevel = levelInfo(totalXp(before)).current.level;
  const newLevel = levelInfo(totalXp(draft));
  if (newLevel.current.level > oldLevel) {
    pushToast({ kind: "level", title: `Level ${newLevel.current.level}: ${newLevel.current.title}`, detail: "You reached a new level." });
  }

  progress = draft;
  const saved = saveProgress(draft);
  if (!saved && storageStatus !== "unavailable") {
    storageStatus = "unavailable";
  }
  emit();
}

function award(draft: ProgressState, now: Date, key: string, amount: number, label: string): boolean {
  if (draft.awards[key]) return false;
  draft.awards[key] = { key, amount, label, at: now.toISOString() };
  markActive(draft, now);
  pushToast({ kind: "xp", title: `+${amount} XP`, detail: label });
  return true;
}

function markActive(draft: ProgressState, now: Date) {
  const day = toLocalDateKey(now);
  if (!draft.activeDays.includes(day)) draft.activeDays.push(day);
}

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

export function completeActivity(slug: string) {
  commit((draft, now) => {
    if (!draft.activities[slug]) draft.activities[slug] = now.toISOString();
    markActive(draft, now);
  });
}

/** Records a quiz attempt. Bonus XP is awarded only the first time a pass / perfect score happens. */
export function recordQuizAttempt(slug: string, lessonTitle: string, score: number, total: number) {
  commit((draft, now) => {
    const passed = score >= quizPassMark(total);
    const perfect = score === total;
    const prev = draft.quizzes[slug];
    draft.quizzes[slug] = {
      bestScore: Math.max(prev?.bestScore ?? 0, score),
      total,
      attempts: (prev?.attempts ?? 0) + 1,
      passed: (prev?.passed ?? false) || passed,
      perfect: (prev?.perfect ?? false) || perfect,
    };
    if (passed) award(draft, now, `quiz-pass:${slug}`, XP_REWARDS.quizPass, `Passed the quiz: ${lessonTitle}`);
    if (perfect) award(draft, now, `quiz-perfect:${slug}`, XP_REWARDS.quizPerfect, `Perfect score: ${lessonTitle}`);
    markActive(draft, now);
  });
}

export function completeLesson(slug: string, lessonTitle: string) {
  commit((draft, now) => {
    if (!draft.lessons[slug]) {
      draft.lessons[slug] = { completedAt: now.toISOString(), localDate: toLocalDateKey(now) };
    }
    award(draft, now, `lesson:${slug}`, XP_REWARDS.lessonComplete, `Lesson complete: ${lessonTitle}`);
  });
}

export function startChallenge(id: string) {
  commit((draft, now) => {
    if (!draft.challenges[id]) draft.challenges[id] = { status: "in-progress", startedAt: now.toISOString(), attempts: 0 };
  });
}

export function recordChallengeAttempt(id: string) {
  commit((draft, now) => {
    const rec = draft.challenges[id] ?? { status: "in-progress" as const, startedAt: now.toISOString(), attempts: 0 };
    rec.attempts += 1;
    draft.challenges[id] = rec;
  });
}

export function completeChallenge(id: string, title: string) {
  commit((draft, now) => {
    const rec = draft.challenges[id] ?? { status: "in-progress" as const, startedAt: now.toISOString(), attempts: 0 };
    if (rec.status !== "completed") {
      rec.status = "completed";
      rec.completedAt = now.toISOString();
    }
    draft.challenges[id] = rec;
    award(draft, now, `challenge:${id}`, XP_REWARDS.challengeComplete, `Challenge complete: ${title}`);
  });
}

export function recordPlaygroundCommand() {
  commit((draft, now) => {
    draft.playgroundCommands += 1;
    markActive(draft, now);
  });
}

export function updateSettings(patch: Partial<Settings>) {
  commit((draft) => {
    draft.settings = { ...draft.settings, ...patch };
  });
}

export function resetProgress() {
  ensureLoaded();
  const settings = progress?.settings ?? createEmptyProgress().settings;
  clearProgress();
  progress = { ...createEmptyProgress(), settings };
  const saved = saveProgress(progress);
  storageStatus = saved ? "ok" : "unavailable";
  emit();
  pushToast({ kind: "notice", title: "Progress reset", detail: "You are starting fresh." });
}
