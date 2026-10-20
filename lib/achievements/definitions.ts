import { getEntriesForModule, getEntriesForTrack } from "@/lib/curriculum/catalog";
import { CHALLENGES } from "@/lib/challenges/definitions";
import { completedChallengeCount, lessonDays } from "@/lib/progress/calculations";
import type { ProgressState } from "@/lib/progress/types";

export type AchievementIcon =
  | "footprints"
  | "layers"
  | "network"
  | "file-code"
  | "boxes"
  | "target"
  | "calendar"
  | "terminal"
  | "trophy"
  | "ship"
  | "wrench"
  | "flag";

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  icon: AchievementIcon;
  /** Returns [current, goal] so the UI can show progress toward locked badges. */
  progress: (state: ProgressState) => [number, number];
}

const moduleDone = (state: ProgressState, moduleId: string): [number, number] => {
  const entries = getEntriesForModule(moduleId);
  return [entries.filter((e) => state.lessons[e.slug]).length, entries.length];
};

const trackDone = (state: ProgressState, track: "docker" | "kubernetes"): [number, number] => {
  const entries = getEntriesForTrack(track);
  return [entries.filter((e) => state.lessons[e.slug]).length, entries.length];
};

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: "first-steps",
    title: "First Steps",
    description: "Complete your first lesson.",
    icon: "footprints",
    progress: (s) => [Math.min(1, Object.keys(s.lessons).length), 1],
  },
  {
    id: "image-builder",
    title: "Image Builder",
    description: "Complete the Build Your Own Image module.",
    icon: "layers",
    progress: (s) => moduleDone(s, "build-your-own-image"),
  },
  {
    id: "network-navigator",
    title: "Network Navigator",
    description: "Complete the Docker networking lesson.",
    icon: "network",
    progress: (s) => [s.lessons["docker-networking"] ? 1 : 0, 1],
  },
  {
    id: "yaml-apprentice",
    title: "YAML Apprentice",
    description: "Pass a Kubernetes YAML challenge.",
    icon: "file-code",
    progress: (s) => [
      Math.min(1, CHALLENGES.filter((c) => c.track === "kubernetes" && c.tags.includes("yaml") && s.challenges[c.id]?.status === "completed").length),
      1,
    ],
  },
  {
    id: "cluster-thinker",
    title: "Cluster Thinker",
    description: "Complete the Why Kubernetes? fundamentals module.",
    icon: "boxes",
    progress: (s) => moduleDone(s, "why-kubernetes"),
  },
  {
    id: "perfect-run",
    title: "Perfect Run",
    description: "Score 100% on a lesson quiz.",
    icon: "target",
    progress: (s) => [Object.values(s.quizzes).some((q) => q.perfect) ? 1 : 0, 1],
  },
  {
    id: "consistent-learner",
    title: "Consistent Learner",
    description: "Complete lessons on 3 separate days (on this device).",
    icon: "calendar",
    progress: (s) => [Math.min(3, lessonDays(s)), 3],
  },
  {
    id: "terminal-tinkerer",
    title: "Terminal Tinkerer",
    description: "Run 25 commands in the playground.",
    icon: "terminal",
    progress: (s) => [Math.min(25, s.playgroundCommands), 25],
  },
  {
    id: "challenge-hunter",
    title: "Challenge Hunter",
    description: "Complete 5 challenges.",
    icon: "trophy",
    progress: (s) => [Math.min(5, completedChallengeCount(s)), 5],
  },
  {
    id: "troubleshooter",
    title: "Troubleshooter",
    description: "Complete the Troubleshooting and Review module.",
    icon: "wrench",
    progress: (s) => moduleDone(s, "troubleshooting-and-review"),
  },
  {
    id: "docker-graduate",
    title: "Docker Graduate",
    description: "Complete every lesson in Docker Foundations.",
    icon: "ship",
    progress: (s) => trackDone(s, "docker"),
  },
  {
    id: "kubernetes-graduate",
    title: "Kubernetes Graduate",
    description: "Complete every lesson in Kubernetes Adventures.",
    icon: "flag",
    progress: (s) => trackDone(s, "kubernetes"),
  },
];

export function isUnlocked(def: AchievementDefinition, state: ProgressState): boolean {
  const [current, goal] = def.progress(state);
  return current >= goal;
}

export function getAchievement(id: string) {
  return ACHIEVEMENTS.find((a) => a.id === id);
}
