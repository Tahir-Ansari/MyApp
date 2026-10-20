"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CheckCircle2, Circle, CircleDashed, Clock, SearchX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, Skeleton } from "@/components/ui/card";
import { CHALLENGES } from "@/lib/challenges/definitions";
import type { Difficulty, TrackId } from "@/lib/curriculum/types";
import { challengeStatus, completedChallengeCount } from "@/lib/progress/calculations";
import { useProgress } from "@/lib/progress/store";
import type { ChallengeStatus } from "@/lib/progress/types";
import { cn } from "@/lib/utils";

type Filter<T extends string> = "all" | T;

function FilterGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: Filter<T>;
  options: { value: Filter<T>; label: string }[];
  onChange: (v: Filter<T>) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs text-subtle">{label}</p>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              "min-h-9 rounded-lg border px-3 text-xs font-medium transition-colors",
              value === o.value ? "border-accent-border bg-accent-soft text-foreground" : "border-border bg-surface text-muted hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const STATUS_META: Record<ChallengeStatus, { label: string; icon: typeof Circle; className: string }> = {
  "not-started": { label: "Not started", icon: Circle, className: "text-subtle" },
  "in-progress": { label: "In progress", icon: CircleDashed, className: "text-warning" },
  completed: { label: "Completed", icon: CheckCircle2, className: "text-accent-strong" },
};

export function ChallengeCatalog() {
  const progress = useProgress();
  const [track, setTrack] = useState<Filter<TrackId>>("all");
  const [difficulty, setDifficulty] = useState<Filter<Difficulty>>("all");
  const [status, setStatus] = useState<Filter<ChallengeStatus>>("all");

  if (!progress) return <Skeleton className="h-96" />;

  const filtered = CHALLENGES.filter(
    (c) =>
      (track === "all" || c.track === track) &&
      (difficulty === "all" || c.difficulty === difficulty) &&
      (status === "all" || challengeStatus(progress, c.id) === status),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:flex-wrap sm:gap-6">
        <FilterGroup<TrackId>
          label="Track"
          value={track}
          onChange={setTrack}
          options={[
            { value: "all", label: "All" },
            { value: "docker", label: "Docker" },
            { value: "kubernetes", label: "Kubernetes" },
          ]}
        />
        <FilterGroup<Difficulty>
          label="Difficulty"
          value={difficulty}
          onChange={setDifficulty}
          options={[
            { value: "all", label: "All" },
            { value: "beginner", label: "Beginner" },
            { value: "intermediate", label: "Intermediate" },
          ]}
        />
        <FilterGroup<ChallengeStatus>
          label="Status"
          value={status}
          onChange={setStatus}
          options={[
            { value: "all", label: "All" },
            { value: "not-started", label: "Not started" },
            { value: "in-progress", label: "In progress" },
            { value: "completed", label: "Completed" },
          ]}
        />
      </div>

      <p className="text-sm text-muted" role="status">
        Showing {filtered.length} of {CHALLENGES.length} challenges · {completedChallengeCount(progress)} completed
      </p>

      {filtered.length === 0 ? (
        <Card className="bg-grid flex flex-col items-start gap-3 p-5 sm:p-8">
          <span className="flex size-10 items-center justify-center rounded-lg bg-surface-2 text-subtle">
            <SearchX className="size-5" aria-hidden />
          </span>
          <p className="text-sm font-medium text-foreground">No challenges match these filters</p>
          <p className="text-sm text-muted">Try another combination, or clear the filters.</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setTrack("all");
              setDifficulty("all");
              setStatus("all");
            }}
          >
            Clear filters
          </Button>
        </Card>
      ) : (
        <ul className="grid gap-3 sm:gap-4 md:grid-cols-2">
          {filtered.map((c) => {
            const s = challengeStatus(progress, c.id);
            const meta = STATUS_META[s];
            const Icon = meta.icon;
            return (
              <li key={c.id}>
                <Link href={`/challenges/${c.id}`} className="group block h-full">
                  <Card interactive className="flex h-full flex-col p-4 sm:p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="outline">{c.track === "docker" ? "Docker" : "Kubernetes"}</Badge>
                      <Badge tone="outline">{c.difficulty === "beginner" ? "Beginner" : "Intermediate"}</Badge>
                      <span className="flex items-center gap-1 text-xs text-subtle">
                        <Clock className="size-3.5" aria-hidden /> ~{c.estimatedMinutes} min
                      </span>
                    </div>
                    <h2 className="mt-3 text-sm font-semibold text-foreground sm:text-base">{c.title}</h2>
                    <p className="mt-1 text-sm leading-6 text-muted">{c.goal}</p>
                    <div className="mt-auto flex items-center justify-between pt-4">
                      <span className={cn("flex items-center gap-1.5 text-xs font-medium", meta.className)}>
                        <Icon className="size-4" aria-hidden />
                        {meta.label}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted group-hover:text-foreground">
                        {s === "completed" ? "Replay" : s === "in-progress" ? "Continue" : "Start"}
                        <ArrowRight className="size-3.5" aria-hidden />
                      </span>
                    </div>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
