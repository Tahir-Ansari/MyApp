"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Award, Box, Clock, Lock, Ship, Sparkles } from "lucide-react";
import { ChallengeRunner } from "@/components/challenges/challenge-runner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, SectionHeading, Skeleton } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress";
import { ACHIEVEMENTS, getAchievement } from "@/lib/achievements/definitions";
import { getChallenge, QUICK_PRACTICE_IDS } from "@/lib/challenges/definitions";
import { TRACKS, getEntriesForTrack, getModulesForTrack } from "@/lib/curriculum/catalog";
import type { TrackId } from "@/lib/curriculum/types";
import {
  completedChallengeCount,
  currentStreak,
  levelInfo,
  nextLesson,
  overallStats,
  recentAwards,
  totalXp,
  trackStats,
} from "@/lib/progress/calculations";
import { useProgress } from "@/lib/progress/store";
import type { ProgressState } from "@/lib/progress/types";
import { formatRelativeDay } from "@/lib/utils";
import { MissionTrack } from "./mission-track";

function DashboardSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading your progress">
      <Skeleton className="h-56" />
      <Skeleton className="h-20" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    </div>
  );
}

function Hero({ progress }: { progress: ProgressState }) {
  const xp = totalXp(progress);
  const info = levelInfo(xp);
  const upNext = nextLesson(progress);
  const isNew = Object.keys(progress.lessons).length === 0 && xp === 0;
  return (
    <Card className="bg-hero-glow relative overflow-hidden p-5 sm:p-8">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div className="relative grid gap-8 lg:grid-cols-[1fr_18rem] lg:items-end">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-accent-strong">{isNew ? "Welcome, explorer" : "Welcome back"}</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {isNew ? "Your DevOps journey starts here." : "Keep your momentum going."}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted sm:text-base">
            {isNew
              ? "Learn Docker and Kubernetes through short missions, quizzes, and a safe simulated terminal. No account needed."
              : `You've completed ${overallStats(progress).completed} of ${overallStats(progress).total} lessons. Pick up where you left off.`}
          </p>
          <div className="mt-6">
            {upNext ? (
              <>
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link href={`/lesson/${upNext.slug}`}>
                    {isNew ? "Start learning" : "Continue learning"}
                    <ArrowRight aria-hidden />
                  </Link>
                </Button>
                <p className="mt-2 text-xs text-muted">
                  Up next: <span className="text-foreground">{upNext.title}</span> · ~{upNext.estimatedMinutes} min
                </p>
              </>
            ) : (
              <Button asChild size="lg" variant="success">
                <Link href="/achievements">Every lesson complete. See your achievements</Link>
              </Button>
            )}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-background-2/70 p-4">
          <p className="text-xs text-subtle">Current level</p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            Level {info.current.level} · {info.current.title}
          </p>
          <ProgressBar className="mt-3" tone="gradient" value={info.ratio * 100} label="XP progress to the next level" />
          <p className="mt-2 font-mono text-xs text-muted">
            {info.next ? `${info.xp} / ${info.next.minXp} XP · next: ${info.next.title}` : `${info.xp} XP · max level reached`}
          </p>
        </div>
      </div>
    </Card>
  );
}

function StatsStrip({ progress }: { progress: ProgressState }) {
  const stats = overallStats(progress);
  const items = [
    { label: "Lessons completed", value: `${stats.completed}/${stats.total}` },
    { label: "Total XP", value: String(totalXp(progress)) },
    { label: "Challenges done", value: String(completedChallengeCount(progress)) },
    { label: "Day streak (this device)", value: String(currentStreak(progress)) },
  ];
  return (
    <dl className="grid grid-cols-2 divide-border overflow-hidden rounded-xl border border-border bg-surface sm:grid-cols-4 sm:divide-x [&>div:nth-child(-n+2)]:border-b sm:[&>div:nth-child(-n+2)]:border-b-0 [&>div:nth-child(odd)]:border-r sm:[&>div:nth-child(odd)]:border-r-0">
      {items.map((item) => (
        <div key={item.label} className="border-border p-4">
          <dt className="text-xs text-subtle">{item.label}</dt>
          <dd className="mt-1 font-mono text-xl font-semibold tabular-nums text-foreground sm:text-2xl">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function PathCard({ track, progress }: { track: TrackId; progress: ProgressState }) {
  const meta = TRACKS[track];
  const stats = trackStats(track, progress);
  const minutes = getEntriesForTrack(track).reduce((sum, e) => sum + e.estimatedMinutes, 0);
  const Icon = track === "docker" ? Box : Ship;
  return (
    <Link href={meta.href} className="group block">
      <Card interactive className="h-full p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-2 text-accent-strong">
            <Icon className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-foreground sm:text-base">{meta.title}</h3>
            <p className="mt-1 text-sm leading-6 text-muted">{meta.tagline}</p>
            <p className="mt-2 font-mono text-[11px] text-subtle">
              {getModulesForTrack(track).length} modules · {stats.total} lessons · ~{Math.round(minutes / 60)} h
            </p>
          </div>
          <ArrowRight className="size-4 shrink-0 text-subtle transition-transform group-hover:translate-x-0.5" aria-hidden />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <ProgressBar size="sm" value={stats.completed} max={stats.total} label={`${meta.title} progress`} />
          <span className="shrink-0 font-mono text-xs text-muted">
            {stats.completed}/{stats.total}
          </span>
        </div>
      </Card>
    </Link>
  );
}

function QuickPractice({ progress }: { progress: ProgressState }) {
  // Pick once per visit so finishing a challenge shows its result instead of jumping to the next one.
  const [id] = useState(() => QUICK_PRACTICE_IDS.find((c) => progress.challenges[c]?.status !== "completed") ?? QUICK_PRACTICE_IDS[0]);
  const challenge = getChallenge(id)!;
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="flex items-center gap-2 text-xs text-subtle">
            <Clock className="size-3.5" aria-hidden /> Under {challenge.estimatedMinutes + 1} minutes
          </p>
          <h3 className="mt-1 text-sm font-semibold text-foreground sm:text-base">{challenge.title}</h3>
          <p className="mt-1 text-sm text-muted">{challenge.goal}</p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href={`/challenges/${challenge.id}`}>Open full challenge</Link>
        </Button>
      </div>
      <div className="mt-4">
        <ChallengeRunner challenge={challenge} compact />
      </div>
    </Card>
  );
}

function RecentAchievements({ progress }: { progress: ProgressState }) {
  const unlocked = Object.entries(progress.achievements)
    .sort((a, b) => b[1].localeCompare(a[1]))
    .slice(0, 3)
    .map(([id, at]) => ({ def: getAchievement(id), at }))
    .filter((x) => x.def);
  return (
    <Card className="p-4 sm:p-5">
      <SectionHeading
        as="h3"
        title="Recent achievements"
        action={
          <Link href="/achievements" className="text-xs text-muted hover:text-foreground">
            View all ({Object.keys(progress.achievements).length}/{ACHIEVEMENTS.length})
          </Link>
        }
      />
      {unlocked.length === 0 ? (
        <div className="bg-grid flex items-center gap-3 rounded-lg border border-border p-4">
          <span className="relative flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-subtle">
            <Award className="size-5" aria-hidden />
            <Lock className="absolute -bottom-1 -right-1 size-3.5 rounded bg-background-2 p-0.5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">No badges yet</p>
            <p className="text-sm text-muted">Complete your first lesson to earn First Steps.</p>
          </div>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {unlocked.map(({ def, at }) => (
            <li key={def!.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-accent-border bg-accent-soft text-accent-strong">
                <Award className="size-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{def!.title}</p>
                <p className="truncate text-xs text-muted">{def!.description}</p>
              </div>
              <span className="shrink-0 text-xs text-subtle">{formatRelativeDay(at)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function RecentActivity({ progress }: { progress: ProgressState }) {
  const awards = recentAwards(progress, 5);
  return (
    <Card className="p-4 sm:p-5">
      <SectionHeading as="h3" title="Recent activity" description="XP earned on this device" />
      {awards.length === 0 ? (
        <div className="bg-grid flex items-center gap-3 rounded-lg border border-border p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-subtle">
            <Sparkles className="size-5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">Nothing yet</p>
            <p className="text-sm text-muted">Lessons, quizzes, and challenges you finish show up here.</p>
          </div>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {awards.map((a) => (
            <li key={a.key} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
              <span className="min-w-0 truncate text-sm text-muted">{a.label}</span>
              <span className="shrink-0 font-mono text-xs text-accent-strong">+{a.amount} XP</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function DashboardView() {
  const progress = useProgress();
  if (!progress) return <DashboardSkeleton />;
  return (
    <div className="space-y-8 sm:space-y-10">
      <Hero progress={progress} />
      <StatsStrip progress={progress} />
      <section aria-labelledby="paths-heading">
        <SectionHeading id="paths-heading" title="Learning paths" description="Start with Docker, or jump into Kubernetes if you already know containers." />
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
          <PathCard track="docker" progress={progress} />
          <PathCard track="kubernetes" progress={progress} />
        </div>
      </section>
      <section aria-labelledby="track-heading">
        <SectionHeading
          id="track-heading"
          title="Mission track"
          description="Eight modules from containers to clusters. Locked missions open as you finish the one before."
          action={
            <Link href="/learn" className="text-xs text-muted hover:text-foreground">
              Full learning path
            </Link>
          }
        />
        <MissionTrack progress={progress} />
      </section>
      <section aria-labelledby="practice-heading">
        <SectionHeading
          id="practice-heading"
          title="Quick practice"
          description="A small challenge you can finish in a few minutes."
          action={<Badge tone="outline">+30 XP once</Badge>}
        />
        <QuickPractice progress={progress} />
      </section>
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
        <RecentAchievements progress={progress} />
        <RecentActivity progress={progress} />
      </div>
    </div>
  );
}
