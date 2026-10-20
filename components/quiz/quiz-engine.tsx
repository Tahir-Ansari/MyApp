"use client";

import { useState } from "react";
import { CheckCircle2, RotateCcw, Trophy, XCircle } from "lucide-react";
import { CodeBlock } from "@/components/learning/code-block";
import { RichText } from "@/components/learning/rich-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useActivityInProgress } from "@/lib/activity-state";
import type { QuizQuestion } from "@/lib/curriculum/types";
import { quizPassMark } from "@/lib/progress/calculations";
import type { QuizRecord } from "@/lib/progress/types";
import { cn } from "@/lib/utils";

function isCorrect(q: QuizQuestion, chosen: string[] = []) {
  return chosen.length === q.correct.length && q.correct.every((c) => chosen.includes(c));
}

interface QuizEngineProps {
  quizId: string;
  questions: QuizQuestion[];
  record?: QuizRecord;
  onSubmit: (score: number, total: number) => void;
}

export function QuizEngine({ quizId, questions, record, onSubmit }: QuizEngineProps) {
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [submitted, setSubmitted] = useState(false);
  const total = questions.length;
  const passMark = quizPassMark(total);
  const answeredAll = questions.every((q) => (answers[q.id]?.length ?? 0) > 0);
  const score = questions.filter((q) => isCorrect(q, answers[q.id])).length;
  const passed = score >= passMark;
  useActivityInProgress(Object.keys(answers).length > 0 && !submitted);

  const toggle = (q: QuizQuestion, optionId: string) => {
    if (submitted) return;
    setAnswers((prev) => {
      const current = prev[q.id] ?? [];
      if (q.kind === "single") return { ...prev, [q.id]: [optionId] };
      return { ...prev, [q.id]: current.includes(optionId) ? current.filter((x) => x !== optionId) : [...current, optionId] };
    });
  };

  const submit = () => {
    setSubmitted(true);
    onSubmit(score, total);
  };

  const retry = () => {
    setAnswers({});
    setSubmitted(false);
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted">
        <span>
          {total} questions · pass with {passMark}/{total}
        </span>
        {record ? (
          <Badge tone={record.passed ? "success" : "neutral"}>
            {record.passed ? <CheckCircle2 aria-hidden /> : null}
            Best: {record.bestScore}/{record.total}
            {record.perfect ? " · Perfect" : ""}
          </Badge>
        ) : null}
      </div>
      <ol className="space-y-6">
        {questions.map((q, qi) => {
          const chosen = answers[q.id] ?? [];
          const correct = isCorrect(q, chosen);
          const name = `${quizId}-${q.id}`;
          return (
            <li key={q.id}>
              <fieldset>
                <legend className="text-sm font-medium leading-6 text-foreground sm:text-base">
                  <span className="mr-2 font-mono text-xs text-subtle">Q{qi + 1}</span>
                  <span className="prose-code">
                    <RichText text={q.prompt} />
                  </span>
                </legend>
                {q.kind === "multiple" ? <p className="mt-1 text-xs text-subtle">Select all that apply.</p> : null}
                {q.code ? <CodeBlock className="mt-3" code={q.code} language="yaml" /> : null}
                <div className="mt-3 space-y-2">
                  {q.options.map((opt) => {
                    const isChosen = chosen.includes(opt.id);
                    const isAnswer = q.correct.includes(opt.id);
                    const state = !submitted
                      ? isChosen
                        ? "selected"
                        : "default"
                      : isChosen && isAnswer
                        ? "correct"
                        : isChosen && !isAnswer
                          ? "incorrect"
                          : isAnswer
                            ? "missed"
                            : "default";
                    return (
                      <label
                        key={opt.id}
                        className={cn(
                          "flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors sm:p-4",
                          state === "default" && "border-border bg-surface-2 hover:border-border-strong",
                          state === "selected" && "border-accent-border bg-accent-soft",
                          state === "correct" && "border-success/50 bg-success-soft",
                          state === "incorrect" && "border-danger/50 bg-danger-soft",
                          state === "missed" && "border-dashed border-success/50 bg-surface-2",
                          submitted && "cursor-default",
                        )}
                      >
                        <input
                          type={q.kind === "single" ? "radio" : "checkbox"}
                          name={name}
                          value={opt.id}
                          checked={isChosen}
                          disabled={submitted}
                          onChange={() => toggle(q, opt.id)}
                          className="mt-0.5 size-4 shrink-0 accent-[var(--accent)]"
                        />
                        <span className="prose-code min-w-0 flex-1 text-foreground">
                          <RichText text={opt.text} />
                        </span>
                        {state === "correct" ? (
                          <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-success">
                            <CheckCircle2 className="size-4" aria-hidden /> Correct
                          </span>
                        ) : state === "incorrect" ? (
                          <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-danger">
                            <XCircle className="size-4" aria-hidden /> Incorrect
                          </span>
                        ) : state === "missed" ? (
                          <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-success">
                            <CheckCircle2 className="size-4" aria-hidden /> Correct answer
                          </span>
                        ) : null}
                      </label>
                    );
                  })}
                </div>
                {submitted ? (
                  <div className="mt-3 rounded-lg border-l-2 border-l-accent bg-surface-2 p-3 text-sm text-muted">
                    <p className={cn("mb-1 flex items-center gap-1.5 text-xs font-semibold", correct ? "text-success" : "text-danger")}>
                      {correct ? <CheckCircle2 className="size-3.5" aria-hidden /> : <XCircle className="size-3.5" aria-hidden />}
                      {correct ? "You got this one" : "Not quite"} · Why
                    </p>
                    <p className="prose-code leading-6">
                      <RichText text={q.explanation} />
                    </p>
                  </div>
                ) : null}
              </fieldset>
            </li>
          );
        })}
      </ol>
      <div className="mt-6" role="status">
        {!submitted ? (
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={submit} disabled={!answeredAll}>
              Check answers
            </Button>
            {!answeredAll ? <span className="text-xs text-subtle">Answer every question to check.</span> : null}
          </div>
        ) : (
          <div
            className={cn(
              "flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between",
              passed ? "border-success/40 bg-success-soft" : "border-danger/40 bg-danger-soft",
            )}
          >
            <p className="flex items-center gap-2 text-sm font-medium text-foreground">
              {score === total ? (
                <Trophy className="size-4 text-accent-strong" aria-hidden />
              ) : passed ? (
                <CheckCircle2 className="size-4 text-success" aria-hidden />
              ) : (
                <XCircle className="size-4 text-danger" aria-hidden />
              )}
              {score === total ? "Perfect score" : passed ? "Passed" : "Not passed yet"}: {score}/{total} correct.
              {!passed ? ` You need ${passMark}. Read the explanations and try again.` : ""}
            </p>
            <Button variant="secondary" size="sm" onClick={retry}>
              <RotateCcw aria-hidden /> {passed ? "Retake quiz" : "Try again"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
