"use client";

import Link from "next/link";
import { ArrowRight, Box, CheckCircle2, Lock, Ship } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, Skeleton } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress";
import { TRACKS, getEntriesForModule, getModulesForTrack } from "@/lib/curriculum/catalog";
import type { TrackId } from "@/lib/curriculum/types";
import { lessonStatus, moduleStats, trackStats } from "@/lib/progress/calculations";
import { useProgress } from "@/lib/progress/store";
import { cn } from "@/lib/utils";

export function LearnOverview() {
  const progress = useProgress();
  if (!progress) return <Skeleton className="h-96" />;
  return (
    <div className="space-y-8">
      {(["docker", "kubernetes"] as TrackId[]).map((track) => {
        const meta = TRACKS[track];
        const stats = trackStats(track, progress);
        const Icon = track === "docker" ? Box : Ship;
        return (
          <section key={track} aria-labelledby={`${track}-heading`}>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-2 text-accent-strong">
                  <Icon className="size-5" aria-hidden />
                </span>
                <div>
                  <h2 id={`${track}-heading`} className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
                    {meta.title}
                  </h2>
                  <p className="text-sm text-muted">{meta.description}</p>
                </div>
              </div>
              <Button asChild variant="secondary" size="sm">
                <Link href={meta.href}>
                  Open path <ArrowRight aria-hidden />
                </Link>
              </Button>
            </div>
            <div className="mb-4 flex items-center gap-3">
              <ProgressBar size="sm" value={stats.completed} max={stats.total} label={`${meta.title} progress`} />
              <span className="shrink-0 font-mono text-xs text-muted">
                {stats.completed}/{stats.total} lessons
              </span>
            </div>
            <ol className="grid gap-3 sm:grid-cols-2">
              {getModulesForTrack(track).map((mod) => {
                const m = moduleStats(mod.id, progress);
                const entries = getEntriesForModule(mod.id);
                const locked = entries.every((e) => lessonStatus(e, progress) === "locked");
                const done = m.completed === m.total;
                const target = entries.find((e) => !progress.lessons[e.slug]) ?? entries[0];
                return (
                  <li key={mod.id}>
                    <Link href={`/lesson/${target.slug}`} className="block h-full">
                      <Card interactive className={cn("h-full p-4", locked && "bg-background-2")}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs uppercase tracking-[0.14em] text-accent-strong">Module {mod.number}</span>
                          <span className={cn("flex items-center gap-1 text-xs", done ? "text-accent-strong" : "text-subtle")}>
                            {done ? <CheckCircle2 className="size-3.5" aria-hidden /> : locked ? <Lock className="size-3.5" aria-hidden /> : null}
                            {done ? "Completed" : locked ? "Locked" : `${m.completed}/${m.total}`}
                          </span>
                        </div>
                        <h3 className={cn("mt-2 text-sm font-semibold sm:text-base", locked ? "text-muted" : "text-foreground")}>{mod.title}</h3>
                        <p className="mt-1 text-sm text-muted">{mod.description}</p>
                        <p className="mt-3 font-mono text-[11px] text-subtle">
                          {entries.length} lessons · ~{entries.reduce((s, e) => s + e.estimatedMinutes, 0)} min
                        </p>
                      </Card>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
