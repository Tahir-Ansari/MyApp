import type { LucideIcon } from "lucide-react";
import { BrainCircuit, CalendarCheck, FileCode, Footprints, Hammer, Network, Target } from "lucide-react";
import { getEntriesForModule } from "@/lib/curriculum/catalog";
import type { ProgressState } from "./state";

/**
 * How an achievement unlocks. Criteria that can be derived from saved progress are checked here;
 * "awarded" achievements depend on quiz or challenge results and are unlocked only when their id
 * is recorded in `unlockedAchievements` by those features.
 */
export type AchievementCriterion =
  | { kind: "lessons-completed"; count: number }
  | { kind: "lesson-completed"; slug: string }
  | { kind: "module-completed"; moduleId: string }
  | { kind: "activity-days"; count: number }
  | { kind: "awarded" };

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  criterion: AchievementCriterion;
}

export const ACHIEVEMENTS: readonly AchievementDef[] = [
  {
    id: "first-steps",
    title: "First Steps",
    description: "Complete your first lesson.",
    icon: Footprints,
    criterion: { kind: "lessons-completed", count: 1 },
  },
  {
    id: "image-builder",
    title: "Image Builder",
    description: "Complete the Build Your Own Image module.",
    icon: Hammer,
    criterion: { kind: "module-completed", moduleId: "build-your-own-image" },
  },
  {
    id: "network-navigator",
    title: "Network Navigator",
    description: "Complete the Docker networking lesson.",
    icon: Network,
    criterion: { kind: "lesson-completed", slug: "docker-networking" },
  },
  {
    id: "yaml-apprentice",
    title: "YAML Apprentice",
    description: "Pass a Kubernetes YAML challenge.",
    icon: FileCode,
    criterion: { kind: "awarded" },
  },
  {
    id: "cluster-thinker",
    title: "Cluster Thinker",
    description: "Complete the Why Kubernetes? fundamentals module.",
    icon: BrainCircuit,
    criterion: { kind: "module-completed", moduleId: "why-kubernetes" },
  },
  {
    id: "perfect-run",
    title: "Perfect Run",
    description: "Score 100% on a lesson quiz.",
    icon: Target,
    criterion: { kind: "awarded" },
  },
  {
    id: "consistent-learner",
    title: "Consistent Learner",
    description: "Learn on 3 separate days on this device.",
    icon: CalendarCheck,
    criterion: { kind: "activity-days", count: 3 },
  },
];

export function isUnlocked(def: AchievementDef, progress: ProgressState): boolean {
  if (progress.unlockedAchievements.includes(def.id)) return true;
  const c = def.criterion;
  switch (c.kind) {
    case "lessons-completed":
      return progress.completedLessons.length >= c.count;
    case "lesson-completed":
      return progress.completedLessons.includes(c.slug);
    case "module-completed": {
      const entries = getEntriesForModule(c.moduleId);
      return entries.length > 0 && entries.every((e) => progress.completedLessons.includes(e.slug));
    }
    case "activity-days":
      return progress.activityDays.length >= c.count;
    case "awarded":
      return false;
  }
}

export function getUnlockedAchievementIds(progress: ProgressState): string[] {
  return ACHIEVEMENTS.filter((def) => isUnlocked(def, progress)).map((def) => def.id);
}
