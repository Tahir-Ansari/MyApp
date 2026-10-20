import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  label: string;
  className?: string;
  /** accent: emerald fill (default). success: bright green. gradient: deep-to-bright green, for XP. */
  tone?: "accent" | "success" | "gradient";
  size?: "sm" | "md";
}

export function ProgressBar({
  value,
  max = 100,
  label,
  className,
  tone = "accent",
  size = "md",
}: ProgressBarProps) {
  const pct = max <= 0 ? 0 : Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.round(value)}
      className={cn(
        "w-full overflow-hidden rounded-full bg-surface-3",
        size === "sm" ? "h-1" : "h-1.5",
        className,
      )}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-700 ease-out",
          tone === "accent" && "bg-accent",
          tone === "success" && "bg-success",
          tone === "gradient" && "bg-gradient-to-r from-accent-deep via-accent to-accent-strong",
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
