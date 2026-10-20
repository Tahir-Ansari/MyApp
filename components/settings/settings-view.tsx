"use client";

import { useState } from "react";
import { CheckCircle2, HardDrive, MonitorSmartphone, ShieldCheck, Terminal, Trash2, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, SectionHeading, Skeleton } from "@/components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { OfflineSettingsPanel } from "@/components/pwa/offline-settings-panel";
import { ACHIEVEMENTS } from "@/lib/achievements/definitions";
import { overallStats, totalXp } from "@/lib/progress/calculations";
import { resetProgress, updateSettings, useProgress, useStorageStatus } from "@/lib/progress/store";
import type { Settings } from "@/lib/progress/types";
import { cn } from "@/lib/utils";

const MOTION_OPTIONS: { value: Settings["motion"]; label: string; hint: string }[] = [
  { value: "system", label: "Match my device", hint: "Follows your operating system's reduced-motion setting." },
  { value: "reduce", label: "Reduce motion", hint: "Turns off animations and transitions in the app." },
  { value: "full", label: "Full motion", hint: "Shows the app's short, subtle animations." },
];

const FACTS = [
  { icon: UserX, title: "No account needed", body: "Start learning straight away. There's no sign-up, login, or profile." },
  { icon: HardDrive, title: "Saved in this browser", body: "XP, completed lessons, quiz scores, badges and settings are stored only in this browser's local storage." },
  { icon: MonitorSmartphone, title: "No sync between devices", body: "Progress on your phone and your laptop is separate, and so is the installed app versus another browser." },
  { icon: Trash2, title: "Clearing browser data removes it", body: "Clearing site data or cookies for this site, or using a private window, erases your progress." },
  { icon: Terminal, title: "Simulated commands only", body: "The terminal and challenges are simulations. Nothing runs real Docker or Kubernetes commands." },
  { icon: ShieldCheck, title: "Nothing personal is stored", body: "The app stores learning progress only, and sends none of it anywhere." },
];

function MotionSetting({ value }: { value: Settings["motion"] }) {
  return (
    <fieldset>
      <legend className="sr-only">Animation</legend>
      <div className="grid gap-2 sm:grid-cols-3">
        {MOTION_OPTIONS.map((o) => {
          const checked = value === o.value;
          return (
            <label
              key={o.value}
              className={cn(
                "flex min-h-11 cursor-pointer flex-col gap-1 rounded-lg border p-3 text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
                checked ? "border-accent-border bg-accent-soft" : "border-border bg-surface-2 hover:border-border-strong",
              )}
            >
              <span className="flex items-center gap-2 font-medium">
                <input
                  type="radio"
                  name="motion"
                  value={o.value}
                  checked={checked}
                  onChange={() => updateSettings({ motion: o.value })}
                  className="size-4 accent-[var(--accent)]"
                />
                {o.label}
              </span>
              <span className="text-xs text-muted">{o.hint}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function ResetProgress({ summary }: { summary: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="danger" className="min-h-11">
          <Trash2 aria-hidden />
          Reset all progress
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Reset all progress?</DialogTitle>
        <DialogDescription>
          This permanently deletes {summary} from this browser. It can&apos;t be undone, and there is no copy on
          another device. Your animation setting is kept.
        </DialogDescription>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <DialogClose asChild>
            <Button variant="secondary" className="min-h-11">
              Keep my progress
            </Button>
          </DialogClose>
          <Button
            variant="danger"
            className="min-h-11"
            onClick={() => {
              resetProgress();
              setOpen(false);
            }}
          >
            Yes, reset everything
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SettingsView() {
  const state = useProgress();
  const storage = useStorageStatus();

  const lessons = state ? overallStats(state).completed : 0;
  const xp = state ? totalXp(state) : 0;
  const badges = state ? ACHIEVEMENTS.filter((a) => state.achievements[a.id]).length : 0;
  const hasProgress = Boolean(state && (xp > 0 || lessons > 0 || Object.keys(state.challenges).length > 0));
  const summary = `${xp} XP, ${lessons} completed ${lessons === 1 ? "lesson" : "lessons"}, ${badges} ${badges === 1 ? "badge" : "badges"}, quiz scores and challenge progress`;

  return (
    <div className="space-y-8 sm:space-y-10">
      <section aria-labelledby="data-heading">
        <SectionHeading id="data-heading" title="Your data" description="How DevOps Quest keeps your progress." />
        <Card>
          <ul className="grid divide-y divide-border sm:grid-cols-2 sm:divide-y-0 sm:gap-px sm:bg-border">
            {FACTS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-3 bg-surface p-4 sm:p-5">
                <Icon aria-hidden className="mt-0.5 size-5 shrink-0 text-accent-strong" />
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="mt-0.5 text-sm text-muted">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section aria-labelledby="prefs-heading">
        <SectionHeading id="prefs-heading" title="Animation" description="Motion in the app is short and subtle. Turn it off if you prefer." />
        {state ? <MotionSetting value={state.settings.motion} /> : <Skeleton className="h-20 w-full" />}
      </section>

      <OfflineSettingsPanel />

      <section aria-labelledby="reset-heading">
        <SectionHeading id="reset-heading" title="Reset progress" description="Start the course again from zero on this device." />
        <Card className="p-4 sm:p-5">
          {state === null ? (
            <Skeleton className="h-11 w-48" />
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="min-w-0 text-sm text-muted">
                {hasProgress ? (
                  <>
                    Saved here now: <span className="text-foreground">{summary}</span>.
                  </>
                ) : (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 aria-hidden className="size-4 text-success" />
                    Nothing to reset yet. You&apos;re starting fresh.
                  </span>
                )}
              </p>
              {hasProgress && <ResetProgress summary={summary} />}
            </div>
          )}
          {storage === "unavailable" && (
            <p className="mt-3 text-xs text-warning">
              This browser isn&apos;t letting the app save. Progress lasts only until you close the tab.
            </p>
          )}
        </Card>
      </section>
    </div>
  );
}
