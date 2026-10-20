"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Award, Info, Sparkles, TrendingUp, X } from "lucide-react";
import { dismissToast, useToasts, type Toast } from "@/lib/progress/store";
import { cn } from "@/lib/utils";

const ICONS: Record<Toast["kind"], typeof Award> = {
  xp: Sparkles,
  achievement: Award,
  level: TrendingUp,
  notice: Info,
};

export function Toaster() {
  const toasts = useToasts();
  const reduce = useReducedMotion();
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 z-50 flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2 lg:bottom-4"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const Icon = ICONS[toast.kind];
          return (
            <motion.div
              key={toast.id}
              layout={!reduce}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={cn(
                "pointer-events-auto flex items-start gap-3 rounded-lg border bg-surface-2 p-3 shadow-card",
                toast.kind === "notice" ? "border-border" : "border-accent-border",
              )}
            >
              <Icon
                className={cn("mt-0.5 size-4 shrink-0", toast.kind === "notice" ? "text-muted" : "text-accent-strong", toast.kind === "level" && "animate-accent-pulse rounded")}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm font-medium", toast.kind === "xp" ? "font-mono text-accent-strong" : "text-foreground")}>{toast.title}</p>
                {toast.detail ? <p className="mt-0.5 text-xs leading-5 text-muted">{toast.detail}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="-m-1 rounded-md p-1 text-subtle hover:text-foreground"
                aria-label="Dismiss notification"
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
