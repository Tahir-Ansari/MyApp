"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/learning/code-block";
import type { ScenarioActivity as ScenarioData } from "@/lib/curriculum/types";
import { cn } from "@/lib/utils";
import { type ActivityProps, FeedbackLine, SuccessPanel } from "./shared";

export function ScenarioActivity({ activity, completed, onComplete, onAttempt }: ActivityProps<ScenarioData>) {
  const correctOption = activity.options.find((o) => o.correct);
  const [selected, setSelected] = useState<string | null>(completed ? (correctOption?.id ?? null) : null);
  const [submitted, setSubmitted] = useState<string | null>(completed ? (correctOption?.id ?? null) : null);
  const chosen = activity.options.find((o) => o.id === submitted);
  const solved = Boolean(chosen?.correct);

  const submit = () => {
    if (!selected) return;
    setSubmitted(selected);
    onAttempt?.();
    if (activity.options.find((o) => o.id === selected)?.correct) onComplete();
  };

  return (
    <div>
      <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-surface-2 p-3">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
        <p className="text-sm leading-6 text-foreground">
          <span className="font-medium">Symptom: </span>
          <span className="prose-code">{activity.symptom}</span>
        </p>
      </div>
      {activity.context ? (
        <CodeBlock className="mt-3" code={activity.context.code} language={activity.context.language ?? "text"} filename={activity.context.label} />
      ) : null}
      <fieldset className="mt-4">
        <legend className="text-sm font-medium text-foreground">{activity.question}</legend>
        <div className="mt-3 space-y-2">
          {activity.options.map((option) => {
            const isSelected = selected === option.id;
            const isSubmitted = submitted === option.id;
            return (
              <label
                key={option.id}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors sm:p-4",
                  isSubmitted && option.correct && "border-success/50 bg-success-soft",
                  isSubmitted && !option.correct && "border-danger/50 bg-danger-soft",
                  !isSubmitted && isSelected && "border-accent-border bg-accent-soft",
                  !isSubmitted && !isSelected && "border-border bg-surface-2 hover:border-border-strong",
                  solved && "cursor-default",
                )}
              >
                <input
                  type="radio"
                  name={`scenario-${activity.title}`}
                  value={option.id}
                  checked={isSelected}
                  disabled={solved}
                  onChange={() => setSelected(option.id)}
                  className="mt-0.5 size-4 shrink-0 accent-[var(--accent)]"
                />
                <span className="prose-code text-foreground">{option.text}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
      {chosen ? <FeedbackLine ok={chosen.correct}>{chosen.correct ? "Good call. " : "Not quite. "}{chosen.feedback}</FeedbackLine> : null}
      {!solved ? (
        <div className="mt-4">
          <Button onClick={submit} disabled={!selected || selected === submitted}>
            {submitted ? "Try this answer" : "Check answer"}
          </Button>
        </div>
      ) : (
        <SuccessPanel title="Scenario solved">{activity.explanation}</SuccessPanel>
      )}
    </div>
  );
}
