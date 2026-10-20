"use client";

import Link from "next/link";
import { ProgressBar } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/card";
import { levelInfo, totalXp } from "@/lib/progress/calculations";
import { useProgress } from "@/lib/progress/store";

export function SidebarLevel() {
  const progress = useProgress();
  if (!progress) return <Skeleton className="h-[58px]" />;
  const info = levelInfo(totalXp(progress));
  return (
    <Link
      href="/achievements"
      className="block rounded-lg border border-border bg-surface p-3 transition-colors hover:border-accent-border"
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-foreground">
          Level {info.current.level} · {info.current.title}
        </span>
      </div>
      <ProgressBar className="mt-2" size="sm" tone="gradient" value={info.ratio * 100} label="Progress to next level" />
      <p className="mt-1.5 font-mono text-[11px] text-muted">
        {info.next ? `${info.xp} / ${info.next.minXp} XP` : `${info.xp} XP · max level`}
      </p>
    </Link>
  );
}
