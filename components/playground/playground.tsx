"use client";

import { useCallback, useState } from "react";
import { Info, Lightbulb, ShieldCheck } from "lucide-react";
import { renderTicks } from "@/components/activities/terminal-activity";
import { Card } from "@/components/ui/card";
import type { TrackId } from "@/lib/curriculum/types";
import { DOCKER_SCENARIOS } from "@/lib/simulator/docker-simulator";
import { KUBERNETES_SCENARIOS } from "@/lib/simulator/kubernetes-simulator";
import { recordPlaygroundCommand } from "@/lib/progress/store";
import { cn } from "@/lib/utils";
import { TerminalView } from "./terminal-view";
import { useTerminal } from "./use-terminal";

const SUGGESTIONS: Record<TrackId, string[]> = {
  docker: [
    "docker images",
    "docker pull nginx",
    "docker run -d --name web -p 8080:80 nginx",
    "docker ps",
    "curl localhost:8080",
    "docker logs web",
    "docker exec web ls /usr/share/nginx/html",
    "docker stop web",
    "docker ps -a",
    "docker start web",
    "docker rm -f web",
    "docker build -t demo-app .",
    "docker volume ls",
    "docker compose up -d",
  ],
  kubernetes: [
    "kubectl get nodes",
    "kubectl get pods",
    "kubectl apply -f deployment.yaml",
    "kubectl get deployments",
    "kubectl get pods -o wide",
    "kubectl scale deployment web --replicas=3",
    "kubectl get services",
    "kubectl apply -f service.yaml",
    "kubectl get endpoints web",
    "kubectl describe pod web-",
    "kubectl logs deployment/web",
    "kubectl set image deployment/web web=nginx:1.28",
    "kubectl rollout undo deployment/web",
    "cat deployment.yaml",
  ],
};

export function Playground() {
  const [mode, setMode] = useState<TrackId>("docker");
  const [scenario, setScenario] = useState<string>("docker-empty");
  const [draft, setDraft] = useState<{ key: number; value: string } | undefined>(undefined);
  const onCommand = useCallback(() => recordPlaygroundCommand(), []);
  const terminal = useTerminal({ mode, scenario, onCommand });
  const latest = [...terminal.entries].reverse().find((e) => e.explanation);
  const scenarios = mode === "docker" ? DOCKER_SCENARIOS : KUBERNETES_SCENARIOS;

  const switchMode = (next: TrackId) => {
    if (next === mode) return;
    const nextScenario = next === "docker" ? "docker-empty" : "k8s-running-app";
    setMode(next);
    setScenario(nextScenario);
    terminal.reset(nextScenario, next);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-lg border border-border bg-surface-2 p-3 text-sm">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent-strong" aria-hidden />
        <p className="leading-6 text-muted">
          <span className="font-medium text-foreground">Everything here is simulated.</span> Commands are interpreted by a small, deterministic simulator in your browser. Nothing runs on your computer, and no real Docker engine or cluster is involved.
        </p>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div role="radiogroup" aria-label="Simulator mode" className="inline-flex rounded-lg border border-border bg-background-2 p-1">
          {(["docker", "kubernetes"] as TrackId[]).map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={mode === m}
              onClick={() => switchMode(m)}
              className={cn(
                "min-h-9 rounded-md px-4 text-sm font-medium transition-colors",
                mode === m ? "bg-accent-soft text-foreground" : "text-muted hover:text-foreground",
              )}
            >
              {m === "docker" ? "Docker" : "Kubernetes"}
            </button>
          ))}
        </div>
        <div className="min-w-0 md:w-80">
          <label htmlFor="scenario" className="mb-1 block text-sm font-medium text-foreground">
            Starter scenario
          </label>
          <select
            id="scenario"
            value={scenario}
            onChange={(e) => {
              setScenario(e.target.value);
              terminal.reset(e.target.value, mode);
            }}
            className="h-10 w-full rounded-lg border border-border-strong bg-surface-2 px-3 text-sm text-foreground focus-visible:border-accent-border"
          >
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}: {s.description}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <TerminalView
          key={mode}
          title={`${mode === "docker" ? "docker" : "kubectl"} · simulated`}
          entries={terminal.entries}
          history={terminal.history}
          onRun={terminal.run}
          onClear={terminal.clear}
          onReset={() => terminal.reset(scenario, mode)}
          draft={draft}
          welcome={`Simulated ${mode === "docker" ? "Docker" : "Kubernetes"} terminal. Scenario: ${scenarios.find((s) => s.id === scenario)?.label}.\nType \`help\` for supported commands, or click a suggestion. Use ↑/↓ for history.`}
        />
        <Card className="p-4 sm:p-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Info className="size-4 text-accent-strong" aria-hidden />
            What did this command do?
          </p>
          <p className="prose-code mt-2 text-sm leading-6 text-muted" aria-live="polite">
            {latest?.explanation ? renderTicks(latest.explanation) : "Run a command and a plain-language explanation appears here."}
          </p>
          {latest ? <p className="mt-3 font-mono text-xs text-subtle">$ {latest.command}</p> : null}
        </Card>
      </div>

      <section aria-labelledby="suggestions-heading">
        <h2 id="suggestions-heading" className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Lightbulb className="size-4 text-warning" aria-hidden />
          Suggested commands
        </h2>
        <ul className="flex flex-wrap gap-2">
          {SUGGESTIONS[mode].map((cmd) => (
            <li key={cmd}>
              <button
                type="button"
                onClick={() => setDraft({ key: Date.now(), value: cmd })}
                className="h-8 rounded-md border border-border bg-surface-2 px-2 font-mono text-xs text-muted transition-colors hover:border-accent-border hover:text-foreground"
              >
                {cmd}
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-subtle">Clicking a suggestion puts it in the prompt. Edit it if you like, then press Enter.</p>
      </section>
    </div>
  );
}
