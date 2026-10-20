"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { ClassifyActivity as ClassifyData } from "@/lib/curriculum/types";
import { cn, seededShuffle } from "@/lib/utils";
import { type ActivityProps, FeedbackLine, SuccessPanel, Verdict } from "./shared";

export function ClassifyActivity({ activity, completed, onComplete, onAttempt }: ActivityProps<ClassifyData>) {
  const items = useMemo(() => seededShuffle(activity.items, activity.title), [activity]);
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    completed ? Object.fromEntries(activity.items.map((i) => [i.id, i.bucket])) : {},
  );
  const [checked, setChecked] = useState(completed);
  const [solved, setSolved] = useState(completed);

  const allChosen = items.every((i) => answers[i.id]);
  const correctCount = items.filter((i) => answers[i.id] === i.bucket).length;

  const check = () => {
    setChecked(true);
    onAttempt?.();
    if (correctCount === items.length) {
      setSolved(true);
      onComplete();
    }
  };

  return (
    <div>
      <ul className="divide-y divide-border rounded-lg border border-border bg-surface-2">
        {items.map((item) => {
          const isRight = answers[item.id] === item.bucket;
          return (
            <li key={item.id} className="flex flex-col gap-2 p-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className="text-sm text-foreground">{item.label}</p>
                {checked && !solved && answers[item.id] ? <div className="mt-1"><Verdict correct={isRight} /></div> : null}
              </div>
              <div role="radiogroup" aria-label={`Category for: ${item.label}`} className="flex shrink-0 flex-wrap gap-1.5">
                {activity.buckets.map((bucket) => {
                  const selected = answers[item.id] === bucket.id;
                  return (
                    <button
                      key={bucket.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      disabled={solved}
                      onClick={() => {
                        setAnswers((a) => ({ ...a, [item.id]: bucket.id }));
                        setChecked(false);
                      }}
                      className={cn(
                        "min-h-10 rounded-lg border px-3 text-xs font-medium transition-colors disabled:cursor-default",
                        selected
                          ? "border-accent-border bg-accent-soft text-foreground"
                          : "border-border bg-surface text-muted hover:border-border-strong hover:text-foreground",
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "mr-1.5 inline-block size-2 rounded-full border align-middle",
                          selected ? "border-accent-strong bg-accent-strong" : "border-border-strong",
                        )}
                      />
                      {bucket.label}
                    </button>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>
      {!solved ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button onClick={check} disabled={!allChosen}>
            Check answers
          </Button>
          {!allChosen ? <span className="text-xs text-subtle">Sort every item first.</span> : null}
        </div>
      ) : null}
      {checked && !solved ? (
        <FeedbackLine ok={false}>
          {correctCount} of {items.length} are sorted correctly. Fix the incorrect ones and check again.
        </FeedbackLine>
      ) : null}
      {solved ? <SuccessPanel title="All sorted">{activity.explanation}</SuccessPanel> : null}
    </div>
  );
}
