/**
 * Levels and XP rewards. Change thresholds here only.
 *
 * Budget: 40 lessons × (50 lesson + 20 quiz pass + 10 perfect) = 3,200 XP max from lessons,
 * plus 30 XP per challenge. Level 2 arrives after roughly three lessons; level 5 needs most of
 * both tracks, not perfection.
 */

export const XP_REWARDS = {
  lesson: 50,
  quizPass: 20,
  challenge: 30,
  perfectQuiz: 10,
} as const;

export interface LevelDef {
  level: number;
  title: string;
  /** Minimum total XP to reach this level. */
  minXp: number;
}

export const LEVELS: readonly LevelDef[] = [
  { level: 1, title: "Curious Explorer", minXp: 0 },
  { level: 2, title: "Container Cadet", minXp: 200 },
  { level: 3, title: "Image Architect", minXp: 600 },
  { level: 4, title: "Cluster Navigator", minXp: 1200 },
  { level: 5, title: "DevOps Pathfinder", minXp: 2000 },
];

export interface LevelInfo {
  level: number;
  title: string;
  currentThreshold: number;
  /** XP needed for the next level, or null at the max level. */
  nextThreshold: number | null;
  nextTitle: string | null;
  /** 0–100 progress from the current threshold to the next one (100 at max level). */
  progressPct: number;
}

export function getLevelForXp(xp: number): LevelInfo {
  const safeXp = Number.isFinite(xp) && xp > 0 ? xp : 0;
  let index = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    if (safeXp >= LEVELS[i].minXp) index = i;
  }
  const current = LEVELS[index];
  const next = LEVELS[index + 1] ?? null;
  const progressPct = next
    ? Math.min(100, Math.max(0, ((safeXp - current.minXp) / (next.minXp - current.minXp)) * 100))
    : 100;
  return {
    level: current.level,
    title: current.title,
    currentThreshold: current.minXp,
    nextThreshold: next ? next.minXp : null,
    nextTitle: next ? next.title : null,
    progressPct,
  };
}
