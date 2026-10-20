"use client";

import { useCallback, useState } from "react";
import { CheckCircle2, Circle, Lightbulb, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TerminalView } from "@/components/playground/terminal-view";
import { useTerminal } from "@/components/playground/use-terminal";
import { useActivityInProgress } from "@/lib/activity-state";
import type { TerminalActivity as TerminalData } from "@/lib/curriculum/types";
import { goalMet, type SimState } from "@/lib/simulator/goals";
import { cn } from "@/lib/utils";
import { type ActivityProps, SuccessPanel } from "./shared";

export function TerminalActivity({ activity, completed, onComplete, onAttempt }: ActivityProps<TerminalData>) {
  const [stepIndex, setStepIndex] = useState(completed ? activity.steps.length : 0);
  const [hintsShown, setHintsShown] = useState<Record<string, boolean>>({});
  const [draft, setDraft] = useState<{ key: number; value: string } | undefined>(undefined);
  const [lastExplanation, setLastExplanation] = useState<string | null>(null);
  const done = stepIndex >= activity.steps.length;
  useActivityInProgress(stepIndex > 0 && !done);

  const onCommand = useCallback(
    ({ command, ok, state }: { command: string; ok: boolean; state: SimState }) => {
      onAttempt?.();
      setStepIndex((current) => {
        let next = current;
        if (next < activity.steps.length && goalMet(activity.steps[next].goal, state, command, ok)) {
          next += 1;
          // Later state-based goals may already be satisfied by the same command.
          while (next < activity.steps.length && activity.steps[next].goal.kind !== "command" && goalMet(activity.steps[next].goal, state, command, ok)) {
            next += 1;
          }
        }
        if (next >= activity.steps.length && current < activity.steps.length) {
          queueMicrotask(onComplete);
        }
        return next;
      });
    },
    [activity.steps, onAttempt, onComplete],
  );

  const terminal = useTerminal({ mode: activity.mode, scenario: activity.scenario, onCommand });
  const latest = terminal.entries[terminal.entries.length - 1];
  const explanation = latest?.explanation ?? lastExplanation;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]">
      <div className="min-w-0">
        <TerminalView
          title={`${activity.mode === "docker" ? "docker" : "kubectl"} · simulated`}
          entries={terminal.entries}
          history={terminal.history}
          onRun={terminal.run}
          onClear={() => {
            if (latest?.explanation) setLastExplanation(latest.explanation);
            terminal.clear();
          }}
          onReset={() => {
            terminal.reset();
            setLastExplanation(null);
            if (!done) setStepIndex(0);
          }}
          draft={draft}
          welcome={`Simulated ${activity.mode === "docker" ? "Docker" : "Kubernetes"} environment. Nothing runs on your computer.\nType \`help\` to list supported commands.`}
          bodyClassName="min-h-[14rem] max-h-[24rem]"
        />
        {explanation ? (
          <div className="mt-3 rounded-lg border-l-2 border-l-accent bg-surface-2 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-subtle">What did this command do?</p>
            <p className="prose-code mt-1 text-sm leading-6 text-muted">{renderTicks(explanation)}</p>
          </div>
        ) : null}
      </div>
      <div>
        <p className="mb-2 flex items-center justify-between text-xs text-subtle">
          <span>Checklist</span>
          <span className="font-mono">
            {Math.min(stepIndex, activity.steps.length)} / {activity.steps.length}
          </span>
        </p>
        <ol className="space-y-2">
          {activity.steps.map((step, i) => {
            const isDone = i < stepIndex;
            const isCurrent = i === stepIndex;
            return (
              <li
                key={step.id}
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "rounded-lg border p-3",
                  isDone && "border-accent-border bg-accent-soft",
                  isCurrent && "border-accent-border bg-surface-2",
                  !isDone && !isCurrent && "border-border bg-surface",
                )}
              >
                <div className="flex items-start gap-2">
                  {isDone ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent-strong" aria-hidden />
                  ) : (
                    <Circle className={cn("mt-0.5 size-4 shrink-0", isCurrent ? "text-muted" : "text-subtle")} aria-hidden />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-sm", isDone || isCurrent ? "text-foreground" : "text-muted")}>{step.instruction}</p>
                    <span className="sr-only">{isDone ? "Done" : isCurrent ? "Current step" : "Not started"}</span>
                    {isCurrent ? (
                      hintsShown[step.id] ? (
                        <div className="mt-2 space-y-2">
                          <code className="block break-all rounded-md bg-terminal px-2 py-1.5 font-mono text-xs text-terminal-fg">{step.hint}</code>
                          {/^(docker|kubectl|curl|cat|ls)\b/.test(step.hint) ? (
                            <Button size="sm" variant="secondary" onClick={() => setDraft({ key: Date.now(), value: step.hint })}>
                              <Play aria-hidden />
                              Put in terminal
                            </Button>
                          ) : null}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setHintsShown((h) => ({ ...h, [step.id]: true }))}
                          className="mt-2 inline-flex min-h-8 items-center gap-1.5 rounded-md text-xs text-warning hover:underline"
                        >
                          <Lightbulb className="size-3.5" aria-hidden />
                          Show hint
                        </button>
                      )
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
        {done ? (
          <div className="mt-3">
            <Badge tone="success">
              <CheckCircle2 aria-hidden /> All steps done
            </Badge>
          </div>
        ) : null}
      </div>
      {done ? (
        <div className="lg:col-span-2">
          <SuccessPanel title="Terminal task complete">{activity.explanation}</SuccessPanel>
        </div>
      ) : null}
    </div>
  );
}

/** Renders `code` spans in plain explanation strings. */
export function renderTicks(text: string): React.ReactNode[] {
  return text.split(/(`[^`]+`)/g).map((part, i) =>
    part.startsWith("`") && part.endsWith("`") ? <code key={i}>{part.slice(1, -1)}</code> : <span key={i}>{part}</span>,
  );
}
