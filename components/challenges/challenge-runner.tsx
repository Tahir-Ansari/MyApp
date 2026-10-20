"use client";

import { useCallback, useRef, useState } from "react";
import { CheckCircle2, Circle, Eye, Lightbulb, RotateCcw } from "lucide-react";
import { ActivityRenderer, ACTIVITY_LABELS, activityInstructions } from "@/components/activities/activity-renderer";
import { RichText } from "@/components/learning/rich-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Challenge } from "@/lib/challenges/definitions";
import { XP_REWARDS } from "@/lib/progress/config";
import { completeChallenge, recordChallengeAttempt, startChallenge, useProgress } from "@/lib/progress/store";
import { cn } from "@/lib/utils";

export function ChallengeRunner({ challenge, compact = false }: { challenge: Challenge; compact?: boolean }) {
  const progress = useProgress();
  const record = progress?.challenges[challenge.id];
  const alreadyDone = record?.status === "completed";
  const [run, setRun] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [hintsShown, setHintsShown] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const started = useRef(false);
  const total = challenge.steps.length;
  const replaying = run > 0;
  const finished = stepIndex >= total || (alreadyDone && !replaying);

  const onAttempt = useCallback(() => {
    if (!started.current) {
      started.current = true;
      startChallenge(challenge.id);
    }
  }, [challenge.id]);

  const onStepComplete = useCallback(
    (index: number) => {
      setStepIndex((current) => {
        if (index !== current) return current;
        const next = current + 1;
        if (next >= total) queueMicrotask(() => completeChallenge(challenge.id, challenge.title));
        return next;
      });
      recordChallengeAttempt(challenge.id);
    },
    [challenge.id, challenge.title, total],
  );

  const restart = () => {
    setRun((r) => r + 1);
    setStepIndex(0);
    setShowSolution(false);
  };

  return (
    <div className={cn(!compact && "space-y-6")}>
      {!compact ? (
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
          <div>
            <p className="text-sm font-semibold text-foreground">Goal</p>
            <p className="prose-code mt-1 text-sm leading-6 text-muted">
              <RichText text={challenge.goal} />
            </p>
          </div>
          <div className="flex flex-wrap gap-2 md:justify-end">
            {alreadyDone ? (
              <Badge tone="success">
                <CheckCircle2 aria-hidden /> Completed · XP earned
              </Badge>
            ) : (
              <Badge tone="accent">+{XP_REWARDS.challengeComplete} XP on first completion</Badge>
            )}
          </div>
        </div>
      ) : null}

      {total > 1 ? (
        <ol className="flex flex-wrap gap-2" aria-label="Challenge parts">
          {challenge.steps.map((step, i) => {
            const done = finished || i < stepIndex;
            return (
              <li key={i} className={cn("flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs", done ? "border-accent-border bg-accent-soft text-foreground" : i === stepIndex ? "border-border-strong text-foreground" : "border-border text-subtle")}>
                {done ? <CheckCircle2 className="size-3.5 text-accent-strong" aria-hidden /> : <Circle className="size-3.5" aria-hidden />}
                Part {i + 1}: {step.title}
                <span className="sr-only">{done ? "(done)" : i === stepIndex ? "(current)" : "(not started)"}</span>
              </li>
            );
          })}
        </ol>
      ) : null}

      {finished ? (
        <div role="status" className={cn("rounded-lg border border-success/40 bg-success-soft p-4", compact && "mt-3")}>
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <CheckCircle2 className="size-4 text-success" aria-hidden />
            Challenge complete
          </p>
          <p className="prose-code mt-1.5 text-sm leading-6 text-muted">
            <span className="font-medium text-foreground">Solution: </span>
            <RichText text={challenge.solution} />
          </p>
          <p className="mt-2 text-xs text-subtle">XP is awarded once. Replaying is for practice only.</p>
          <Button size="sm" variant="secondary" className="mt-3" onClick={restart}>
            <RotateCcw aria-hidden /> Practice again
          </Button>
        </div>
      ) : (
        <div key={`${run}-${stepIndex}`} className={cn(compact && "mt-3")}>
          {(() => {
            const step = challenge.steps[stepIndex];
            const instructions = activityInstructions(step);
            return (
              <section aria-label={`Part ${stepIndex + 1}: ${step.title}`}>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge tone="outline">{ACTIVITY_LABELS[step.type]}</Badge>
                  <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
                </div>
                {instructions ? (
                  <p className="prose-code mb-3 text-sm text-muted">
                    <RichText text={instructions} />
                  </p>
                ) : null}
                <ActivityRenderer activity={step} completed={false} onAttempt={onAttempt} onComplete={() => onStepComplete(stepIndex)} />
              </section>
            );
          })()}
        </div>
      )}

      {!finished && !compact ? (
        <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Lightbulb className="size-4 text-warning" aria-hidden /> Hints
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setHintsShown((h) => Math.min(challenge.hints.length, h + 1))} disabled={hintsShown >= challenge.hints.length}>
                {hintsShown === 0 ? "Show a hint" : hintsShown >= challenge.hints.length ? "No more hints" : "Next hint"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowSolution((s) => !s)} aria-expanded={showSolution}>
                <Eye aria-hidden /> {showSolution ? "Hide solution" : "Reveal solution"}
              </Button>
            </div>
          </div>
          {hintsShown > 0 ? (
            <ol className="mt-3 space-y-2">
              {challenge.hints.slice(0, hintsShown).map((hint, i) => (
                <li key={i} className="prose-code rounded-lg bg-surface-2 p-3 text-sm text-muted">
                  <span className="mr-2 font-mono text-xs text-subtle">{i + 1}.</span>
                  <RichText text={hint} />
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-2 text-xs text-subtle">Hints are optional and don&apos;t cost XP.</p>
          )}
          {showSolution ? (
            <p className="prose-code mt-3 rounded-lg border-l-2 border-l-accent bg-surface-2 p-3 text-sm text-muted">
              <RichText text={challenge.solution} />
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
