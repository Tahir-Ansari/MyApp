import { LESSON_ENTRIES, getLessonEntry } from "./catalog";
import { dockerLessons } from "./docker";
import { kubernetesLessons } from "./kubernetes";
import type { Lesson, LessonContent } from "./types";

const CONTENT: Record<string, LessonContent> = { ...dockerLessons, ...kubernetesLessons };

export function getLesson(slug: string): Lesson | undefined {
  const entry = getLessonEntry(slug);
  const content = CONTENT[slug];
  if (!entry || !content) return undefined;
  return { ...entry, ...content };
}

/** Slugs with authored content. Used for static generation. */
export function getAllLessonSlugs(): string[] {
  return LESSON_ENTRIES.filter((e) => CONTENT[e.slug]).map((e) => e.slug);
}

/** Catalog entries with no content yet. Kept empty in a finished build. */
export function getMissingLessonSlugs(): string[] {
  return LESSON_ENTRIES.filter((e) => !CONTENT[e.slug]).map((e) => e.slug);
}

export * from "./catalog";
