"use client";

import { useState } from "react";
import { Box, HardDrive, Layers, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DiagramControls, Flow, FlowArrow, Group, Node } from "./primitives";

const icon = (Icon: typeof Box) => <Icon className="size-3.5 shrink-0 text-subtle" aria-hidden />;

/* Image → container lifecycle stepper */
const LIFECYCLE = [
  { state: "Image only", command: "docker pull nginx", note: "A read-only template is stored locally. Nothing is running." },
  { state: "Created", command: "docker create --name web nginx", note: "A container exists with its writable layer, but its process hasn't started." },
  { state: "Running", command: "docker start web", note: "The main process runs in isolation. docker ps lists it." },
  { state: "Exited", command: "docker stop web", note: "The process ended. The container and its writable layer still exist; docker start can run it again." },
  { state: "Removed", command: "docker rm web", note: "The container and its writable layer are deleted. The image is still there." },
];

export function ImageContainerLifecycle() {
  const [step, setStep] = useState(0);
  const current = LIFECYCLE[step];
  const containerExists = step >= 1 && step <= 3;
  return (
    <div>
      <Flow>
        <Node label="Image: nginx" sub="read-only, reusable" tone="accent" icon={icon(Layers)} className="sm:w-44" />
        <FlowArrow label={step >= 1 ? "creates" : undefined} />
        <Node
          label={containerExists ? "Container: web" : step === 4 ? "Container removed" : "No container yet"}
          sub={containerExists ? `State: ${current.state}` : step === 4 ? "writable layer deleted" : "run docker create or run"}
          tone={step === 2 ? "success" : step === 3 ? "warning" : containerExists ? "default" : "ghost"}
          icon={icon(Box)}
          className="sm:flex-1"
        />
      </Flow>
      <ol className="mt-4 grid grid-cols-5 gap-1" aria-label="Lifecycle steps">
        {LIFECYCLE.map((l, i) => (
          <li key={l.state}>
            <button
              type="button"
              onClick={() => setStep(i)}
              aria-current={i === step ? "step" : undefined}
              className={cn(
                "w-full rounded-md border px-1 py-1.5 text-[11px] font-medium transition-colors",
                i === step ? "border-accent-border bg-accent-soft text-foreground" : "border-border text-muted hover:text-foreground",
              )}
            >
              {l.state}
            </button>
          </li>
        ))}
      </ol>
      <div className="mt-3 rounded-lg bg-surface-2 p-3" aria-live="polite">
        <p className="font-mono text-xs text-accent-strong">$ {current.command}</p>
        <p className="mt-1 text-sm text-muted">{current.note}</p>
      </div>
      <DiagramControls>
        <Button size="sm" variant="secondary" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          Back
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setStep((s) => Math.min(LIFECYCLE.length - 1, s + 1))} disabled={step === LIFECYCLE.length - 1}>
          Next step
        </Button>
      </DiagramControls>
    </div>
  );
}

/* Volume persistence */
export function VolumePersistence() {
  const [phase, setPhase] = useState<"running" | "removed" | "new">("running");
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <Group title={phase === "new" ? "Container: db-2 (new)" : "Container: db"}>
          {phase === "removed" ? (
            <Node label="Removed" sub="writable layer deleted: /tmp/cache.txt is gone" tone="ghost" />
          ) : (
            <div className="space-y-1.5">
              <Node label="Writable layer" sub={phase === "new" ? "empty (fresh container)" : "/tmp/cache.txt"} tone="default" mono />
              <Node label="/var/lib/postgresql/data" sub="mount point → volume" tone="accent" mono />
            </div>
          )}
        </Group>
        <FlowArrow label="mounts" />
        <Node label="Volume: pgdata" sub="orders.db · users.db (still here)" tone="success" icon={icon(HardDrive)} />
      </div>
      <p className="mt-3 text-sm text-muted" aria-live="polite">
        {phase === "running" && "The database writes its files into the volume. Scratch files go to the writable layer."}
        {phase === "removed" && "docker rm deleted the container and its writable layer. The volume and its data are untouched."}
        {phase === "new" && "A new container mounts the same volume and finds all the data again."}
      </p>
      <DiagramControls>
        <Button size="sm" variant="secondary" onClick={() => setPhase("removed")} disabled={phase === "removed"}>
          <Trash2 aria-hidden /> docker rm -f db
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setPhase("new")} disabled={phase !== "removed"}>
          <Plus aria-hidden /> run db-2 with -v pgdata:…
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setPhase("running")}>
          <RotateCcw aria-hidden /> Reset
        </Button>
      </DiagramControls>
    </div>
  );
}

/* Desired vs actual replicas with self-healing */
export function DesiredVsActual() {
  const [desired, setDesired] = useState(3);
  const [pods, setPods] = useState<{ id: number; fresh: boolean }[]>([
    { id: 1, fresh: false },
    { id: 2, fresh: false },
    { id: 3, fresh: false },
  ]);
  const [nextId, setNextId] = useState(4);
  const [message, setMessage] = useState("Desired 3, actual 3. Nothing to do.");

  const reconcile = (list: { id: number; fresh: boolean }[], want: number, idStart: number) => {
    let id = idStart;
    let result = list.map((p) => ({ ...p, fresh: false }));
    if (result.length < want) {
      const add = want - result.length;
      result = [...result, ...Array.from({ length: add }, () => ({ id: id++, fresh: true }))];
      setMessage(`Actual (${list.length}) < desired (${want}): the controller created ${add} Pod(s).`);
    } else if (result.length > want) {
      setMessage(`Actual (${list.length}) > desired (${want}): the controller removed ${result.length - want} Pod(s).`);
      result = result.slice(0, want);
    } else {
      setMessage(`Desired ${want}, actual ${want}. Nothing to do.`);
    }
    setPods(result);
    setNextId(id);
  };

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-[12rem_1fr]">
        <Group title="Desired (spec)">
          <p className="font-mono text-2xl font-semibold tabular-nums text-foreground">replicas: {desired}</p>
          <div className="mt-2 flex gap-1">
            <Button size="sm" variant="secondary" aria-label="Decrease desired replicas" onClick={() => { const d = Math.max(0, desired - 1); setDesired(d); reconcile(pods, d, nextId); }}>−</Button>
            <Button size="sm" variant="secondary" aria-label="Increase desired replicas" onClick={() => { const d = Math.min(6, desired + 1); setDesired(d); reconcile(pods, d, nextId); }}>+</Button>
          </div>
        </Group>
        <Group title={`Actual: ${pods.length} Pod(s)`}>
          <div className="flex min-h-12 flex-wrap gap-2">
            {pods.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  const remaining = pods.filter((x) => x.id !== p.id);
                  setMessage(`Pod web-${p.id} was deleted. Actual 2 < desired: reconciling…`);
                  window.setTimeout(() => reconcile(remaining, desired, nextId), 600);
                  setPods(remaining);
                }}
                className={cn(
                  "rounded-lg border px-2.5 py-1.5 font-mono text-xs transition-colors hover:border-danger/50",
                  p.fresh ? "border-accent-border bg-accent-soft text-foreground" : "border-border-strong bg-surface-2 text-foreground",
                )}
                aria-label={`Delete Pod web-${p.id}`}
              >
                web-{p.id}
                {p.fresh ? <span className="ml-1 text-[10px] text-accent-strong">new</span> : null}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-subtle">Click a Pod to delete it.</p>
        </Group>
      </div>
      <p className="mt-3 rounded-lg bg-surface-2 p-3 text-sm text-muted" aria-live="polite">{message}</p>
    </div>
  );
}

/* Service selecting Pods by label */
const SELECTOR_PODS = [
  { name: "web-a1", app: "web" },
  { name: "web-b2", app: "web" },
  { name: "api-c3", app: "api" },
  { name: "web-d4", app: "web" },
];

export function ServiceSelector() {
  const [selector, setSelector] = useState<"web" | "api" | "frontend">("web");
  const matched = SELECTOR_PODS.filter((p) => p.app === selector);
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-[14rem_auto_1fr] sm:items-center">
        <Group title="Service: web (ClusterIP 10.96.12.7)" tone="accent">
          <p className="font-mono text-xs text-muted">selector:</p>
          <p className="font-mono text-sm text-foreground">app: {selector}</p>
        </Group>
        <FlowArrow label="routes to" />
        <div className="grid grid-cols-2 gap-2">
          {SELECTOR_PODS.map((p) => {
            const hit = p.app === selector;
            return (
              <Node key={p.name} label={p.name} sub={`app=${p.app} · ${hit ? "selected" : "ignored"}`} tone={hit ? "success" : "muted"} mono />
            );
          })}
        </div>
      </div>
      <p className="mt-3 text-sm text-muted" aria-live="polite">
        {matched.length ? `${matched.length} endpoint(s): Pods whose labels match app=${selector}.` : "No Pod has app=frontend, so the Service has no endpoints and requests fail."}
      </p>
      <DiagramControls>
        {(["web", "api", "frontend"] as const).map((s) => (
          <Button key={s} size="sm" variant={selector === s ? "success" : "secondary"} aria-pressed={selector === s} onClick={() => setSelector(s)}>
            app: {s}
          </Button>
        ))}
      </DiagramControls>
    </div>
  );
}

/* Rolling update progression */
const ROLLING_STEPS = [
  { old: 3, new: 0, note: "Start: 3 Pods run v1." },
  { old: 3, new: 1, note: "Surge: one v2 Pod is created. Old Pods keep serving." },
  { old: 2, new: 1, note: "The v2 Pod is ready, so one v1 Pod is removed." },
  { old: 2, new: 2, note: "Another v2 Pod starts…" },
  { old: 1, new: 2, note: "…becomes ready, and another v1 Pod goes." },
  { old: 1, new: 3, note: "The last v2 Pod starts." },
  { old: 0, new: 3, note: "Done: 3 Pods run v2. Capacity never dropped below 3 ready Pods." },
];

export function RollingUpdate() {
  const [step, setStep] = useState(0);
  const s = ROLLING_STEPS[step];
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Group title="ReplicaSet v1 (nginx:1.27)">
          <div className="flex min-h-10 flex-wrap gap-2">
            {Array.from({ length: s.old }, (_, i) => (
              <Node key={i} label={`v1-${i + 1}`} tone="default" mono />
            ))}
            {s.old === 0 ? <span className="text-xs text-subtle">scaled to 0 (kept for rollback)</span> : null}
          </div>
        </Group>
        <Group title="ReplicaSet v2 (nginx:1.28)" tone="accent">
          <div className="flex min-h-10 flex-wrap gap-2">
            {Array.from({ length: s.new }, (_, i) => (
              <Node key={i} label={`v2-${i + 1}`} tone="success" mono />
            ))}
          </div>
        </Group>
      </div>
      <p className="mt-3 rounded-lg bg-surface-2 p-3 text-sm text-muted" aria-live="polite">
        <span className="font-mono text-xs text-subtle">Step {step + 1}/{ROLLING_STEPS.length} · </span>
        {s.note}
      </p>
      <DiagramControls>
        <Button size="sm" variant="secondary" onClick={() => setStep((x) => Math.max(0, x - 1))} disabled={step === 0}>
          Back
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setStep((x) => Math.min(ROLLING_STEPS.length - 1, x + 1))} disabled={step === ROLLING_STEPS.length - 1}>
          Next step
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setStep(0)}>
          <RotateCcw aria-hidden /> Restart
        </Button>
      </DiagramControls>
    </div>
  );
}
