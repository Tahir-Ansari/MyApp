"use client";

import Link from "next/link";
import { CheckCircle2, Circle, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MODULES, getEntriesForModule } from "@/lib/curriculum/catalog";
import { lessonStatus, moduleStats, nextLesson } from "@/lib/progress/calculations";
import type { ProgressState } from "@/lib/progress/types";
import { cn } from "@/lib/utils";

type NodeState = "completed" | "next" | "available" | "locked";

export function moduleState(moduleId: string, progress: ProgressState): NodeState {
  const entries = getEntriesForModule(moduleId);
  const stats = moduleStats(moduleId, progress);
  if (stats.completed === stats.total) return "completed";
  const upNext = nextLesson(progress);
  if (upNext && upNext.module.id === moduleId) return "next";
  if (entries.some((e) => lessonStatus(e, progress) === "available")) return "available";
  return "locked";
}

const LABEL: Record<NodeState, string> = { completed: "Completed", next: "Up next", available: "Available", locked: "Locked" };

export function MissionTrack({ progress }: { progress: ProgressState }) {
  return (
    <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4" aria-label="Mission track">
      {MODULES.map((mod) => {
        const state = moduleState(mod.id, progress);
        const stats = moduleStats(mod.id, progress);
        const first = getEntriesForModule(mod.id).find((e) => !progress.lessons[e.slug]) ?? getEntriesForModule(mod.id)[0];
        const Icon = state === "completed" ? CheckCircle2 : state === "locked" ? Lock : Circle;
        return (
          <li key={mod.id}>
            <Link
              href={`/lesson/${first.slug}`}
              className={cn(
                "flex h-full flex-col rounded-lg border p-3 transition-colors",
                state === "completed" && "border-accent-border bg-accent-soft",
                state === "next" && "border-accent-border bg-surface shadow-glow",
                state === "available" && "border-border bg-surface hover:border-accent-border",
                state === "locked" && "border-border bg-background-2 text-subtle hover:border-border-strong",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-subtle">
                  {mod.track === "docker" ? "Docker" : "K8s"} · M{mod.number}
                </span>
                {state === "next" ? (
                  <Badge tone="accent">Up next</Badge>
                ) : (
                  <span className={cn("flex items-center gap-1 text-[11px]", state === "completed" ? "text-accent-strong" : "text-subtle")}>
                    <Icon className="size-3.5" aria-hidden />
                    {LABEL[state]}
                  </span>
                )}
              </div>
              <p className={cn("mt-2 text-sm font-medium", state === "locked" ? "text-muted" : "text-foreground")}>{mod.title}</p>
              <p className="mt-auto pt-2 font-mono text-[11px] text-muted">
                {stats.completed}/{stats.total} lessons
              </p>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
