"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock,
  Eye,
  ListChecks,
  Lock,
  PartyPopper,
  Sparkles,
  Target,
} from "lucide-react";
import { ActivityRenderer, ACTIVITY_LABELS, activityInstructions } from "@/components/activities/activity-renderer";
import { QuizEngine } from "@/components/quiz/quiz-engine";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, Skeleton } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress";
import { TRACKS, getLessonEntry } from "@/lib/curriculum/catalog";
import type { Lesson } from "@/lib/curriculum/types";
import { lessonStatus } from "@/lib/progress/calculations";
import { XP_REWARDS } from "@/lib/progress/config";
import { completeActivity, completeLesson, recordQuizAttempt, useProgress } from "@/lib/progress/store";
import type { ProgressState } from "@/lib/progress/types";
import { cn } from "@/lib/utils";
import { LessonSection } from "./lesson-section";
import { RichText } from "./rich-text";

type StepId = "learn" | "visualize" | "try" | "check" | "reflect";

interface StepState {
  id: StepId;
  label: string;
  anchor: string;
  done: boolean;
  icon: typeof BookOpen;
}

function computeSteps(lesson: Lesson, progress: ProgressState, readDone: boolean): StepState[] {
  const activityDone = Boolean(progress.activities[lesson.slug]);
  const quizPassed = Boolean(progress.quizzes[lesson.slug]?.passed);
  const lessonDone = Boolean(progress.lessons[lesson.slug]);
  const learned = readDone || activityDone || quizPassed || lessonDone;
  return [
    { id: "learn", label: "Learn", anchor: "learn", done: learned, icon: BookOpen },
    { id: "visualize", label: "Visualize", anchor: "visualize", done: learned, icon: Eye },
    { id: "try", label: "Try", anchor: "try", done: activityDone, icon: Target },
    { id: "check", label: "Check", anchor: "check", done: quizPassed, icon: ListChecks },
    { id: "reflect", label: "Reflect", anchor: "reflect", done: lessonDone, icon: Sparkles },
  ];
}

function Outline({ lesson, steps, progress }: { lesson: Lesson; steps: StepState[]; progress: ProgressState }) {
  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-subtle">Lesson outline</p>
        <ol className="space-y-1">
          {steps.map((step, i) => (
            <li key={step.id}>
              <a href={`#${step.anchor}`} className="flex h-9 items-center gap-2.5 rounded-lg px-2 text-sm hover:bg-surface-2">
                {step.done ? <CheckCircle2 className="size-4 text-accent-strong" aria-hidden /> : <Circle className="size-4 text-subtle" aria-hidden />}
                <span className={step.done ? "text-accent-strong" : "text-muted"}>
                  {i + 1}. {step.label}
                </span>
                <span className="sr-only">{step.done ? "(done)" : "(not done)"}</span>
              </a>
            </li>
          ))}
        </ol>
      </div>
      <div>
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-subtle">Objectives</p>
        <ul className="space-y-2">
          {lesson.objectives.map((o) => (
            <li key={o} className="flex gap-2 text-sm text-muted">
              {progress.lessons[lesson.slug] ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent-strong" aria-hidden />
              ) : (
                <Circle className="mt-0.5 size-4 shrink-0 text-subtle" aria-hidden />
              )}
              <span>{o}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-lg border border-border bg-surface-2 p-3 text-xs leading-5 text-muted">
        <p className="font-medium text-foreground">XP for this lesson</p>
        <p className="mt-1 font-mono">
          +{XP_REWARDS.lessonComplete} complete · +{XP_REWARDS.quizPass} pass quiz · +{XP_REWARDS.quizPerfect} perfect
        </p>
      </div>
    </div>
  );
}

function StepHeading({ id, step, title, kind }: { id: string; step: number; title: string; kind: string }) {
  return (
    <div id={id} className="mb-4 scroll-mt-24 flex flex-wrap items-center gap-2">
      <span className="font-mono text-xs uppercase tracking-[0.14em] text-accent-strong">
        Step {step} · {kind}
      </span>
      <h2 className="w-full text-base font-semibold tracking-tight text-foreground sm:text-lg">{title}</h2>
    </div>
  );
}

export function LessonPlayer({ lesson }: { lesson: Lesson }) {
  const progress = useProgress();
  const [readDone, setReadDone] = useState(false);
  const [previewLocked, setPreviewLocked] = useState(false);

  if (!progress) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Loading lesson">
        <Skeleton className="h-24" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return <LessonBody lesson={lesson} progress={progress} readDone={readDone} setReadDone={setReadDone} previewLocked={previewLocked} setPreviewLocked={setPreviewLocked} />;
}

function LessonBody({
  lesson,
  progress,
  readDone,
  setReadDone,
  previewLocked,
  setPreviewLocked,
}: {
  lesson: Lesson;
  progress: ProgressState;
  readDone: boolean;
  setReadDone: (v: boolean) => void;
  previewLocked: boolean;
  setPreviewLocked: (v: boolean) => void;
}) {
  const steps = computeSteps(lesson, progress, readDone);
  const status = lessonStatus(lesson, progress);
  const activityDone = Boolean(progress.activities[lesson.slug]);
  const quiz = progress.quizzes[lesson.slug];
  const lessonDone = status === "completed";
  const canComplete = activityDone && Boolean(quiz?.passed);
  const doneCount = steps.filter((s) => s.done).length;
  const prev = lesson.previousSlug ? getLessonEntry(lesson.previousSlug) : null;
  const next = lesson.nextSlug ? getLessonEntry(lesson.nextSlug) : null;
  const firstDiagram = lesson.sections.findIndex((s) => s.type === "diagram");
  const track = TRACKS[lesson.track];

  const header = (
    <header className="mb-6">
      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/learn" className="hover:text-foreground">Learn</Link>
          </li>
          <li aria-hidden className="text-subtle">/</li>
          <li>
            <Link href={track.href} className="hover:text-foreground">{track.title}</Link>
          </li>
          <li aria-hidden className="text-subtle">/</li>
          <li className="text-subtle">
            Module {lesson.module.number}: {lesson.module.title}
          </li>
        </ol>
      </nav>
      <p className="font-mono text-xs uppercase tracking-[0.14em] text-accent-strong">Lesson {lesson.number}</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{lesson.title}</h1>
      <p className="mt-2 max-w-prose text-sm leading-6 text-muted sm:text-base">{lesson.summary}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge tone="outline">
          <Clock aria-hidden /> ~{lesson.estimatedMinutes} min
        </Badge>
        <Badge tone="outline">{lesson.difficulty === "beginner" ? "Beginner" : "Intermediate"}</Badge>
        {lessonDone ? (
          <Badge tone="success">
            <CheckCircle2 aria-hidden /> Completed
          </Badge>
        ) : null}
      </div>
    </header>
  );

  if (status === "locked" && !previewLocked) {
    const prereq = lesson.prerequisites[0] ? getLessonEntry(lesson.prerequisites[0]) : null;
    return (
      <div>
        {header}
        <Card className="bg-grid p-5 sm:p-8">
          <span className="flex size-10 items-center justify-center rounded-lg bg-surface-2 text-subtle">
            <Lock className="size-5" aria-hidden />
          </span>
          <h2 className="mt-4 text-base font-semibold text-foreground sm:text-lg">This mission is locked</h2>
          <p className="mt-1 max-w-prose text-sm leading-6 text-muted">
            It builds on <span className="text-foreground">{prereq?.title ?? "the previous lesson"}</span>. Complete that first to unlock it, or preview it now. You can still earn XP while previewing.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {prereq ? (
              <Button asChild>
                <Link href={`/lesson/${prereq.slug}`}>Go to the previous lesson</Link>
              </Button>
            ) : null}
            <Button variant="secondary" onClick={() => setPreviewLocked(true)}>
              Preview anyway
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="sticky top-14 z-20 -mx-4 mb-4 border-b border-border bg-background/95 px-4 py-2 sm:-mx-6 sm:px-6 lg:top-0 lg:-mx-10 lg:px-10">
        <div className="flex items-center gap-3">
          <span className="shrink-0 text-xs text-muted">
            {doneCount}/{steps.length} steps
          </span>
          <ProgressBar size="sm" value={doneCount} max={steps.length} label="Lesson progress" />
        </div>
      </div>
      {header}
      <details className="mb-6 rounded-xl border border-border bg-surface p-4 lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-foreground">
          Lesson outline &amp; objectives
          <ChevronDown className="size-4 text-subtle" aria-hidden />
        </summary>
        <div className="mt-4">
          <Outline lesson={lesson} steps={steps} progress={progress} />
        </div>
      </details>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_15rem] xl:gap-10">
        <div className="min-w-0 space-y-10">
          <section aria-labelledby="learn-title">
            <div id="learn" className="scroll-mt-24">
              <span className="font-mono text-xs uppercase tracking-[0.14em] text-accent-strong">Step 1–2 · Learn &amp; visualize</span>
              <h2 id="learn-title" className="mt-1 text-base font-semibold tracking-tight text-foreground sm:text-lg">
                The concept
              </h2>
            </div>
            <div className="mt-5 space-y-6">
              {lesson.sections.map((section, i) => (
                <div key={i} id={i === firstDiagram ? "visualize" : undefined} className={i === firstDiagram ? "scroll-mt-24" : undefined}>
                  <LessonSection section={section} />
                </div>
              ))}
            </div>
            {!steps[0].done ? (
              <div className="mt-6">
                <Button variant="secondary" onClick={() => setReadDone(true)} asChild>
                  <a href="#try">
                    I&apos;ve read this, now let me try it <ArrowRight aria-hidden />
                  </a>
                </Button>
              </div>
            ) : null}
          </section>

          <section aria-labelledby="try-title" className="rounded-xl border border-border bg-surface p-4 sm:p-5">
            <div id="try" className="mb-4 scroll-mt-24">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs uppercase tracking-[0.14em] text-accent-strong">Step 3 · Try it</span>
                <Badge tone="outline">{ACTIVITY_LABELS[lesson.activity.type]}</Badge>
                {activityDone ? (
                  <Badge tone="success">
                    <CheckCircle2 aria-hidden /> Done
                  </Badge>
                ) : null}
              </div>
              <h2 id="try-title" className="mt-1 text-base font-semibold tracking-tight text-foreground sm:text-lg">
                {lesson.activity.title}
              </h2>
              {activityInstructions(lesson.activity) ? (
                <p className="prose-code mt-1 text-sm text-muted">
                  <RichText text={activityInstructions(lesson.activity)!} />
                </p>
              ) : null}
            </div>
            <ActivityRenderer
              activity={lesson.activity}
              completed={activityDone}
              onComplete={() => {
                setReadDone(true);
                completeActivity(lesson.slug);
              }}
            />
          </section>

          <section aria-labelledby="check-title" className="rounded-xl border border-border bg-surface p-4 sm:p-5">
            <StepHeading id="check" step={4} kind="Check" title="Check your understanding" />
            <h2 id="check-title" className="sr-only">Quiz</h2>
            <QuizEngine
              quizId={lesson.slug}
              questions={lesson.quizQuestions}
              record={quiz}
              onSubmit={(score, total) => recordQuizAttempt(lesson.slug, lesson.title, score, total)}
            />
          </section>

          <section aria-labelledby="reflect-title">
            <StepHeading id="reflect" step={5} kind="Reflect" title="Key takeaways" />
            <h2 id="reflect-title" className="sr-only">Reflect</h2>
            <ul className="max-w-prose space-y-2">
              {lesson.keyTakeaways.map((t) => (
                <li key={t} className="prose-code flex gap-3 text-[15px] leading-7 text-foreground sm:text-base">
                  <CheckCircle2 className="mt-1.5 size-4 shrink-0 text-accent-strong" aria-hidden />
                  <span>
                    <RichText text={t} />
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-6 rounded-xl border border-border bg-surface p-4 sm:p-5">
              {lessonDone ? (
                <div role="status">
                  <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <PartyPopper className="size-4 text-accent-strong" aria-hidden />
                    Lesson complete
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {next ? <>Next up: <span className="text-foreground">{next.title}</span>.</> : "That was the final lesson. Outstanding work."} You can revisit this lesson anytime; XP is only awarded once.
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-semibold text-foreground">Finish the lesson</p>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li className={cn("flex items-center gap-2", activityDone ? "text-success" : "text-muted")}>
                      {activityDone ? <CheckCircle2 className="size-4" aria-hidden /> : <Circle className="size-4" aria-hidden />}
                      {activityDone ? "Activity done" : "Complete the activity in step 3"}
                    </li>
                    <li className={cn("flex items-center gap-2", quiz?.passed ? "text-success" : "text-muted")}>
                      {quiz?.passed ? <CheckCircle2 className="size-4" aria-hidden /> : <Circle className="size-4" aria-hidden />}
                      {quiz?.passed ? "Quiz passed" : "Pass the quiz in step 4"}
                    </li>
                  </ul>
                </div>
              )}
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                {!lessonDone ? (
                  <Button size="lg" className="w-full sm:w-auto" disabled={!canComplete} onClick={() => completeLesson(lesson.slug, lesson.title)}>
                    Complete lesson · +{XP_REWARDS.lessonComplete} XP
                  </Button>
                ) : next ? (
                  <Button asChild size="lg" className="w-full sm:w-auto">
                    <Link href={`/lesson/${next.slug}`}>
                      Continue <ArrowRight aria-hidden />
                    </Link>
                  </Button>
                ) : (
                  <Button asChild size="lg" className="w-full sm:w-auto">
                    <Link href="/achievements">See your achievements</Link>
                  </Button>
                )}
              </div>
            </div>
          </section>

          <nav aria-label="Lesson navigation" className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
            {prev ? (
              <Button asChild variant="ghost" className="justify-start">
                <Link href={`/lesson/${prev.slug}`}>
                  <ArrowLeft aria-hidden />
                  <span className="truncate">Previous: {prev.title}</span>
                </Link>
              </Button>
            ) : (
              <span />
            )}
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="secondary">
                <a href="#check">Check understanding</a>
              </Button>
              {next ? (
                <Button asChild variant="secondary">
                  <Link href={`/lesson/${next.slug}`}>
                    Next lesson <ArrowRight aria-hidden />
                  </Link>
                </Button>
              ) : null}
            </div>
          </nav>
        </div>

        <aside className="hidden lg:block" aria-label="Lesson outline">
          <div className="sticky top-16">
            <Outline lesson={lesson} steps={steps} progress={progress} />
          </div>
        </aside>
      </div>
    </div>
  );
}
