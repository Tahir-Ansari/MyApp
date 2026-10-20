import { Box, Check, Cpu, Database, FileCode2, FileText, HardDrive, Layers, Network, Server, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Flow, FlowArrow, Group, Node } from "./primitives";

const icon = (Icon: typeof Box) => <Icon className="size-3.5 shrink-0 text-subtle" aria-hidden />;

export function WorksOnMyMachine() {
  const machines = [
    { name: "Your laptop", items: ["Node 20", "libvips 8.15", "DATABASE_URL set"], ok: true },
    { name: "Teammate", items: ["Node 18", "libvips missing", "DATABASE_URL set"], ok: false },
    { name: "Server", items: ["Node 16", "libvips 8.10", "DATABASE_URL missing"], ok: false },
  ];
  return (
    <div className="space-y-4">
      <div className="mx-auto max-w-xs">
        <Node label="Same app code" sub="app.js, unchanged" tone="accent" icon={icon(FileCode2)} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {machines.map((m) => (
          <Group key={m.name} title={m.name}>
            <ul className="space-y-1 text-xs text-muted">
              {m.items.map((i) => (
                <li key={i} className="font-mono">{i}</li>
              ))}
            </ul>
            <p className={cn("mt-2 flex items-center gap-1 text-xs font-medium", m.ok ? "text-success" : "text-danger")}>
              {m.ok ? <Check className="size-3.5" aria-hidden /> : <X className="size-3.5" aria-hidden />}
              {m.ok ? "Works" : "Fails"}
            </p>
          </Group>
        ))}
      </div>
      <p className="text-center text-xs text-muted">With a container image, all three run the same packaged environment.</p>
    </div>
  );
}

export function ContainerIsolation() {
  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-3">
        {[
          ["web", "nginx", "own files, PIDs, network"],
          ["api", "node server.js", "own files, PIDs, network"],
          ["cache", "redis-server", "own files, PIDs, network"],
        ].map(([name, proc, sub]) => (
          <Node key={name} label={`container: ${name}`} sub={<><span className="font-mono">{proc}</span> · {sub}</>} tone="accent" icon={icon(Box)} />
        ))}
      </div>
      <Node label="Container runtime (Docker / containerd)" sub="sets up namespaces + cgroups" tone="default" />
      <Node label="Host Linux kernel (shared by every container)" tone="muted" icon={icon(Cpu)} />
      <Node label="Hardware" tone="muted" />
    </div>
  );
}

export function ContainerVsVm() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Group title="Virtual machines">
        <div className="grid grid-cols-2 gap-2">
          {["App A", "App B"].map((a) => (
            <div key={a} className="space-y-1.5">
              <Node label={a} tone="accent" />
              <Node label="Libraries" tone="default" />
              <Node label="Guest OS + kernel" tone="warning" sub="per VM" />
            </div>
          ))}
        </div>
        <div className="mt-1.5 space-y-1.5">
          <Node label="Hypervisor" tone="default" />
          <Node label="Host hardware" tone="muted" />
        </div>
      </Group>
      <Group title="Containers">
        <div className="grid grid-cols-2 gap-2">
          {["App A", "App B"].map((a) => (
            <div key={a} className="space-y-1.5">
              <Node label={a} tone="accent" />
              <Node label="Libraries" tone="default" />
            </div>
          ))}
        </div>
        <div className="mt-1.5 space-y-1.5">
          <Node label="Container runtime" tone="default" />
          <Node label="Host OS + one shared kernel" tone="success" />
          <Node label="Host hardware" tone="muted" />
        </div>
      </Group>
    </div>
  );
}

export function RegistryFlow() {
  return (
    <Flow>
      <Node label="Registry" sub="Docker Hub, GHCR, ECR…" icon={icon(Database)} />
      <FlowArrow label="docker pull" />
      <Node label="Local image" sub="nginx:latest (read-only)" tone="accent" icon={icon(Layers)} />
      <FlowArrow label="docker run" />
      <Node label="Container" sub="running process" tone="success" icon={icon(Box)} />
    </Flow>
  );
}

export function PortMapping() {
  return (
    <div className="space-y-3">
      <Flow>
        <Node label="Browser" sub="http://localhost:8080" icon={icon(Network)} />
        <FlowArrow />
        <Node label="Host port 8080" sub="your machine" tone="default" mono />
        <FlowArrow label="-p 8080:80" />
        <Node label="Container port 80" sub="nginx listens here" tone="accent" mono />
      </Flow>
      <p className="text-center font-mono text-xs text-muted">
        -p <span className="text-foreground">HOST</span>:<span className="text-accent-strong">CONTAINER</span>
      </p>
    </div>
  );
}

export function DockerfilePipeline() {
  return (
    <Flow>
      <Node label="Dockerfile" sub="the recipe" icon={icon(FileText)} />
      <FlowArrow label="docker build" />
      <Node label="Image" sub="layers + metadata" tone="accent" icon={icon(Layers)} />
      <FlowArrow label="docker run" />
      <Node label="Container" sub="running instance" tone="success" icon={icon(Box)} />
    </Flow>
  );
}

export function CmdEntrypoint() {
  const rows = [
    { run: "docker run img", ep: "ping -c 3", cmd: "localhost", final: "ping -c 3 localhost" },
    { run: "docker run img example.com", ep: "ping -c 3", cmd: "example.com", final: "ping -c 3 example.com", overridden: true },
  ];
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.run} className="space-y-2 rounded-lg border border-border p-3">
          <p className="font-mono text-xs text-muted">$ {r.run}</p>
          <Flow>
            <Node label={r.ep} sub="ENTRYPOINT (fixed)" mono tone="default" />
            <span className="px-2 py-1 text-center font-mono text-subtle" aria-hidden>+</span>
            <Node label={r.cmd} sub={r.overridden ? "run argument (replaces CMD)" : "CMD (default)"} mono tone={r.overridden ? "warning" : "accent"} />
            <FlowArrow />
            <Node label={r.final} sub="what actually runs" mono tone="success" />
          </Flow>
        </div>
      ))}
    </div>
  );
}

export function ImageLayers() {
  const layers = [
    { label: "COPY . .", sub: "your code: changes often", tone: "warning" as const, state: "Rebuilt" },
    { label: "RUN npm ci", sub: "dependencies", tone: "accent" as const, state: "Cached" },
    { label: "COPY package*.json ./", sub: "dependency list", tone: "accent" as const, state: "Cached" },
    { label: "WORKDIR /app", sub: "metadata + folder", tone: "accent" as const, state: "Cached" },
    { label: "FROM node:20-alpine", sub: "base image layers", tone: "muted" as const, state: "Cached" },
  ];
  return (
    <div className="mx-auto max-w-md space-y-1.5">
      <div className="mb-2 rounded-lg border border-dashed border-border-strong px-3 py-2 text-center text-xs text-muted">
        Container writable layer (only exists at run time)
      </div>
      {layers.map((l) => (
        <div key={l.label} className="flex items-center gap-2">
          <Node label={l.label} sub={l.sub} tone={l.tone} mono className="flex-1" />
          <span className={cn("w-16 shrink-0 text-right text-[11px] font-medium", l.state === "Cached" ? "text-success" : "text-warning")}>{l.state}</span>
        </div>
      ))}
      <p className="pt-1 text-center text-xs text-muted">Edit server.js → only the top layer rebuilds.</p>
    </div>
  );
}

export function ContainerNetwork() {
  return (
    <div className="space-y-3">
      <Group title="user-defined network: appnet (built-in DNS)" tone="accent">
        <Flow className="justify-center">
          <Node label="client" sub="curl http://api" tone="default" icon={icon(Box)} />
          <FlowArrow label="api:80" />
          <Node label="api" sub="nginx on port 80" tone="accent" icon={icon(Box)} />
        </Flow>
      </Group>
      <Group title="default bridge network">
        <Flow className="justify-center">
          <Node label="one" tone="muted" icon={icon(Box)} />
          <div className="flex items-center justify-center gap-1 px-2 py-1 text-xs text-danger">
            <X className="size-3.5" aria-hidden /> no name lookup
          </div>
          <Node label="two" tone="muted" icon={icon(Box)} />
        </Flow>
      </Group>
    </div>
  );
}

export function EnvConfig() {
  const envs = [
    { name: "development", vars: ["LOG_LEVEL=debug", "DB=localhost"] },
    { name: "staging", vars: ["LOG_LEVEL=info", "DB=staging-db"] },
    { name: "production", vars: ["LOG_LEVEL=warn", "DB=prod-db"] },
  ];
  return (
    <div className="space-y-3">
      <div className="mx-auto max-w-xs">
        <Node label="One image: my-api:1.4" tone="accent" icon={icon(Layers)} />
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {envs.map((e) => (
          <Group key={e.name} title={e.name}>
            <ul className="space-y-0.5 font-mono text-[11px] text-muted">
              {e.vars.map((v) => (
                <li key={v}>-e {v}</li>
              ))}
            </ul>
          </Group>
        ))}
      </div>
    </div>
  );
}

export function ComposeStack() {
  return (
    <div className="space-y-3">
      <Node label="compose.yaml" sub="docker compose up -d" icon={icon(FileText)} className="mx-auto max-w-xs" />
      <Group title="project network: shop_default" tone="accent">
        <Flow className="justify-center">
          <Node label="web" sub="built from ., port 8080→3000" tone="accent" icon={icon(Box)} />
          <FlowArrow label="cache:6379" />
          <Node label="cache" sub="redis:7" tone="default" icon={icon(Box)} />
          <FlowArrow />
          <Node label="cache-data" sub="named volume" tone="muted" icon={icon(HardDrive)} />
        </Flow>
      </Group>
    </div>
  );
}

export function ClusterHierarchy() {
  return (
    <div className="space-y-3">
      <Group title="Control plane" tone="accent">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Node label="API server" sub="front door" mono />
          <Node label="etcd" sub="cluster state" mono />
          <Node label="scheduler" sub="places Pods" mono />
          <Node label="controllers" sub="reconcile" mono />
        </div>
      </Group>
      <div className="grid gap-3 sm:grid-cols-2">
        {["worker-1", "worker-2"].map((w, i) => (
          <Group key={w} title={`Node: ${w}`}>
            <div className="mb-2 grid grid-cols-2 gap-1.5">
              <Node label="kubelet" tone="muted" mono />
              <Node label="containerd" tone="muted" mono />
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {(i === 0 ? ["web-7d4b", "api-5c9f"] : ["web-x2kp", "web-q8rn"]).map((p) => (
                <Node key={p} label={`Pod ${p}`} sub="container(s)" tone="accent" mono icon={icon(Box)} />
              ))}
            </div>
          </Group>
        ))}
      </div>
    </div>
  );
}

export function Reconciliation() {
  const steps = [
    { label: "Observe", sub: "read actual state" },
    { label: "Compare", sub: "actual vs. desired" },
    { label: "Act", sub: "create / delete / update" },
  ];
  return (
    <div className="space-y-3">
      <Flow className="justify-center">
        <Node label="Desired state" sub="replicas: 3 (stored in etcd)" tone="accent" />
        <FlowArrow />
        <div className="grid flex-1 grid-cols-3 gap-2">
          {steps.map((s) => (
            <Node key={s.label} label={s.label} sub={s.sub} tone="default" />
          ))}
        </div>
        <FlowArrow />
        <Node label="Actual state" sub="Pods running on nodes" tone="success" />
      </Flow>
      <p className="text-center text-xs text-muted">The controller repeats this loop continuously, not just once.</p>
    </div>
  );
}

export function YamlAnatomy() {
  const parts = [
    { key: "apiVersion: apps/v1", note: "API group/version", tone: "default" as const },
    { key: "kind: Deployment", note: "object type", tone: "default" as const },
    { key: "metadata: { name, labels }", note: "identity", tone: "default" as const },
    { key: "spec: { … }", note: "desired state, written by you", tone: "accent" as const },
    { key: "status: { … }", note: "actual state, written by Kubernetes", tone: "muted" as const },
  ];
  return (
    <div className="mx-auto max-w-lg space-y-1.5">
      {parts.map((p) => (
        <div key={p.key} className="grid grid-cols-1 items-center gap-1 sm:grid-cols-[1fr_auto] sm:gap-3">
          <Node label={p.key} tone={p.tone} mono className="text-left" />
          <span className="text-xs text-muted sm:w-52">{p.note}</span>
        </div>
      ))}
    </div>
  );
}

export function PodAnatomy() {
  return (
    <div className="mx-auto max-w-lg">
      <Group title="Pod: web-7d4b9c8f5d-x2k9p · IP 10.244.1.12" tone="accent">
        <div className="grid gap-2 sm:grid-cols-2">
          <Node label="container: web" sub="nginx:1.27 · port 80" tone="accent" icon={icon(Box)} />
          <Node label="container: log-agent" sub="optional sidecar" tone="ghost" icon={icon(Box)} />
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <Node label="Shared network" sub="same IP, talk via localhost" tone="muted" icon={icon(Network)} />
          <Node label="Shared volumes" sub="optional" tone="muted" icon={icon(HardDrive)} />
        </div>
      </Group>
      <p className="mt-2 text-center text-xs text-muted">Scheduled onto one node as a unit. Replaced, not repaired.</p>
    </div>
  );
}

export function ConfigSecrets() {
  return (
    <Flow>
      <div className="grid flex-1 gap-2">
        <Node label="ConfigMap: web-config" sub="LOG_LEVEL=info" tone="default" icon={icon(FileText)} />
        <Node label="Secret: db-credentials" sub="base64-encoded, not encrypted by default" tone="warning" icon={icon(FileText)} />
      </div>
      <FlowArrow label="env / files" />
      <Node label="Pod" sub="reads them at startup" tone="accent" icon={icon(Box)} className="flex-1" />
    </Flow>
  );
}

export function Probes() {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Group title="Readiness probe: ready for traffic?">
        <div className="space-y-1.5">
          <Node label="Passing" sub="Pod is in Service endpoints" tone="success" />
          <Node label="Failing" sub="removed from endpoints, not restarted" tone="warning" />
        </div>
      </Group>
      <Group title="Liveness probe: still healthy?">
        <div className="space-y-1.5">
          <Node label="Passing" sub="leave it alone" tone="success" />
          <Node label="Failing" sub="kubelet restarts the container" tone="danger" />
        </div>
      </Group>
    </div>
  );
}

export function Resources() {
  return (
    <div className="mx-auto max-w-lg space-y-3">
      <div>
        <div className="mb-1 flex justify-between text-xs text-muted">
          <span>Node allocatable CPU: 2000m</span>
        </div>
        <div className="flex h-8 overflow-hidden rounded-lg border border-border text-[11px]">
          <div className="flex w-[25%] items-center justify-center border-r border-border bg-accent-soft text-foreground">web 500m</div>
          <div className="flex w-[25%] items-center justify-center border-r border-border bg-accent-soft text-foreground">api 500m</div>
          <div className="flex flex-1 items-center justify-center text-subtle">free 1000m</div>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Node label="request" sub="reserved for scheduling" tone="accent" mono />
        <Node label="limit" sub="hard ceiling at run time" tone="warning" mono />
      </div>
      <p className="text-center text-xs text-muted">A Pod requesting 1500m CPU won&apos;t fit here and stays Pending.</p>
    </div>
  );
}

export function PodStates() {
  return (
    <div className="space-y-3">
      <Flow>
        <Node label="Pending" sub="waiting for a node" tone="warning" mono />
        <FlowArrow label="scheduled" />
        <Node label="ContainerCreating" sub="pulling image" tone="default" mono />
        <FlowArrow label="started" />
        <Node label="Running" sub="ready for traffic" tone="success" mono />
      </Flow>
      <div className="grid gap-2 sm:grid-cols-3">
        <Node label="Pending (stuck)" sub="no node fits the requests → describe" tone="warning" mono />
        <Node label="ImagePullBackOff" sub="can't pull image → describe events" tone="danger" mono />
        <Node label="CrashLoopBackOff" sub="keeps exiting → logs --previous" tone="danger" mono />
      </div>
    </div>
  );
}

export function ServerIcon() {
  return <Server aria-hidden />;
}
