export interface LessonProgress {
  completedAt: string;
  /** Local calendar date (YYYY-MM-DD) when the lesson was completed. */
  localDate: string;
}

export interface QuizRecord {
  bestScore: number;
  total: number;
  attempts: number;
  passed: boolean;
  perfect: boolean;
}

export type ChallengeStatus = "not-started" | "in-progress" | "completed";

export interface ChallengeRecord {
  status: Exclude<ChallengeStatus, "not-started">;
  startedAt: string;
  completedAt?: string;
  attempts: number;
}

/** Every XP grant is recorded under a unique key, which makes awards idempotent. */
export interface XpAward {
  key: string;
  amount: number;
  label: string;
  at: string;
}

export interface Settings {
  motion: "system" | "reduce" | "full";
}

export interface ProgressState {
  version: 1;
  createdAt: string;
  lessons: Record<string, LessonProgress>;
  quizzes: Record<string, QuizRecord>;
  /** Lesson slug -> completion timestamp of its interactive activity. */
  activities: Record<string, string>;
  challenges: Record<string, ChallengeRecord>;
  awards: Record<string, XpAward>;
  /** Achievement id -> unlock timestamp. */
  achievements: Record<string, string>;
  /** Local dates (YYYY-MM-DD) with any learning activity on this device. */
  activeDays: string[];
  playgroundCommands: number;
  settings: Settings;
}

export type StorageStatus = "ok" | "unavailable" | "recovered";
