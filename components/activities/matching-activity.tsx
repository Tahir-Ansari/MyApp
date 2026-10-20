"use client";

import { useId, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { MatchingActivity as MatchingData } from "@/lib/curriculum/types";
import { cn, seededShuffle } from "@/lib/utils";
import { type ActivityProps, FeedbackLine, SuccessPanel, Verdict } from "./shared";

export function MatchingActivity({ activity, completed, onComplete, onAttempt }: ActivityProps<MatchingData>) {
  const baseId = useId();
  const definitions = useMemo(() => seededShuffle(activity.pairs, `${activity.title}-defs`), [activity]);
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    completed ? Object.fromEntries(activity.pairs.map((p) => [p.id, p.id])) : {},
  );
  const [checked, setChecked] = useState(completed);
  const [solved, setSolved] = useState(completed);

  const allChosen = activity.pairs.every((p) => answers[p.id]);
  const correctCount = activity.pairs.filter((p) => answers[p.id] === p.id).length;

  const check = () => {
    setChecked(true);
    onAttempt?.();
    if (correctCount === activity.pairs.length) {
      setSolved(true);
      onComplete();
    }
  };

  return (
    <div>
      <ul className="divide-y divide-border rounded-lg border border-border bg-surface-2">
        {activity.pairs.map((pair) => {
          const selectId = `${baseId}-${pair.id}`;
          const isRight = answers[pair.id] === pair.id;
          return (
            <li key={pair.id} className="grid gap-2 p-3 sm:grid-cols-[minmax(0,10rem)_1fr] sm:items-center sm:gap-4">
              <label htmlFor={selectId} className="text-sm font-medium text-foreground">
                {pair.term}
              </label>
              <div className="min-w-0">
                <select
                  id={selectId}
                  value={answers[pair.id] ?? ""}
                  disabled={solved}
                  onChange={(e) => {
                    setAnswers((a) => ({ ...a, [pair.id]: e.target.value }));
                    setChecked(false);
                  }}
                  className={cn(
                    "h-11 w-full min-w-0 rounded-lg border bg-surface px-3 text-sm text-foreground focus-visible:border-accent-border sm:h-10",
                    checked ? (isRight ? "border-success/50" : "border-danger/50") : "border-border-strong",
                  )}
                >
                  <option value="" disabled>
                    Choose a definition…
                  </option>
                  {definitions.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.definition}
                    </option>
                  ))}
                </select>
                {checked && !solved ? <div className="mt-1"><Verdict correct={isRight} /></div> : null}
              </div>
            </li>
          );
        })}
      </ul>
      {!solved ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button onClick={check} disabled={!allChosen}>
            Check matches
          </Button>
          {!allChosen ? <span className="text-xs text-subtle">Choose a definition for every term.</span> : null}
        </div>
      ) : null}
      {checked && !solved ? (
        <FeedbackLine ok={false}>
          {correctCount} of {activity.pairs.length} matches are right. Change the incorrect ones and check again.
        </FeedbackLine>
      ) : null}
      {solved ? <SuccessPanel title="All matched">{activity.explanation}</SuccessPanel> : null}
    </div>
  );
}
