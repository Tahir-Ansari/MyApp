"use client";

import { useEffect } from "react";
import { MotionConfig } from "motion/react";
import { useProgress } from "@/lib/progress/store";

/** Applies the reduced-motion setting to CSS (via data-motion) and to Motion components. */
export function MotionPreferences({ children }: { children: React.ReactNode }) {
  const progress = useProgress();
  const motion = progress?.settings.motion ?? "system";
  useEffect(() => {
    document.documentElement.dataset.motion = motion;
  }, [motion]);
  const reducedMotion = motion === "reduce" ? "always" : motion === "full" ? "never" : "user";
  return <MotionConfig reducedMotion={reducedMotion}>{children}</MotionConfig>;
}
