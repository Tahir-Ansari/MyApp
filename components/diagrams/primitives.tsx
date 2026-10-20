import { ArrowDown, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type NodeTone = "default" | "accent" | "muted" | "warning" | "danger" | "success" | "ghost";

const TONES: Record<NodeTone, string> = {
  default: "border-border-strong bg-surface-2 text-foreground",
  accent: "border-accent-border bg-accent-soft text-foreground",
  muted: "border-border bg-background-2 text-muted",
  warning: "border-warning/40 bg-warning-soft text-foreground",
  danger: "border-danger/40 bg-danger-soft text-foreground",
  success: "border-success/40 bg-success-soft text-foreground",
  ghost: "border-dashed border-border-strong bg-transparent text-subtle",
};

export function Node({
  label,
  sub,
  tone = "default",
  icon,
  className,
  mono,
}: {
  label: React.ReactNode;
  sub?: React.ReactNode;
  tone?: NodeTone;
  icon?: React.ReactNode;
  className?: string;
  mono?: boolean;
}) {
  return (
    <div className={cn("min-w-0 rounded-lg border px-3 py-2 text-center", TONES[tone], className)}>
      <div className={cn("flex items-center justify-center gap-1.5 text-sm font-medium", mono && "font-mono text-xs")}>
        {icon}
        <span className="min-w-0 break-words">{label}</span>
      </div>
      {sub ? <div className="mt-0.5 text-[11px] leading-4 text-muted">{sub}</div> : null}
    </div>
  );
}

/** Arrow that points down on small screens and right on larger ones. */
export function FlowArrow({ label, className }: { label?: string; className?: string }) {
  return (
    <div className={cn("flex shrink-0 flex-col items-center justify-center gap-0.5 px-1 py-1 text-subtle sm:flex-row", className)} aria-hidden={!label}>
      <ArrowDown className="size-4 sm:hidden" aria-hidden />
      <ArrowRight className="hidden size-4 sm:block" aria-hidden />
      {label ? <span className="font-mono text-[11px] text-muted sm:order-first sm:mr-1">{label}</span> : null}
    </div>
  );
}

export function Flow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex flex-col items-stretch sm:flex-row sm:items-center", className)}>{children}</div>;
}

export function Group({
  title,
  children,
  className,
  tone = "default",
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  tone?: "default" | "accent";
}) {
  return (
    <div className={cn("min-w-0 rounded-lg border p-3", tone === "accent" ? "border-accent-border" : "border-border", className)}>
      <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.12em] text-subtle">{title}</p>
      {children}
    </div>
  );
}

export function DiagramControls({ children }: { children: React.ReactNode }) {
  return <div className="mt-4 flex flex-wrap items-center gap-2">{children}</div>;
}

export function StatusWord({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return <span className={cn("text-[11px] font-medium", ok ? "text-success" : "text-danger")}>{children}</span>;
}
