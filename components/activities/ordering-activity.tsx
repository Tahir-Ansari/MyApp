"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowDown, ArrowUp, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OrderingActivity as OrderingData } from "@/lib/curriculum/types";
import { cn, seededShuffle } from "@/lib/utils";
import { type ActivityProps, FeedbackLine, SuccessPanel, Verdict } from "./shared";

function initialOrder(activity: OrderingData) {
  const ids = activity.items.map((i) => i.id);
  const shuffled = seededShuffle(ids, activity.title);
  // Never start already solved.
  return shuffled.every((id, i) => id === ids[i]) ? [...shuffled.slice(1), shuffled[0]] : shuffled;
}

export function OrderingActivity({ activity, completed, onComplete, onAttempt }: ActivityProps<OrderingData>) {
  const reduce = useReducedMotion();
  const byId = useMemo(() => new Map(activity.items.map((i) => [i.id, i])), [activity.items]);
  const [order, setOrder] = useState<string[]>(() => (completed ? activity.items.map((i) => i.id) : initialOrder(activity)));
  const [checked, setChecked] = useState(completed);
  const [solved, setSolved] = useState(completed);

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
    setChecked(false);
  };

  const check = () => {
    setChecked(true);
    onAttempt?.();
    const ok = order.every((id, i) => id === activity.items[i].id);
    if (ok) {
      setSolved(true);
      onComplete();
    }
  };

  const correctCount = order.filter((id, i) => id === activity.items[i].id).length;

  return (
    <div>
      <ol className="space-y-2" aria-label="Items to order">
        {order.map((id, index) => {
          const item = byId.get(id)!;
          const isRight = id === activity.items[index].id;
          return (
            <motion.li
              key={id}
              layout={!reduce}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={cn(
                "flex items-center gap-3 rounded-lg border bg-surface-2 p-3",
                checked && (isRight ? "border-success/50" : "border-danger/50"),
                !checked && "border-border",
              )}
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-surface-3 font-mono text-xs text-muted">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="break-words font-mono text-[13px] text-foreground">{item.label}</p>
                {item.detail ? <p className="mt-0.5 text-xs text-muted">{item.detail}</p> : null}
                {checked && !solved ? <div className="mt-1"><Verdict correct={isRight} correctLabel="Right place" incorrectLabel="Wrong place" /></div> : null}
              </div>
              {!solved ? (
                <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
                  <Button variant="ghost" size="icon-sm" className="min-h-9 min-w-9" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Move "${item.label}" up`}>
                    <ArrowUp aria-hidden />
                  </Button>
                  <Button variant="ghost" size="icon-sm" className="min-h-9 min-w-9" onClick={() => move(index, 1)} disabled={index === order.length - 1} aria-label={`Move "${item.label}" down`}>
                    <ArrowDown aria-hidden />
                  </Button>
                </div>
              ) : null}
            </motion.li>
          );
        })}
      </ol>
      {!solved ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button onClick={check}>Check order</Button>
          <Button
            variant="ghost"
            onClick={() => {
              setOrder(initialOrder(activity));
              setChecked(false);
            }}
          >
            <RotateCcw aria-hidden />
            Shuffle again
          </Button>
        </div>
      ) : null}
      {checked && !solved ? (
        <FeedbackLine ok={false}>
          {correctCount} of {order.length} are in the right place. Move the marked items and check again.
        </FeedbackLine>
      ) : null}
      {solved ? <SuccessPanel title="Correct order">{activity.explanation}</SuccessPanel> : null}
    </div>
  );
}
