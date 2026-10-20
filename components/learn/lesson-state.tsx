import { ArrowRight, Circle, CircleCheck, Lock, type LucideIcon } from "lucide-react";
import type { Difficulty, TrackId } from "@/lib/curriculum/types";
import type { LessonState } from "@/lib/progress/derive";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Container, ShipWheel } from "lucide-react";

export const LESSON_STATE_META: Record<LessonState, { label: string; icon: LucideIcon; className: string }> = {
  completed: { label: "Completed", icon: CircleCheck, className: "text-success" },
  next: { label: "Up next", icon: ArrowRight, className: "text-accent-strong" },
  available: { label: "Available", icon: Circle, className: "text-muted" },
  locked: { label: "Locked", icon: Lock, className: "text-subtle" },
};

/** Icon plus visible text, so state never relies on colour alone. */
export function LessonStateLabel({ state, className }: { state: LessonState; className?: string }) {
  const meta = LESSON_STATE_META[state];
  const Icon = meta.icon;
  if (state === "next") {
    return (
      <Badge tone="accent" className={className}>
        <Icon aria-hidden />
        {meta.label}
      </Badge>
    );
  }
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium", meta.className, className)}>
      <Icon aria-hidden className="size-3.5" />
      {meta.label}
    </span>
  );
}

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <Badge tone={difficulty === "beginner" ? "neutral" : "outline"}>
      {difficulty === "beginner" ? "Beginner" : "Intermediate"}
    </Badge>
  );
}

export const TRACK_ICONS: Record<TrackId, LucideIcon> = {
  docker: Container,
  kubernetes: ShipWheel,
};

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

export function padNumber(n: number): string {
  return String(n).padStart(2, "0");
}
