import { dockerModule1 } from "./content/docker-module-1";
import { dockerModule2 } from "./content/docker-module-2";
import { dockerModule3 } from "./content/docker-module-3";
import { dockerModule4 } from "./content/docker-module-4";
import type { LessonContent } from "./types";

export const dockerLessons: Record<string, LessonContent> = {
  ...dockerModule1,
  ...dockerModule2,
  ...dockerModule3,
  ...dockerModule4,
};
