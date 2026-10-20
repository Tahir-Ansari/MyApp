"use client";

import Link from "next/link";
import {
  Boxes,
  CalendarDays,
  CheckCircle2,
  FileCode,
  Flag,
  Footprints,
  Layers,
  Lock,
  Network,
  Ship,
  Sparkles,
  Target,
  Terminal,
  Trophy,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, SectionHeading, Skeleton } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress";
import { ACHIEVEMENTS, type AchievementIcon } from "@/lib/achievements/definitions";
import { completedChallengeCount, currentStreak, levelInfo, overallStats, recentAwards, totalXp } from "@/lib/progress/calculations";
import { LEVELS, XP_REWARDS } from "@/lib/progress/config";
import { useProgress } from "@/lib/progress/store";
import { CHALLENGES } from "@/lib/challenges/definitions";
import { cn } from "@/lib/utils";

const ICONS: Record<AchievementIcon, LucideIcon> = {
  footprints: Footprints,
  layers: Layers,
  network: Network,
  "file-code": FileCode,
  boxes: Boxes,
  target: Target,
  calendar: CalendarDays,
  terminal: Terminal,
  trophy: Trophy,
  ship: Ship,
  wrench: Wrench,
  flag: Flag,
};

const dateFmt = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });
const formatDate = (iso: string) => dateFmt.format(new Date(iso));

function LoadingState() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading your progress">
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-20 w-full rounded-xl" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-36 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function AchievementsView() {
  const state = useProgress();
  if (!state) return <LoadingState />;

  const xp = totalXp(state);
  const level = levelInfo(xp);
  const lessons = overallStats(state);
  const challengesDone = completedChallengeCount(state);
  const streak = currentStreak(state);
  const awards = recentAwards(state, 12);
  const unlockedCount = ACHIEVEMENTS.filter((a) => state.achievements[a.id]).length;
  // Unlocked first (most recent first), then locked by how close they are.
  const badges = [...ACHIEVEMENTS].sort((a, b) => {
    const ua = state.achievements[a.id];
    const ub = state.achievements[b.id];
    if (ua && ub) return ub.localeCompare(ua);
    if (ua || ub) return ua ? -1 : 1;
    const [ca, ga] = a.progress(state);
    const [cb, gb] = b.progress(state);
    return cb / gb - ca / ga;
  });

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Level */}
      <Card className="bg-hero-glow p-5 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-subtle">Current level</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">
              Level {level.current.level} · {level.current.title}
            </p>
          </div>
          <p className="font-mono text-3xl font-semibold text-accent-strong">
            {xp}
            <span className="ml-1 text-base font-normal text-muted">XP</span>
          </p>
        </div>
        <div className="mt-5">
          <ProgressBar
            value={level.next ? level.xpIntoLevel : 1}
            max={level.next ? level.xpForLevel : 1}
            tone="gradient"
            label={level.next ? `Progress to level ${level.next.level}` : "Maximum level reached"}
          />
          <p className="mt-2 font-mono text-xs text-muted">
            {level.next
              ? `${level.xpIntoLevel} / ${level.xpForLevel} XP to Level ${level.next.level} · ${level.next.title}`
              : "Top level reached. Every lesson and challenge still counts toward your badges."}
          </p>
        </div>
        <ol className="mt-6 grid grid-cols-5 gap-1.5" aria-label="Levels">
          {LEVELS.map((l) => {
            const reached = xp >= l.minXp;
            const isCurrent = l.level === level.current.level;
            return (
              <li key={l.level} className="min-w-0">
                <div className={cn("h-1 rounded-full", reached ? "bg-accent" : "bg-surface-3")} aria-hidden />
                <p className={cn("mt-2 truncate text-[11px] sm:text-xs", isCurrent ? "font-medium text-foreground" : reached ? "text-muted" : "text-subtle")}>
                  <span className="font-mono">L{l.level}</span>
                  <span className="hidden sm:inline"> · {l.title}</span>
                </p>
                <p className="font-mono text-[11px] text-subtle">{l.minXp} XP</p>
                <span className="sr-only">{reached ? "reached" : "not reached"}</span>
              </li>
            );
          })}
        </ol>
      </Card>

      {/* Stats */}
      {/* 1px gaps over a border-coloured background draw the dividers at every breakpoint. */}
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
        {[
          ["Lessons completed", `${lessons.completed} / ${lessons.total}`],
          ["Challenges completed", `${challengesDone} / ${CHALLENGES.length}`],
          ["Badges unlocked", `${unlockedCount} / ${ACHIEVEMENTS.length}`],
          ["Active-day streak", `${streak} ${streak === 1 ? "day" : "days"}`],
        ].map(([label, value]) => (
          <div key={label} className="bg-surface p-4">
            <dt className="text-xs text-subtle">{label}</dt>
            <dd className="mt-1 font-mono text-lg font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="-mt-5 text-xs text-subtle sm:-mt-7">
        Streaks count days with learning activity on this device, using your local date. They don&apos;t sync to other
        devices.
      </p>

      {/* Badges */}
      <section aria-labelledby="badges-heading">
        <SectionHeading
          id="badges-heading"
          title="Badges"
          description={`${unlockedCount} of ${ACHIEVEMENTS.length} unlocked. Locked badges show what's left to earn them.`}
        />
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {badges.map((def) => {
            const Icon = ICONS[def.icon];
            const unlockedAt = state.achievements[def.id];
            const [current, goal] = def.progress(state);
            return (
              <li key={def.id}>
                <Card className="flex h-full flex-col p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "relative flex size-10 shrink-0 items-center justify-center rounded-lg",
                        unlockedAt ? "border border-accent-border bg-accent-soft text-accent-strong" : "bg-surface-2 text-subtle",
                      )}
                    >
                      <Icon aria-hidden className="size-5" />
                      {!unlockedAt && (
                        <span className="absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-full border border-border bg-background-2">
                          <Lock aria-hidden className="size-2.5" />
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className={cn("text-sm font-semibold", unlockedAt ? "text-foreground" : "text-muted")}>{def.title}</h3>
                      <p className="mt-0.5 text-sm text-muted">{def.description}</p>
                    </div>
                  </div>
                  <div className="mt-auto pt-4">
                    {unlockedAt ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="success">
                          <CheckCircle2 aria-hidden />
                          Unlocked
                        </Badge>
                        <span className="text-xs text-subtle">{formatDate(unlockedAt)}</span>
                      </div>
                    ) : (
                      <div>
                        <div className="mb-1.5 flex items-center justify-between text-xs">
                          <span className="text-subtle">Locked</span>
                          <span className="font-mono text-muted">
                            {current} / {goal}
                          </span>
                        </div>
                        <ProgressBar value={current} max={goal} size="sm" label={`${def.title} progress`} />
                      </div>
                    )}
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* XP history */}
        <section aria-labelledby="history-heading">
          <SectionHeading id="history-heading" title="Recent XP" description="Each lesson, quiz bonus and challenge pays out once." />
          {awards.length === 0 ? (
            <Card className="bg-grid p-5 sm:p-8">
              <div className="flex size-10 items-center justify-center rounded-lg bg-surface-2 text-subtle">
                <Sparkles aria-hidden className="size-5" />
              </div>
              <p className="mt-3 font-medium">No XP yet</p>
              <p className="mt-1 text-sm text-muted">Complete your first lesson to earn 50 XP and the First Steps badge.</p>
              <Button asChild className="mt-4 min-h-11">
                <Link href="/learn">Start learning</Link>
              </Button>
            </Card>
          ) : (
            <Card>
              <ul className="divide-y divide-border">
                {awards.map((a) => (
                  <li key={a.key} className="flex items-center gap-3 px-4 py-3 text-sm">
                    <span className="w-14 shrink-0 font-mono text-accent-strong">+{a.amount}</span>
                    <span className="min-w-0 flex-1 truncate">{a.label}</span>
                    <span className="shrink-0 text-xs text-subtle">{formatDate(a.at)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </section>

        {/* Rules */}
        <section aria-labelledby="rules-heading">
          <SectionHeading id="rules-heading" title="How XP works" />
          <Card>
            <dl className="divide-y divide-border text-sm">
              {[
                ["Complete a lesson", XP_REWARDS.lessonComplete],
                ["Pass a lesson quiz", XP_REWARDS.quizPass],
                ["Perfect quiz score", XP_REWARDS.quizPerfect],
                ["Complete a challenge", XP_REWARDS.challengeComplete],
              ].map(([label, amount]) => (
                <div key={label} className="flex items-center justify-between px-4 py-3">
                  <dt className="text-muted">{label}</dt>
                  <dd className="font-mono text-foreground">+{amount} XP</dd>
                </div>
              ))}
            </dl>
          </Card>
          <p className="mt-3 text-xs text-subtle">Revisiting finished lessons and challenges is always free, and never awards XP twice.</p>
        </section>
      </div>
    </div>
  );
}
