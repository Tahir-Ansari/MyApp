"use client";

import Link from "next/link";
import { CheckCircle2, Circle, Clock, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, Skeleton } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress";
import { getEntriesForModule, getModulesForTrack } from "@/lib/curriculum/catalog";
import type { TrackId } from "@/lib/curriculum/types";
import { lessonStatus, moduleStats, nextLesson } from "@/lib/progress/calculations";
import { useProgress } from "@/lib/progress/store";
import { cn } from "@/lib/utils";

export function TrackMap({ track }: { track: TrackId }) {
  const progress = useProgress();
  if (!progress) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }
  const upNext = nextLesson(progress);
  return (
    <div className="space-y-4">
      {getModulesForTrack(track).map((mod) => {
        const stats = moduleStats(mod.id, progress);
        return (
          <Card key={mod.id} className="p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-accent-strong">Module {mod.number}</p>
                <h2 className="mt-1 text-base font-semibold tracking-tight text-foreground sm:text-lg">{mod.title}</h2>
                <p className="mt-1 text-sm text-muted">{mod.description}</p>
              </div>
              {stats.completed === stats.total ? (
                <Badge tone="success">
                  <CheckCircle2 aria-hidden /> Module complete
                </Badge>
              ) : null}
            </div>
            <div className="mt-3 flex items-center gap-3">
              <ProgressBar size="sm" value={stats.completed} max={stats.total} label={`${mod.title} progress`} />
              <span className="shrink-0 font-mono text-xs text-muted">
                {stats.completed}/{stats.total}
              </span>
            </div>
            <ol className="mt-4 divide-y divide-border rounded-lg border border-border">
              {getEntriesForModule(mod.id).map((entry) => {
                const status = lessonStatus(entry, progress);
                const isNext = upNext?.slug === entry.slug;
                return (
                  <li key={entry.slug}>
                    <Link
                      href={`/lesson/${entry.slug}`}
                      className={cn(
                        "flex items-center gap-3 p-3 transition-colors first:rounded-t-lg last:rounded-b-lg hover:bg-surface-2",
                        isNext && "bg-accent-soft",
                      )}
                    >
                      <span className="shrink-0" aria-hidden>
                        {status === "completed" ? (
                          <CheckCircle2 className="size-5 text-accent-strong" />
                        ) : status === "locked" ? (
                          <Lock className="size-5 text-subtle" />
                        ) : (
                          <Circle className="size-5 text-muted" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={cn("block text-sm font-medium", status === "locked" ? "text-muted" : "text-foreground")}>
                          <span className="mr-2 font-mono text-xs text-subtle">{String(entry.number).padStart(2, "0")}</span>
                          {entry.title}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-muted">{entry.summary}</span>
                      </span>
                      <span className="hidden shrink-0 items-center gap-3 sm:flex">
                        <span className="flex items-center gap-1 text-xs text-subtle">
                          <Clock className="size-3.5" aria-hidden /> {entry.estimatedMinutes} min
                        </span>
                        {isNext ? <Badge tone="accent">Up next</Badge> : null}
                        <span className="w-20 text-right text-xs text-subtle">
                          {status === "completed" ? "Completed" : status === "locked" ? "Locked" : "Available"}
                        </span>
                      </span>
                      <span className="sr-only sm:hidden">{status === "completed" ? "Completed" : status === "locked" ? "Locked" : "Available"}</span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </Card>
        );
      })}
    </div>
  );
}
