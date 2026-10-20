import type { TerminalGoal, TrackId } from "@/lib/curriculum/types";
import { normalizeCommand } from "./command-parser";
import { createDockerState, parseImageRef, runDockerCommand, type DockerState } from "./docker-simulator";
import { createKubernetesState, runKubernetesCommand, type K8sState } from "./kubernetes-simulator";
import type { CommandResult } from "./types";

export type SimState = { mode: "docker"; docker: DockerState } | { mode: "kubernetes"; k8s: K8sState };

export function createSimState(mode: TrackId, scenario?: string): SimState {
  return mode === "docker"
    ? { mode, docker: createDockerState(scenario) }
    : { mode, k8s: createKubernetesState(scenario) };
}

export function runSimCommand(input: string, state: SimState): CommandResult<SimState> {
  if (state.mode === "docker") {
    const r = runDockerCommand(input, state.docker);
    return { ...r, state: { mode: "docker", docker: r.state } };
  }
  const r = runKubernetesCommand(input, state.k8s);
  return { ...r, state: { mode: "kubernetes", k8s: r.state } };
}

/**
 * Checks whether a goal is satisfied after a command.
 * `command` is the command just run; `ok` says whether it succeeded.
 */
export function goalMet(goal: TerminalGoal, state: SimState, command: string, ok: boolean): boolean {
  switch (goal.kind) {
    case "command": {
      if (!ok) return false;
      try {
        return new RegExp(goal.pattern, "i").test(normalizeCommand(command));
      } catch {
        return false;
      }
    }
    case "docker-image-present": {
      if (state.mode !== "docker") return false;
      const want = parseImageRef(goal.image);
      return state.docker.images.some((i) => i.repository === want.repository && i.tag === want.tag);
    }
    case "docker-volume-exists":
      return state.mode === "docker" && state.docker.volumes.some((v) => v.name === goal.name);
    case "docker-container": {
      if (state.mode !== "docker") return false;
      const candidates = state.docker.containers.filter((c) => {
        if (goal.name && c.name !== goal.name) return false;
        if (goal.image) {
          const want = parseImageRef(goal.image);
          const have = parseImageRef(c.image);
          if (want.repository !== have.repository || (goal.image.includes(":") && want.tag !== have.tag)) return false;
        }
        if (goal.hostPort !== undefined && !c.ports.some((p) => p.host === goal.hostPort && (goal.containerPort === undefined || p.container === goal.containerPort))) return false;
        if (goal.hostPort === undefined && goal.containerPort !== undefined && !c.ports.some((p) => p.container === goal.containerPort)) return false;
        if (goal.volume && !c.mounts.some((m) => m.source === goal.volume)) return false;
        if (goal.env && !(goal.env.split("=")[0] in c.env && (!goal.env.includes("=") || c.env[goal.env.split("=")[0]] === goal.env.split("=").slice(1).join("=")))) return false;
        return true;
      });
      if (goal.state === "removed") return goal.name ? !state.docker.containers.some((c) => c.name === goal.name) : false;
      if (goal.state === "running") return candidates.some((c) => c.status === "running");
      return candidates.length > 0;
    }
    case "k8s-deployment": {
      if (state.mode !== "kubernetes") return false;
      const dep = state.k8s.deployments.find((d) => d.name === goal.name);
      if (!dep) return false;
      if (goal.replicas !== undefined && dep.replicas !== goal.replicas) return false;
      if (goal.image && dep.template.image !== goal.image) return false;
      return true;
    }
    case "k8s-service": {
      if (state.mode !== "kubernetes") return false;
      return state.k8s.services.some(
        (s) =>
          (!goal.name || s.name === goal.name) &&
          (!goal.selectsApp || s.selector.app === goal.selectsApp) &&
          (!goal.type || s.type === goal.type),
      );
    }
    case "k8s-pod-count": {
      if (state.mode !== "kubernetes") return false;
      const result = runKubernetesCommand(`kubectl get pods -l app=${goal.app}`, state.k8s);
      const running = result.lines.filter((l) => /\sRunning\s/.test(l.text)).length;
      return running === goal.running;
    }
  }
}
