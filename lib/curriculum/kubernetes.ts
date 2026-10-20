import { kubernetesModule5 } from "./content/kubernetes-module-5";
import { kubernetesModule6 } from "./content/kubernetes-module-6";
import { kubernetesModule7 } from "./content/kubernetes-module-7";
import { kubernetesModule8 } from "./content/kubernetes-module-8";
import type { LessonContent } from "./types";

export const kubernetesLessons: Record<string, LessonContent> = {
  ...kubernetesModule5,
  ...kubernetesModule6,
  ...kubernetesModule7,
  ...kubernetesModule8,
};
