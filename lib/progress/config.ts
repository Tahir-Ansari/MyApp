/**
 * Gamification configuration. Change XP values and level thresholds here.
 */

export const XP_REWARDS = {
  lessonComplete: 50,
  quizPass: 20,
  quizPerfect: 10,
  challengeComplete: 30,
} as const;

/** Fraction of questions that must be correct to pass a lesson quiz. */
export const QUIZ_PASS_RATIO = 0.6;

export interface LevelDefinition {
  level: number;
  title: string;
  minXp: number;
}

export const LEVELS: readonly LevelDefinition[] = [
  { level: 1, title: "Curious Explorer", minXp: 0 },
  { level: 2, title: "Container Cadet", minXp: 200 },
  { level: 3, title: "Image Architect", minXp: 600 },
  { level: 4, title: "Cluster Navigator", minXp: 1300 },
  { level: 5, title: "DevOps Pathfinder", minXp: 2200 },
] as const;

export const STORAGE_KEY = "learning-app-progress-v1";
