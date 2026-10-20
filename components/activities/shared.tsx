import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ActivityProps<A> {
  activity: A;
  /** True if the learner has already completed this activity before. */
  completed: boolean;
  onComplete: () => void;
  /** Called on every checked attempt (used to mark challenges in progress). */
  onAttempt?: () => void;
}

export function Verdict({ correct, correctLabel = "Correct", incorrectLabel = "Incorrect" }: { correct: boolean; correctLabel?: string; incorrectLabel?: string }) {
  return correct ? (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
      <CheckCircle2 className="size-3.5" aria-hidden />
      {correctLabel}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-danger">
      <XCircle className="size-3.5" aria-hidden />
      {incorrectLabel}
    </span>
  );
}

export function SuccessPanel({ title = "Activity complete", children }: { title?: string; children: React.ReactNode }) {
  return (
    <div role="status" className="mt-4 rounded-lg border border-success/40 bg-success-soft p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <CheckCircle2 className="size-4 text-success" aria-hidden />
        {title}
      </p>
      <div className="mt-1.5 text-sm leading-6 text-muted">{children}</div>
    </div>
  );
}

export function FeedbackLine({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <p role="status" className={cn("mt-3 flex items-start gap-2 text-sm", ok ? "text-success" : "text-danger")}>
      {ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden /> : <XCircle className="mt-0.5 size-4 shrink-0" aria-hidden />}
      <span className="text-foreground">{children}</span>
    </p>
  );
}
