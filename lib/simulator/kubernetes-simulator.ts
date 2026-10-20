import { hashString } from "@/lib/utils";
import { formatTable, normalizeCommand, parseArgs, tokenize } from "./command-parser";
import { type CommandResult, type OutputLine, err, info, muted, out } from "./types";

/* ------------------------------------------------------------------ */
/* State model: a deliberately small, deterministic slice of Kubernetes */
/* ------------------------------------------------------------------ */

export interface ContainerSpec {
  name: string;
  image: string;
  port: number;
  env: Record<string, string>;
  requests?: { cpu: number; memory: number };
  limits?: { cpu: number; memory: number };
  readinessProbe?: string;
  livenessProbe?: string;
}

export interface K8sDeployment {
  name: string;
  namespace: string;
  replicas: number;
  labels: Record<string, string>;
  template: ContainerSpec;
  revision: number;
  history: { revision: number; hash: string; image: string; template: ContainerSpec }[];
  createdTick: number;
}

export interface K8sPod {
  name: string;
  namespace: string;
  labels: Record<string, string>;
  spec: ContainerSpec;
  owner: string | null;
  hash: string | null;
  node: string | null;
  createdTick: number;
  ip: string;
}

export interface K8sService {
  name: string;
  namespace: string;
  type: "ClusterIP" | "NodePort" | "LoadBalancer";
  selector: Record<string, string>;
  port: number;
  targetPort: number;
  nodePort?: number;
  clusterIP: string;
  createdTick: number;
}

export interface K8sNode {
  name: string;
  role: "control-plane" | "worker";
  cpu: number;
  memory: number;
}

export interface K8sConfigMap {
  name: string;
  namespace: string;
  data: Record<string, string>;
  secret?: boolean;
}

export type ManifestObject =
  | { kind: "Deployment"; name: string; replicas: number; labels: Record<string, string>; template: ContainerSpec }
  | { kind: "Service"; name: string; type: K8sService["type"]; selector: Record<string, string>; port: number; targetPort: number }
  | { kind: "Pod"; name: string; labels: Record<string, string>; spec: ContainerSpec }
  | { kind: "ConfigMap"; name: string; data: Record<string, string> };

export interface ManifestFile {
  content: string;
  objects: ManifestObject[];
}

export interface K8sState {
  nodes: K8sNode[];
  deployments: K8sDeployment[];
  pods: K8sPod[];
  services: K8sService[];
  configMaps: K8sConfigMap[];
  namespaces: string[];
  files: Record<string, ManifestFile>;
  tick: number;
  seq: number;
}

/* ------------------------------------------------------------------ */
/* Simulated images                                                    */
/* ------------------------------------------------------------------ */

const NGINX_LOGS = [
  "/docker-entrypoint.sh: Configuration complete; ready for start up",
  "2025/01/01 10:00:00 [notice] 1#1: nginx/1.27.2",
  "2025/01/01 10:00:00 [notice] 1#1: start worker processes",
  '10.244.1.1 - - [01/Jan/2025:10:00:05 +0000] "GET / HTTP/1.1" 200 615 "-" "kube-probe/1.31"',
];

interface ImageBehavior {
  logs: string[];
  requiresEnv?: string;
  crashLogs?: string[];
}

const KNOWN_IMAGES: Record<string, ImageBehavior> = {
  "nginx:1.27": { logs: NGINX_LOGS },
  "nginx:1.26": { logs: NGINX_LOGS.map((l) => l.replace("1.27.2", "1.26.2")) },
  "nginx:latest": { logs: NGINX_LOGS },
  "redis:7": { logs: ["1:M Server initialized", "1:M Ready to accept connections tcp"] },
  "busybox:1.36": { logs: [] },
  "quest/web:1.0": { logs: ["web v1.0 listening on :8080"] },
  "quest/web:2.0": { logs: ["web v2.0 listening on :8080"] },
  "quest/api:1.0": {
    logs: ["api: loading configuration", "api: connected to database", "api listening on :3000"],
    requiresEnv: "DATABASE_URL",
    crashLogs: [
      "api: loading configuration",
      "Error: required environment variable DATABASE_URL is not set",
      "    at loadConfig (/app/config.js:12:11)",
      "    at main (/app/server.js:4:3)",
      "Process exited with code 1",
    ],
  },
};

function normalizeImage(image: string): string {
  return image.includes(":") ? image : `${image}:latest`;
}

function imageBehavior(image: string): ImageBehavior | undefined {
  return KNOWN_IMAGES[normalizeImage(image)];
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const SAFE = "bcdfghjklmnpqrstvwxz2456789";

function k8sId(seed: string, length: number): string {
  let h = hashString(seed);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += SAFE[h % SAFE.length];
    h = Math.floor(h / SAFE.length) || hashString(`${seed}:${i}`);
  }
  return out;
}

function templateHash(dep: { name: string; template: ContainerSpec }): string {
  return k8sId(`${dep.name}|${JSON.stringify(dep.template)}`, 10);
}

function age(ticks: number): string {
  const s = ticks * 7 + 5;
  if (s < 120) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  return `${Math.floor(s / 3600)}h`;
}

function clone(state: K8sState): K8sState {
  return structuredClone(state);
}

function matches(labels: Record<string, string>, selector: Record<string, string>): boolean {
  const entries = Object.entries(selector);
  return entries.length > 0 && entries.every(([k, v]) => labels[k] === v);
}

function parseSelector(text: string): Record<string, string> | null {
  const result: Record<string, string> = {};
  for (const part of text.split(",")) {
    const [k, v] = part.split("=");
    if (!k || v === undefined) return null;
    result[k.trim()] = v.trim();
  }
  return result;
}

function labelText(labels: Record<string, string>): string {
  return Object.entries(labels).map(([k, v]) => `${k}=${v}`).join(",") || "<none>";
}

function parseCpu(text: string): number | null {
  if (/^\d+m$/.test(text)) return Number(text.slice(0, -1));
  if (/^\d+(\.\d+)?$/.test(text)) return Math.round(Number(text) * 1000);
  return null;
}

function parseMemory(text: string): number | null {
  const m = text.match(/^(\d+)(Mi|Gi)$/);
  if (!m) return null;
  return m[2] === "Gi" ? Number(m[1]) * 1024 : Number(m[1]);
}

const cpuText = (m: number) => (m % 1000 === 0 ? String(m / 1000) : `${m}m`);
const memText = (m: number) => (m % 1024 === 0 ? `${m / 1024}Gi` : `${m}Mi`);

type PodPhase = "Running" | "Pending" | "CrashLoopBackOff" | "Error" | "ImagePullBackOff" | "ErrImagePull";

function podStatus(pod: K8sPod, tick: number): { phase: PodPhase; ready: boolean; restarts: number } {
  if (!pod.node) return { phase: "Pending", ready: false, restarts: 0 };
  const behavior = imageBehavior(pod.spec.image);
  const elapsed = tick - pod.createdTick;
  if (!behavior) return { phase: elapsed <= 1 ? "ErrImagePull" : "ImagePullBackOff", ready: false, restarts: 0 };
  if (behavior.requiresEnv && !pod.spec.env[behavior.requiresEnv]) {
    const restarts = Math.min(Math.max(1, elapsed), 12);
    return { phase: elapsed <= 1 ? "Error" : "CrashLoopBackOff", ready: false, restarts };
  }
  return { phase: "Running", ready: true, restarts: 0 };
}

function templateHealthy(template: ContainerSpec): boolean {
  const b = imageBehavior(template.image);
  if (!b) return false;
  return !(b.requiresEnv && !template.env[b.requiresEnv]);
}

function podRequests(p: { spec: ContainerSpec }) {
  return { cpu: p.spec.requests?.cpu ?? 100, memory: p.spec.requests?.memory ?? 64 };
}

function schedule(state: K8sState, spec: ContainerSpec): string | null {
  const workers = state.nodes.filter((n) => n.role === "worker");
  const need = podRequests({ spec });
  const candidates = workers
    .map((node) => {
      const used = state.pods
        .filter((p) => p.node === node.name)
        .reduce((acc, p) => ({ cpu: acc.cpu + podRequests(p).cpu, memory: acc.memory + podRequests(p).memory }), { cpu: 0, memory: 0 });
      return { node, used };
    })
    .filter(({ node, used }) => used.cpu + need.cpu <= node.cpu && used.memory + need.memory <= node.memory)
    .sort((a, b) => state.pods.filter((p) => p.node === a.node.name).length - state.pods.filter((p) => p.node === b.node.name).length);
  return candidates[0]?.node.name ?? null;
}

function createPod(state: K8sState, dep: K8sDeployment, hash: string, spec: ContainerSpec) {
  state.seq += 1;
  const name = `${dep.name}-${hash}-${k8sId(`${dep.name}-${state.seq}`, 5)}`;
  state.pods.push({
    name,
    namespace: dep.namespace,
    labels: { ...dep.labels, "pod-template-hash": hash },
    spec: structuredClone(spec),
    owner: dep.name,
    hash,
    node: schedule(state, spec),
    createdTick: state.tick,
    ip: `10.244.${(state.seq % 2) + 1}.${(hashString(name) % 200) + 10}`,
  });
}

/** Moves actual state toward desired state, as a Deployment controller would. */
function reconcile(state: K8sState) {
  for (const dep of state.deployments) {
    const hash = templateHash(dep);
    const owned = state.pods.filter((p) => p.owner === dep.name && p.namespace === dep.namespace);
    const current = owned.filter((p) => p.hash === hash);
    const old = owned.filter((p) => p.hash !== hash);
    const healthy = templateHealthy(dep.template);
    const removePods = (pods: K8sPod[]) => {
      const names = new Set(pods.map((p) => p.name));
      state.pods = state.pods.filter((p) => !names.has(p.name));
    };
    if (old.length === 0 || healthy) {
      removePods(old);
      if (current.length > dep.replicas) removePods(current.slice(dep.replicas));
      for (let i = current.length; i < dep.replicas; i++) createPod(state, dep, hash, dep.template);
    } else {
      // A rollout to a broken template gets stuck: new Pods fail, old Pods keep serving.
      const surge = Math.max(1, Math.ceil(dep.replicas * 0.25));
      const wanted = Math.min(dep.replicas, surge);
      if (current.length > wanted) removePods(current.slice(wanted));
      for (let i = current.length; i < wanted; i++) createPod(state, dep, hash, dep.template);
      if (old.length > dep.replicas) removePods(old.slice(dep.replicas));
      const oldHash = old[0]?.hash;
      const oldSpec = old[0]?.spec;
      for (let i = old.length; i < dep.replicas && oldHash && oldSpec; i++) createPod(state, dep, oldHash, oldSpec);
    }
    if (!dep.history.some((h) => h.hash === hash)) {
      dep.history.push({ revision: dep.revision, hash, image: dep.template.image, template: structuredClone(dep.template) });
    }
  }
}

function addDeployment(state: K8sState, obj: Extract<ManifestObject, { kind: "Deployment" }>, namespace = "default"): "created" | "configured" | "unchanged" {
  const existing = state.deployments.find((d) => d.name === obj.name && d.namespace === namespace);
  if (existing) {
    const changed = JSON.stringify(existing.template) !== JSON.stringify(obj.template);
    const scaled = existing.replicas !== obj.replicas;
    if (!changed && !scaled) return "unchanged";
    existing.replicas = obj.replicas;
    if (changed) {
      existing.template = structuredClone(obj.template);
      existing.revision += 1;
    }
    return "configured";
  }
  state.deployments.push({
    name: obj.name,
    namespace,
    replicas: obj.replicas,
    labels: obj.labels,
    template: structuredClone(obj.template),
    revision: 1,
    history: [],
    createdTick: state.tick,
  });
  return "created";
}

function addService(state: K8sState, obj: Extract<ManifestObject, { kind: "Service" }>, namespace = "default"): "created" | "configured" | "unchanged" {
  const existing = state.services.find((s) => s.name === obj.name && s.namespace === namespace);
  const nodePort = obj.type === "ClusterIP" ? undefined : 30000 + (hashString(obj.name) % 2767);
  if (existing) {
    const before = JSON.stringify(existing);
    Object.assign(existing, { type: obj.type, selector: obj.selector, port: obj.port, targetPort: obj.targetPort, nodePort });
    return before === JSON.stringify(existing) ? "unchanged" : "configured";
  }
  state.services.push({
    name: obj.name,
    namespace,
    type: obj.type,
    selector: obj.selector,
    port: obj.port,
    targetPort: obj.targetPort,
    nodePort,
    clusterIP: `10.96.${hashString(obj.name) % 250}.${(hashString(`${obj.name}x`) % 250) + 2}`,
    createdTick: state.tick,
  });
  return "created";
}

/* ------------------------------------------------------------------ */
/* Scenario files and presets                                          */
/* ------------------------------------------------------------------ */

const WEB_TEMPLATE: ContainerSpec = {
  name: "web",
  image: "nginx:1.27",
  port: 80,
  env: {},
  requests: { cpu: 100, memory: 64 },
  limits: { cpu: 250, memory: 128 },
  readinessProbe: "http-get :80/ delay=0s period=10s",
};

const DEPLOYMENT_YAML = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
  labels:
    app: web
spec:
  replicas: 2
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: web
          image: nginx:1.27
          ports:
            - containerPort: 80
          resources:
            requests:
              cpu: 100m
              memory: 64Mi
            limits:
              cpu: 250m
              memory: 128Mi
          readinessProbe:
            httpGet:
              path: /
              port: 80`;

const SERVICE_YAML = `apiVersion: v1
kind: Service
metadata:
  name: web
spec:
  type: ClusterIP
  selector:
    app: web
  ports:
    - port: 80
      targetPort: 80`;

const POD_YAML = `apiVersion: v1
kind: Pod
metadata:
  name: hello
  labels:
    app: hello
spec:
  containers:
    - name: hello
      image: nginx:1.27
      ports:
        - containerPort: 80`;

const CONFIGMAP_YAML = `apiVersion: v1
kind: ConfigMap
metadata:
  name: web-config
data:
  WELCOME_MESSAGE: "Hello from a ConfigMap"
  LOG_LEVEL: info`;

const API_TEMPLATE: ContainerSpec = {
  name: "api",
  image: "quest/api:1.0",
  port: 3000,
  env: {},
  requests: { cpu: 100, memory: 128 },
  limits: { cpu: 500, memory: 256 },
};

const API_YAML = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  replicas: 1
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
        - name: api
          image: quest/api:1.0
          ports:
            - containerPort: 3000
          # env:            <- DATABASE_URL is missing!
          #   - name: DATABASE_URL
          #     value: postgres://db:5432/app`;

const SHOP_YAML = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: shop
spec:
  replicas: 2
  selector:
    matchLabels:
      app: shop
  template:
    metadata:
      labels:
        app: shop
    spec:
      containers:
        - name: shop
          image: ngnix:1.27
          ports:
            - containerPort: 80`;

const REPORT_YAML = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: report
spec:
  replicas: 1
  selector:
    matchLabels:
      app: report
  template:
    metadata:
      labels:
        app: report
    spec:
      containers:
        - name: report
          image: nginx:1.27
          resources:
            requests:
              cpu: "8"
              memory: 256Mi`;

const BASE_FILES: Record<string, ManifestFile> = {
  "deployment.yaml": {
    content: DEPLOYMENT_YAML,
    objects: [{ kind: "Deployment", name: "web", replicas: 2, labels: { app: "web" }, template: WEB_TEMPLATE }],
  },
  "service.yaml": {
    content: SERVICE_YAML,
    objects: [{ kind: "Service", name: "web", type: "ClusterIP", selector: { app: "web" }, port: 80, targetPort: 80 }],
  },
  "pod.yaml": {
    content: POD_YAML,
    objects: [{ kind: "Pod", name: "hello", labels: { app: "hello" }, spec: { name: "hello", image: "nginx:1.27", port: 80, env: {} } }],
  },
  "configmap.yaml": {
    content: CONFIGMAP_YAML,
    objects: [{ kind: "ConfigMap", name: "web-config", data: { WELCOME_MESSAGE: "Hello from a ConfigMap", LOG_LEVEL: "info" } }],
  },
};

function baseState(): K8sState {
  return {
    nodes: [
      { name: "control-plane", role: "control-plane", cpu: 2000, memory: 4096 },
      { name: "worker-1", role: "worker", cpu: 2000, memory: 4096 },
      { name: "worker-2", role: "worker", cpu: 2000, memory: 4096 },
    ],
    deployments: [],
    pods: [],
    services: [],
    configMaps: [{ name: "kube-root-ca.crt", namespace: "default", data: { "ca.crt": "(certificate)" } }],
    namespaces: ["default", "kube-node-lease", "kube-public", "kube-system"],
    files: structuredClone(BASE_FILES),
    tick: 0,
    seq: 0,
  };
}

export function createKubernetesState(scenario: string = "k8s-empty"): K8sState {
  const state = baseState();
  const addRunningWeb = (replicas: number) => {
    addDeployment(state, { kind: "Deployment", name: "web", replicas, labels: { app: "web" }, template: WEB_TEMPLATE });
    addService(state, { kind: "Service", name: "web", type: "ClusterIP", selector: { app: "web" }, port: 80, targetPort: 80 });
  };
  switch (scenario) {
    case "k8s-running-app":
      state.tick = 10;
      addRunningWeb(3);
      addDeployment(state, {
        kind: "Deployment", name: "api", replicas: 2, labels: { app: "api" },
        template: { ...API_TEMPLATE, env: { DATABASE_URL: "postgres://db:5432/app" } },
      });
      break;
    case "k8s-crashloop":
      state.tick = 10;
      addRunningWeb(2);
      addDeployment(state, { kind: "Deployment", name: "api", replicas: 1, labels: { app: "api" }, template: API_TEMPLATE });
      state.files["api-deployment.yaml"] = { content: API_YAML, objects: [{ kind: "Deployment", name: "api", replicas: 1, labels: { app: "api" }, template: API_TEMPLATE }] };
      break;
    case "k8s-imagepull": {
      state.tick = 10;
      addRunningWeb(2);
      const shop: ContainerSpec = { name: "shop", image: "ngnix:1.27", port: 80, env: {} };
      addDeployment(state, { kind: "Deployment", name: "shop", replicas: 2, labels: { app: "shop" }, template: shop });
      state.files["shop-deployment.yaml"] = { content: SHOP_YAML, objects: [{ kind: "Deployment", name: "shop", replicas: 2, labels: { app: "shop" }, template: shop }] };
      break;
    }
    case "k8s-pending": {
      state.tick = 10;
      addRunningWeb(2);
      const report: ContainerSpec = { name: "report", image: "nginx:1.27", port: 80, env: {}, requests: { cpu: 8000, memory: 256 } };
      addDeployment(state, { kind: "Deployment", name: "report", replicas: 1, labels: { app: "report" }, template: report });
      state.files["report-deployment.yaml"] = { content: REPORT_YAML, objects: [{ kind: "Deployment", name: "report", replicas: 1, labels: { app: "report" }, template: report }] };
      break;
    }
    default:
      break;
  }
  const createdAt = state.tick;
  reconcile(state);
  // Pre-existing objects look like they have been around for a while.
  if (scenario !== "k8s-empty") {
    for (const p of state.pods) p.createdTick = Math.max(0, createdAt - 8);
    for (const d of state.deployments) d.createdTick = Math.max(0, createdAt - 8);
    for (const s of state.services) s.createdTick = Math.max(0, createdAt - 8);
  }
  return state;
}

export const KUBERNETES_SCENARIOS = [
  { id: "k8s-empty", label: "Empty cluster", description: "Three nodes, nothing deployed. Manifests are ready in the folder." },
  { id: "k8s-running-app", label: "Running app", description: "A web Deployment with a Service, plus an api Deployment." },
  { id: "k8s-crashloop", label: "Crashing Pod", description: "The api Deployment keeps crashing." },
  { id: "k8s-imagepull", label: "Image pull failure", description: "The shop Deployment cannot pull its image." },
  { id: "k8s-pending", label: "Pending Pod", description: "The report Pod cannot be scheduled." },
] as const;

/* ------------------------------------------------------------------ */
/* Commands                                                            */
/* ------------------------------------------------------------------ */

type Result = CommandResult<K8sState>;

const fail = (state: K8sState, lines: OutputLine[], explanation?: string): Result => ({ state, lines, explanation, ok: false });
const done = (state: K8sState, lines: OutputLine[], explanation?: string): Result => ({ state, lines, explanation, ok: true });

const RESOURCE_ALIASES: Record<string, string> = {
  po: "pods", pod: "pods", pods: "pods",
  deploy: "deployments", deployment: "deployments", deployments: "deployments",
  rs: "replicasets", replicaset: "replicasets", replicasets: "replicasets",
  svc: "services", service: "services", services: "services",
  no: "nodes", node: "nodes", nodes: "nodes",
  ns: "namespaces", namespace: "namespaces", namespaces: "namespaces",
  cm: "configmaps", configmap: "configmaps", configmaps: "configmaps",
  secret: "secrets", secrets: "secrets",
  ep: "endpoints", endpoints: "endpoints",
  ev: "events", event: "events", events: "events",
  all: "all",
};

function splitTypeName(first: string | undefined, second: string | undefined): { type?: string; name?: string } {
  if (!first) return {};
  if (first.includes("/")) {
    const [t, n] = first.split("/");
    return { type: RESOURCE_ALIASES[t], name: n };
  }
  return { type: RESOURCE_ALIASES[first], name: second };
}

function readyCount(state: K8sState, pods: K8sPod[]) {
  return pods.filter((p) => podStatus(p, state.tick).ready).length;
}

function serviceEndpoints(state: K8sState, svc: K8sService): K8sPod[] {
  return state.pods.filter((p) => p.namespace === svc.namespace && matches(p.labels, svc.selector) && podStatus(p, state.tick).ready);
}

function podRows(state: K8sState, pods: K8sPod[], wide: boolean, showLabels: boolean) {
  const headers = ["NAME", "READY", "STATUS", "RESTARTS", "AGE"];
  if (wide) headers.push("IP", "NODE");
  if (showLabels) headers.push("LABELS");
  const rows = pods.map((p) => {
    const s = podStatus(p, state.tick);
    const row = [
      p.name,
      s.ready ? "1/1" : "0/1",
      s.phase,
      s.restarts ? `${s.restarts} (${(s.restarts % 5) * 7 + 9}s ago)` : "0",
      age(state.tick - p.createdTick),
    ];
    if (wide) row.push(p.node ? p.ip : "<none>", p.node ?? "<none>");
    if (showLabels) row.push(labelText(p.labels));
    return row;
  });
  return formatTable(headers, rows);
}

function deploymentRows(state: K8sState, deps: K8sDeployment[]) {
  const rows = deps.map((d) => {
    const pods = state.pods.filter((p) => p.owner === d.name);
    const hash = templateHash(d);
    return [d.name, `${readyCount(state, pods)}/${d.replicas}`, String(pods.filter((p) => p.hash === hash).length), String(Math.min(readyCount(state, pods), d.replicas)), age(state.tick - d.createdTick)];
  });
  return formatTable(["NAME", "READY", "UP-TO-DATE", "AVAILABLE", "AGE"], rows);
}

function serviceRows(state: K8sState, services: K8sService[], includeKube: boolean) {
  const rows = services.map((s) => [
    s.name,
    s.type,
    s.clusterIP,
    s.type === "LoadBalancer" ? "<pending>" : "<none>",
    s.nodePort ? `${s.port}:${s.nodePort}/TCP` : `${s.port}/TCP`,
    age(state.tick - s.createdTick),
  ]);
  if (includeKube) rows.unshift(["kubernetes", "ClusterIP", "10.96.0.1", "<none>", "443/TCP", age(state.tick + 40)]);
  return formatTable(["NAME", "TYPE", "CLUSTER-IP", "EXTERNAL-IP", "PORT(S)", "AGE"], rows);
}

function replicaSetRows(state: K8sState) {
  const rows: string[][] = [];
  for (const d of state.deployments) {
    const hashes = new Set([...d.history.map((h) => h.hash)]);
    for (const hash of hashes) {
      const pods = state.pods.filter((p) => p.owner === d.name && p.hash === hash);
      rows.push([`${d.name}-${hash}`, String(pods.length), String(pods.length), String(readyCount(state, pods)), age(state.tick - d.createdTick)]);
    }
  }
  return formatTable(["NAME", "DESIRED", "CURRENT", "READY", "AGE"], rows);
}

function cmdGet(state: K8sState, args: string[]): Result {
  const parsed = parseArgs(args, {
    boolean: ["A", "all-namespaces", "show-labels", "w", "watch"],
    value: ["o", "output", "l", "selector", "n", "namespace"],
    aliases: { output: "o", selector: "l", namespace: "n", "all-namespaces": "A", watch: "w" },
  });
  if (parsed.unknown.length) return fail(state, [err(`error: unknown flag: ${parsed.unknown[0]}`)]);
  const { type, name } = splitTypeName(parsed.positionals[0], parsed.positionals[1]);
  if (!parsed.positionals[0]) {
    return fail(state, [err("You must specify the type of resource to get. Use \"kubectl api-resources\" for a complete list."), muted("Try: kubectl get pods")]);
  }
  if (!type) return fail(state, [err(`error: the server doesn't have a resource type "${parsed.positionals[0]}"`)], "Supported here: pods, deployments, replicasets, services, endpoints, nodes, namespaces, configmaps, secrets, events, all.");
  const namespace = typeof parsed.flags.n === "string" ? parsed.flags.n : "default";
  const allNs = parsed.flags.A === true;
  if (!allNs && !state.namespaces.includes(namespace)) return fail(state, [err(`Error from server (NotFound): namespaces "${namespace}" not found`)]);
  const selector = typeof parsed.flags.l === "string" ? parseSelector(parsed.flags.l) : null;
  if (typeof parsed.flags.l === "string" && !selector) return fail(state, [err(`error: invalid label selector "${parsed.flags.l}". Use key=value.`)]);
  const wide = parsed.flags.o === "wide";
  const watchNote = parsed.flags.w ? [info("(simulated) Watching (-w) is not simulated. Showing a single snapshot.")] : [];
  const inNs = <T extends { namespace: string }>(items: T[]) => (allNs ? items : items.filter((i) => i.namespace === namespace));
  const notFound = (kind: string) => fail(state, [err(`Error from server (NotFound): ${kind} "${name}" not found`)], `There is no ${kind.replace(/s$/, "")} named "${name}" in the ${namespace} namespace. Run \`kubectl get ${kind}\` to list them.`);
  const noneFound = () => done(state, [...watchNote, out(`No resources found in ${allNs ? "any" : namespace} namespace.`)]);

  switch (type) {
    case "pods": {
      let pods = inNs(state.pods);
      if (allNs) {
        const system: K8sPod[] = ["coredns-7c65d6cfc9-2xkqp", "etcd-control-plane", "kube-apiserver-control-plane", "kube-scheduler-control-plane", "kube-controller-manager-control-plane"].map((n) => ({
          name: n, namespace: "kube-system", labels: {}, spec: { name: n, image: "nginx:1.27", port: 0, env: {} }, owner: null, hash: null, node: "control-plane", createdTick: -40, ip: "10.244.0.2",
        }));
        pods = [...system, ...pods];
      }
      if (name) pods = pods.filter((p) => p.name === name);
      if (selector) pods = pods.filter((p) => matches(p.labels, selector));
      if (name && pods.length === 0) return notFound("pods");
      if (pods.length === 0) return noneFound();
      const lines = podRows(state, pods, wide, parsed.flags["show-labels"] === true);
      if (allNs) lines.forEach((l, i) => (lines[i] = `${(i === 0 ? "NAMESPACE" : pods[i - 1].namespace).padEnd(14)}${l}`));
      const bad = pods.filter((p) => podStatus(p, state.tick).phase !== "Running");
      let explanation = `Listed ${pods.length} Pod(s)${selector ? ` matching the label selector ${parsed.flags.l}` : ""}. READY shows ready containers / total containers.`;
      if (bad.length) {
        const phase = podStatus(bad[0], state.tick).phase;
        explanation += ` ${bad.length} Pod(s) are not healthy (${phase}). Next step: \`kubectl describe pod ${bad[0].name}\` to read its Events${phase.includes("Crash") || phase === "Error" ? `, and \`kubectl logs ${bad[0].name}\` to see why the app exits` : ""}.`;
      } else if (pods.some((p) => p.owner)) {
        explanation += " Pod names start with their Deployment name and ReplicaSet hash, which shows a controller manages them.";
      }
      return done(state, [...watchNote, ...lines.map((l) => out(l))], explanation);
    }
    case "deployments": {
      let deps = inNs(state.deployments);
      if (name) deps = deps.filter((d) => d.name === name);
      if (selector) deps = deps.filter((d) => matches(d.labels, selector));
      if (name && deps.length === 0) return notFound("deployments");
      if (deps.length === 0) return noneFound();
      return done(state, deploymentRows(state, deps).map((l) => out(l)), "Listed Deployments. READY is ready Pods / desired replicas. UP-TO-DATE counts Pods running the latest template.");
    }
    case "replicasets":
      if (state.deployments.length === 0) return noneFound();
      return done(state, replicaSetRows(state).map((l) => out(l)), "Listed ReplicaSets. Each Deployment revision gets its own ReplicaSet, named with a hash of the Pod template. Old ones are kept (scaled to 0) so you can roll back.");
    case "services": {
      let svcs = inNs(state.services);
      if (name) svcs = svcs.filter((s) => s.name === name);
      if (name && name !== "kubernetes" && svcs.length === 0) return notFound("services");
      return done(state, serviceRows(state, svcs, !name || name === "kubernetes").map((l) => out(l)), "Listed Services. CLUSTER-IP is a stable virtual IP inside the cluster. NodePort Services also show their node port after the colon. The `kubernetes` Service is the API server itself.");
    }
    case "endpoints": {
      let svcs = inNs(state.services);
      if (name) svcs = svcs.filter((s) => s.name === name);
      if (name && svcs.length === 0) return notFound("endpoints");
      const rows = svcs.map((s) => {
        const eps = serviceEndpoints(state, s);
        return [s.name, eps.length ? eps.map((p) => `${p.ip}:${s.targetPort}`).join(",") : "<none>", age(state.tick - s.createdTick)];
      });
      const empty = svcs.find((s) => serviceEndpoints(state, s).length === 0);
      return done(
        state,
        formatTable(["NAME", "ENDPOINTS", "AGE"], rows).map((l) => out(l)),
        `Endpoints are the Pod IPs a Service currently routes to: ready Pods whose labels match its selector.${empty ? ` "${empty.name}" has no endpoints, so check its selector against the Pod labels (kubectl get pods --show-labels).` : ""}`,
      );
    }
    case "nodes": {
      const rows = state.nodes.map((n) => {
        const row = [n.name, "Ready", n.role === "control-plane" ? "control-plane" : "<none>", "3d", "v1.31.2"];
        if (wide) row.push(`192.168.49.${state.nodes.indexOf(n) + 2}`);
        return row;
      });
      const headers = ["NAME", "STATUS", "ROLES", "AGE", "VERSION"];
      if (wide) headers.push("INTERNAL-IP");
      return done(state, formatTable(headers, rows).map((l) => out(l)), "Listed the cluster's nodes (machines). The control-plane node runs the cluster's brain; workers run your Pods. All are Ready.");
    }
    case "namespaces":
      return done(state, formatTable(["NAME", "STATUS", "AGE"], state.namespaces.map((n) => [n, "Active", "3d"])).map((l) => out(l)), "Listed namespaces. Namespaces group objects. Commands use `default` unless you pass -n NAME.");
    case "configmaps":
    case "secrets": {
      const items = inNs(state.configMaps).filter((c) => (type === "secrets" ? c.secret : !c.secret));
      if (items.length === 0) return noneFound();
      const headers = type === "secrets" ? ["NAME", "TYPE", "DATA", "AGE"] : ["NAME", "DATA", "AGE"];
      const rows = items.map((c) => (type === "secrets" ? [c.name, "Opaque", String(Object.keys(c.data).length), "1m"] : [c.name, String(Object.keys(c.data).length), "1m"]));
      return done(state, formatTable(headers, rows).map((l) => out(l)), type === "secrets" ? "Listed Secrets. Values are only base64-encoded, not encrypted, so anyone allowed to read Secrets can decode them." : "Listed ConfigMaps: non-secret configuration that Pods can read as environment variables or files.");
    }
    case "events": {
      const lines = state.pods.flatMap((p) => podEvents(state, p).map((e) => [e.age, e.type, e.reason, `pod/${p.name}`, e.message]));
      if (lines.length === 0) return noneFound();
      return done(state, formatTable(["LAST SEEN", "TYPE", "REASON", "OBJECT", "MESSAGE"], lines.slice(-12)).map((l) => out(l)), "Events record what controllers and the kubelet did, and are often the fastest route to a diagnosis.");
    }
    case "all": {
      const lines: OutputLine[] = [];
      const pods = inNs(state.pods);
      if (pods.length) lines.push(...podRows(state, pods, false, false).map((l, i) => out(i === 0 ? l : `pod/${l}`)), out(""));
      lines.push(...serviceRows(state, inNs(state.services), true).map((l, i) => out(i === 0 ? l : `service/${l}`)), out(""));
      if (state.deployments.length) lines.push(...deploymentRows(state, inNs(state.deployments)).map((l, i) => out(i === 0 ? l : `deployment.apps/${l}`)), out(""));
      if (state.deployments.length) lines.push(...replicaSetRows(state).map((l, i) => out(i === 0 ? l : `replicaset.apps/${l}`)));
      return done(state, lines, "Showed the common workload objects together: Pods, Services, Deployments, and ReplicaSets.");
    }
    default:
      return fail(state, [err(`error: unsupported resource type "${type}"`)]);
  }
}

interface K8sEvent {
  type: "Normal" | "Warning";
  reason: string;
  age: string;
  from: string;
  message: string;
}

function podEvents(state: K8sState, pod: K8sPod): K8sEvent[] {
  const s = podStatus(pod, state.tick);
  const a = age(state.tick - pod.createdTick);
  const image = normalizeImage(pod.spec.image);
  if (s.phase === "Pending") {
    const req = podRequests(pod);
    return [
      {
        type: "Warning",
        reason: "FailedScheduling",
        age: a,
        from: "default-scheduler",
        message: `0/3 nodes are available: 1 node(s) had untolerated taint {node-role.kubernetes.io/control-plane: }, 2 Insufficient cpu. preemption: 0/3 nodes are available. (requested cpu: ${cpuText(req.cpu)})`,
      },
    ];
  }
  const base: K8sEvent[] = [{ type: "Normal", reason: "Scheduled", age: a, from: "default-scheduler", message: `Successfully assigned default/${pod.name} to ${pod.node}` }];
  if (s.phase === "ErrImagePull" || s.phase === "ImagePullBackOff") {
    return [
      ...base,
      { type: "Normal", reason: "Pulling", age: a, from: "kubelet", message: `Pulling image "${pod.spec.image}"` },
      {
        type: "Warning",
        reason: "Failed",
        age: a,
        from: "kubelet",
        message: `Failed to pull image "${pod.spec.image}": rpc error: code = NotFound desc = failed to pull and unpack image "docker.io/library/${image}": not found`,
      },
      { type: "Warning", reason: "Failed", age: a, from: "kubelet", message: "Error: ErrImagePull" },
      { type: "Normal", reason: "BackOff", age: a, from: "kubelet", message: `Back-off pulling image "${pod.spec.image}"` },
      { type: "Warning", reason: "Failed", age: a, from: "kubelet", message: "Error: ImagePullBackOff" },
    ];
  }
  const started: K8sEvent[] = [
    ...base,
    { type: "Normal", reason: "Pulled", age: a, from: "kubelet", message: `Container image "${pod.spec.image}" already present on machine` },
    { type: "Normal", reason: "Created", age: a, from: "kubelet", message: `Created container ${pod.spec.name}` },
    { type: "Normal", reason: "Started", age: a, from: "kubelet", message: `Started container ${pod.spec.name}` },
  ];
  if (s.phase === "CrashLoopBackOff" || s.phase === "Error") {
    started.push({ type: "Warning", reason: "BackOff", age: "5s", from: "kubelet", message: `Back-off restarting failed container ${pod.spec.name} in pod ${pod.name}` });
  }
  return started;
}

function describePod(state: K8sState, pod: K8sPod): OutputLine[] {
  const s = podStatus(pod, state.tick);
  const lines: string[] = [
    `Name:             ${pod.name}`,
    `Namespace:        ${pod.namespace}`,
    `Node:             ${pod.node ? `${pod.node}/192.168.49.${state.nodes.findIndex((n) => n.name === pod.node) + 2}` : "<none>"}`,
    `Labels:           ${Object.entries(pod.labels).map(([k, v]) => `${k}=${v}`).join("\n                  ") || "<none>"}`,
    `Status:           ${s.phase === "Running" ? "Running" : s.phase === "Pending" || s.phase.includes("Image") ? "Pending" : "Running"}`,
    `IP:               ${pod.node ? pod.ip : ""}`,
    `Controlled By:    ${pod.owner && pod.hash ? `ReplicaSet/${pod.owner}-${pod.hash}` : "<none>"}`,
    "Containers:",
    `  ${pod.spec.name}:`,
    `    Image:          ${pod.spec.image}`,
    `    Port:           ${pod.spec.port}/TCP`,
  ];
  if (pod.node) {
    if (s.phase === "Running") {
      lines.push("    State:          Running", `      Started:      ${age(state.tick - pod.createdTick)} ago`);
    } else if (s.phase === "CrashLoopBackOff" || s.phase === "Error") {
      lines.push(
        "    State:          Waiting",
        "      Reason:       CrashLoopBackOff",
        "    Last State:     Terminated",
        "      Reason:       Error",
        "      Exit Code:    1",
      );
    } else {
      lines.push("    State:          Waiting", `      Reason:       ${s.phase}`);
    }
    lines.push(`    Ready:          ${s.ready ? "True" : "False"}`, `    Restart Count:  ${s.restarts}`);
  }
  if (pod.spec.limits) lines.push("    Limits:", `      cpu:     ${cpuText(pod.spec.limits.cpu)}`, `      memory:  ${memText(pod.spec.limits.memory)}`);
  if (pod.spec.requests) lines.push("    Requests:", `      cpu:     ${cpuText(pod.spec.requests.cpu)}`, `      memory:  ${memText(pod.spec.requests.memory)}`);
  if (pod.spec.readinessProbe) lines.push(`    Readiness:      ${pod.spec.readinessProbe}`);
  if (pod.spec.livenessProbe) lines.push(`    Liveness:       ${pod.spec.livenessProbe}`);
  const envEntries = Object.entries(pod.spec.env);
  lines.push("    Environment:" + (envEntries.length ? "" : "    <none>"), ...envEntries.map(([k, v]) => `      ${k}:  ${v}`));
  lines.push("Conditions:", "  Type              Status", `  PodScheduled      ${pod.node ? "True" : "False"}`);
  if (pod.node) lines.push(`  Ready             ${s.ready ? "True" : "False"}`);
  lines.push("Events:");
  const events = podEvents(state, pod);
  lines.push(...formatTable(["  Type", "Reason", "Age", "From", "Message"], events.map((e) => [`  ${e.type}`, e.reason, e.age, e.from, e.message])));
  return lines.map((l) => (/Warning/.test(l) ? { text: l, tone: "warning" as const } : out(l)));
}

function cmdDescribe(state: K8sState, args: string[]): Result {
  const parsed = parseArgs(args, { value: ["n", "namespace"], aliases: { namespace: "n" } });
  const { type, name } = splitTypeName(parsed.positionals[0], parsed.positionals[1]);
  if (!type) return fail(state, [err(`error: the server doesn't have a resource type "${parsed.positionals[0] ?? ""}"`), muted("Try: kubectl describe pod NAME")]);
  switch (type) {
    case "pods": {
      const pods = name ? state.pods.filter((p) => p.name === name || (name.length >= 3 && p.name.startsWith(name))) : state.pods;
      if (pods.length === 0) return fail(state, [err(`Error from server (NotFound): pods "${name}" not found`)], "Pod names include generated suffixes. Copy the exact name from `kubectl get pods`.");
      const pod = pods[0];
      const s = podStatus(pod, state.tick);
      const hints: Record<PodPhase, string> = {
        Running: "The Pod is scheduled, its container is running, and it is Ready. The Events show the normal path: Scheduled → Pulled → Created → Started.",
        Pending: "The Pod is Pending: the scheduler could not find a node with enough free resources for its requests. Read the FailedScheduling event, then lower the requests (or add capacity).",
        ErrImagePull: "The kubelet failed to pull the image. Check the image name and tag in the Events (typos are common), and whether the registry needs credentials.",
        ImagePullBackOff: "ImagePullBackOff means pulling failed and Kubernetes is waiting longer between retries. The Failed event shows the real cause. Here, the image name looks wrong.",
        CrashLoopBackOff: `The container starts and then exits with code 1, so Kubernetes keeps restarting it with growing delays. CrashLoopBackOff is the symptom, not the cause. Check \`kubectl logs ${pod.name}\` to see why the app exits.`,
        Error: `The container exited with an error. Check \`kubectl logs ${pod.name}\`.`,
      };
      return done(state, describePod(state, pod), hints[s.phase]);
    }
    case "deployments": {
      const dep = state.deployments.find((d) => d.name === name);
      if (!dep) return fail(state, [err(`Error from server (NotFound): deployments.apps "${name ?? ""}" not found`)]);
      const pods = state.pods.filter((p) => p.owner === dep.name);
      const hash = templateHash(dep);
      const lines = [
        `Name:                   ${dep.name}`,
        `Namespace:              ${dep.namespace}`,
        `Selector:               ${labelText(dep.labels)}`,
        `Replicas:               ${dep.replicas} desired | ${pods.filter((p) => p.hash === hash).length} updated | ${pods.length} total | ${readyCount(state, pods)} available | ${pods.length - readyCount(state, pods)} unavailable`,
        "StrategyType:           RollingUpdate",
        "RollingUpdateStrategy:  25% max unavailable, 25% max surge",
        "Pod Template:",
        `  Labels:  ${labelText(dep.labels)}`,
        `  Containers:`,
        `   ${dep.template.name}:`,
        `    Image:      ${dep.template.image}`,
        `    Port:       ${dep.template.port}/TCP`,
        `    Environment: ${Object.keys(dep.template.env).length ? Object.entries(dep.template.env).map(([k, v]) => `${k}=${v}`).join(", ") : "<none>"}`,
        `NewReplicaSet:          ${dep.name}-${hash} (${pods.filter((p) => p.hash === hash).length}/${pods.filter((p) => p.hash === hash).length} replicas created)`,
        "Events:",
        `  Normal  ScalingReplicaSet  deployment-controller  Scaled up replica set ${dep.name}-${hash} to ${dep.replicas}`,
      ];
      return done(state, lines.map((l) => out(l)), "A Deployment describes desired state: the Pod template and how many replicas. It manages a ReplicaSet per template version, and the ReplicaSet manages the Pods.");
    }
    case "services": {
      const svc = state.services.find((s) => s.name === name);
      if (!svc) return fail(state, [err(`Error from server (NotFound): services "${name ?? ""}" not found`)]);
      const eps = serviceEndpoints(state, svc);
      const lines = [
        `Name:              ${svc.name}`,
        `Namespace:         ${svc.namespace}`,
        `Selector:          ${labelText(svc.selector)}`,
        `Type:              ${svc.type}`,
        `IP:                ${svc.clusterIP}`,
        `Port:              <unset>  ${svc.port}/TCP`,
        `TargetPort:        ${svc.targetPort}/TCP`,
        ...(svc.nodePort ? [`NodePort:          <unset>  ${svc.nodePort}/TCP`] : []),
        `Endpoints:         ${eps.length ? eps.map((p) => `${p.ip}:${svc.targetPort}`).join(",") : "<none>"}`,
        "Events:            <none>",
      ];
      return done(
        state,
        lines.map((l) => out(l)),
        eps.length
          ? `The Service selects Pods labelled ${labelText(svc.selector)} and forwards traffic on port ${svc.port} to targetPort ${svc.targetPort} on ${eps.length} ready Pod(s).`
          : "This Service has no endpoints: no ready Pod matches its selector. Compare the selector with `kubectl get pods --show-labels`.",
      );
    }
    case "nodes": {
      const node = state.nodes.find((n) => n.name === name) ?? (name ? undefined : state.nodes[1]);
      if (!node) return fail(state, [err(`Error from server (NotFound): nodes "${name}" not found`)]);
      const pods = state.pods.filter((p) => p.node === node.name);
      const cpu = pods.reduce((a, p) => a + podRequests(p).cpu, 0);
      const mem = pods.reduce((a, p) => a + podRequests(p).memory, 0);
      const lines = [
        `Name:               ${node.name}`,
        `Roles:              ${node.role === "control-plane" ? "control-plane" : "<none>"}`,
        ...(node.role === "control-plane" ? ["Taints:             node-role.kubernetes.io/control-plane:NoSchedule"] : ["Taints:             <none>"]),
        "Conditions:         Ready=True",
        "Allocatable:",
        `  cpu:              ${cpuText(node.cpu)}`,
        `  memory:           ${memText(node.memory)}`,
        `Non-terminated Pods: (${pods.length} in total)`,
        ...pods.map((p) => `  default  ${p.name}  ${cpuText(podRequests(p).cpu)} cpu`),
        "Allocated resources:",
        `  cpu      ${cpuText(cpu)} (${Math.round((cpu / node.cpu) * 100)}%)`,
        `  memory   ${memText(mem)} (${Math.round((mem / node.memory) * 100)}%)`,
      ];
      return done(state, lines.map((l) => out(l)), "Showed the node's capacity and how much is already requested. The scheduler uses requests, not live usage, to decide whether a new Pod fits.");
    }
    default:
      return fail(state, [err(`describe is not simulated for "${type}" here.`)]);
  }
}

function cmdLogs(state: K8sState, args: string[]): Result {
  const parsed = parseArgs(args, { boolean: ["p", "previous", "f", "follow"], value: ["c", "container", "tail", "n", "namespace"], aliases: { previous: "p", follow: "f", container: "c" } });
  const target = parsed.positionals[0];
  if (!target) return fail(state, [err("error: expected 'logs (POD | TYPE/NAME) [CONTAINER_NAME]'.")]);
  let pod: K8sPod | undefined;
  if (target.startsWith("deployment/") || target.startsWith("deploy/")) {
    const depName = target.split("/")[1];
    pod = state.pods.find((p) => p.owner === depName);
    if (!pod) return fail(state, [err(`error: no Pods found for deployment ${depName}`)]);
  } else {
    pod = state.pods.find((p) => p.name === target) ?? (target.length >= 3 ? state.pods.find((p) => p.name.startsWith(target)) : undefined);
  }
  if (!pod) return fail(state, [err(`Error from server (NotFound): pods "${target}" not found`)], "Copy the full Pod name from `kubectl get pods`, or use `kubectl logs deployment/NAME`.");
  const s = podStatus(pod, state.tick);
  const behavior = imageBehavior(pod.spec.image);
  const follow = parsed.flags.f ? [info("(simulated) Following (-f) is not simulated. Showing current logs.")] : [];
  if (s.phase === "Pending") {
    return fail(state, [err(`Error from server (BadRequest): container "${pod.spec.name}" in pod "${pod.name}" is waiting to start: no node assigned`)], "There are no logs because the container never started. The Pod is not even scheduled yet. Use `kubectl describe pod` to see why.");
  }
  if (s.phase === "ImagePullBackOff" || s.phase === "ErrImagePull") {
    return fail(state, [err(`Error from server (BadRequest): container "${pod.spec.name}" in pod "${pod.name}" is waiting to start: trying and failing to pull image`)], "The container never started because its image could not be pulled, so there are no app logs. The answer is in `kubectl describe pod` Events.");
  }
  if (s.phase === "CrashLoopBackOff" || s.phase === "Error") {
    return done(
      state,
      [...follow, ...(behavior?.crashLogs ?? ["Process exited with code 1"]).map((l) => (l.startsWith("Error") ? err(l) : out(l)))],
      `These are the logs of the most recent attempt${parsed.flags.p ? " (--previous shows the prior, crashed container)" : ""}. The app says DATABASE_URL is not set, so it exits and Kubernetes restarts it, causing CrashLoopBackOff. Fix the configuration (e.g. \`kubectl set env deployment/${pod.owner ?? "api"} DATABASE_URL=postgres://db:5432/app\`).`,
    );
  }
  return done(state, [...follow, ...(behavior?.logs ?? []).map((l) => out(l))], "Showed what the container wrote to stdout/stderr. Logs come from the container runtime on the Pod's node.");
}

function applyObjects(state: K8sState, objects: ManifestObject[]): OutputLine[] {
  const lines: OutputLine[] = [];
  for (const obj of objects) {
    if (obj.kind === "Deployment") lines.push(out(`deployment.apps/${obj.name} ${addDeployment(state, obj)}`));
    else if (obj.kind === "Service") lines.push(out(`service/${obj.name} ${addService(state, obj)}`));
    else if (obj.kind === "ConfigMap") {
      const existing = state.configMaps.find((c) => c.name === obj.name);
      if (existing) existing.data = obj.data;
      else state.configMaps.push({ name: obj.name, namespace: "default", data: obj.data });
      lines.push(out(`configmap/${obj.name} ${existing ? "unchanged" : "created"}`));
    } else if (obj.kind === "Pod") {
      const existing = state.pods.find((p) => p.name === obj.name);
      if (existing) {
        lines.push(out(`pod/${obj.name} unchanged`));
      } else {
        state.seq += 1;
        state.pods.push({
          name: obj.name, namespace: "default", labels: obj.labels, spec: structuredClone(obj.spec), owner: null, hash: null,
          node: schedule(state, obj.spec), createdTick: state.tick, ip: `10.244.1.${(hashString(obj.name) % 200) + 10}`,
        });
        lines.push(out(`pod/${obj.name} created`));
      }
    }
  }
  return lines;
}

function cmdApply(state: K8sState, args: string[]): Result {
  const parsed = parseArgs(args, { value: ["f", "filename", "n"], aliases: { filename: "f" } });
  const file = parsed.flags.f;
  if (typeof file !== "string") return fail(state, [err("error: must specify one of -f and -k")], "`kubectl apply -f FILE` sends the desired state in FILE to the cluster.");
  const files = file === "." ? Object.keys(state.files).filter((f) => f === "deployment.yaml" || f === "service.yaml") : [file];
  const next = clone(state);
  const lines: OutputLine[] = [];
  for (const f of files) {
    const manifest = next.files[f];
    if (!manifest) return fail(state, [err(`error: the path "${f}" does not exist`)], `Available files: ${Object.keys(state.files).join(", ")}. Use \`ls\` to list them and \`cat FILE\` to read one.`);
    lines.push(...applyObjects(next, manifest.objects));
  }
  reconcile(next);
  const kinds = files.flatMap((f) => next.files[f].objects.map((o) => o.kind));
  let explanation = "Sent the manifest to the API server. `apply` is declarative: it creates objects that do not exist and updates ones that do, so running it twice is safe.";
  if (kinds.includes("Deployment")) explanation += " The Deployment controller then created a ReplicaSet, which created the Pods. Check them with `kubectl get pods`.";
  if (kinds.includes("Service")) explanation += " The Service will route to every ready Pod matching its selector.";
  if (kinds.includes("Pod")) explanation += " This is a bare Pod with no controller, so if it is deleted nothing recreates it.";
  return done(next, lines, explanation);
}

function cmdDelete(state: K8sState, args: string[]): Result {
  const parsed = parseArgs(args, { boolean: ["all"], value: ["f", "filename", "l", "n"], aliases: { filename: "f" } });
  const next = clone(state);
  if (typeof parsed.flags.f === "string") {
    const manifest = state.files[parsed.flags.f];
    if (!manifest) return fail(state, [err(`error: the path "${parsed.flags.f}" does not exist`)]);
    const lines: OutputLine[] = [];
    for (const obj of manifest.objects) {
      if (obj.kind === "Deployment") {
        next.deployments = next.deployments.filter((d) => d.name !== obj.name);
        next.pods = next.pods.filter((p) => p.owner !== obj.name);
        lines.push(out(`deployment.apps "${obj.name}" deleted`));
      } else if (obj.kind === "Service") {
        next.services = next.services.filter((s) => s.name !== obj.name);
        lines.push(out(`service "${obj.name}" deleted`));
      } else if (obj.kind === "Pod") {
        next.pods = next.pods.filter((p) => p.name !== obj.name);
        lines.push(out(`pod "${obj.name}" deleted`));
      }
    }
    return done(next, lines, "Deleted the objects defined in the file.");
  }
  const { type, name } = splitTypeName(parsed.positionals[0], parsed.positionals[1]);
  if (!type || !name) return fail(state, [err("error: resource(s) were provided, but no name was specified"), muted("Usage: kubectl delete TYPE NAME")]);
  switch (type) {
    case "pods": {
      const pod = next.pods.find((p) => p.name === name);
      if (!pod) return fail(state, [err(`Error from server (NotFound): pods "${name}" not found`)]);
      next.pods = next.pods.filter((p) => p.name !== name);
      reconcile(next);
      const replacement = pod.owner ? next.pods.find((p) => p.owner === pod.owner && !state.pods.some((q) => q.name === p.name)) : undefined;
      return done(
        next,
        [out(`pod "${name}" deleted`)],
        pod.owner
          ? `Deleted the Pod. Its ReplicaSet saw fewer Pods than desired and immediately created a replacement${replacement ? ` (${replacement.name})` : ""}. This is self-healing. Run \`kubectl get pods\` to see the new name.`
          : "Deleted the bare Pod. Nothing manages it, so nothing recreates it. This is why Pods are usually created by a Deployment.",
      );
    }
    case "deployments": {
      if (!next.deployments.some((d) => d.name === name)) return fail(state, [err(`Error from server (NotFound): deployments.apps "${name}" not found`)]);
      next.deployments = next.deployments.filter((d) => d.name !== name);
      next.pods = next.pods.filter((p) => p.owner !== name);
      return done(next, [out(`deployment.apps "${name}" deleted`)], "Deleted the Deployment. Its ReplicaSets and Pods were removed with it (garbage collection through owner references).");
    }
    case "services": {
      if (!next.services.some((s) => s.name === name)) return fail(state, [err(`Error from server (NotFound): services "${name}" not found`)]);
      next.services = next.services.filter((s) => s.name !== name);
      return done(next, [out(`service "${name}" deleted`)], "Deleted the Service. The Pods keep running, but the stable address is gone.");
    }
    case "configmaps": {
      next.configMaps = next.configMaps.filter((c) => c.name !== name);
      return done(next, [out(`configmap "${name}" deleted`)]);
    }
    default:
      return fail(state, [err(`delete is not simulated for "${type}".`)]);
  }
}

function findDeploymentArg(state: K8sState, positionals: string[]): { dep?: K8sDeployment; name?: string; rest: string[] } {
  const [first, second, ...more] = positionals;
  if (!first) return { rest: [] };
  if (first.includes("/")) {
    const [t, n] = first.split("/");
    if (RESOURCE_ALIASES[t] !== "deployments") return { name: n, rest: [second, ...more].filter(Boolean) };
    return { dep: state.deployments.find((d) => d.name === n), name: n, rest: [second, ...more].filter(Boolean) };
  }
  if (RESOURCE_ALIASES[first] === "deployments") return { dep: state.deployments.find((d) => d.name === second), name: second, rest: more };
  return { name: first, rest: [second, ...more].filter(Boolean) };
}

function cmdScale(state: K8sState, args: string[]): Result {
  const parsed = parseArgs(args, { value: ["replicas", "n"] });
  const { dep, name } = findDeploymentArg(state, parsed.positionals);
  if (typeof parsed.flags.replicas !== "string") return fail(state, [err("error: required flag(s) \"replicas\" not set")], "Use `kubectl scale deployment NAME --replicas=N`.");
  const replicas = Number(parsed.flags.replicas);
  if (!Number.isInteger(replicas) || replicas < 0 || replicas > 20) return fail(state, [err("error: --replicas must be a whole number between 0 and 20 in this simulation")]);
  if (!dep) return fail(state, [err(`Error from server (NotFound): deployments.apps "${name ?? ""}" not found`)]);
  const next = clone(state);
  const nd = next.deployments.find((d) => d.name === dep.name)!;
  const before = nd.replicas;
  nd.replicas = replicas;
  reconcile(next);
  return done(
    next,
    [out(`deployment.apps/${dep.name} scaled`)],
    `Changed the desired replica count from ${before} to ${replicas}. The ReplicaSet ${replicas > before ? "created" : replicas < before ? "removed" : "kept"} Pods to match. This is imperative; in a real project you would also update the manifest so the next apply does not undo it.`,
  );
}

function cmdSet(state: K8sState, args: string[]): Result {
  const [what, ...rest] = args;
  const parsed = parseArgs(rest, { value: ["requests", "limits", "c", "containers"] });
  const { dep, name, rest: extra } = findDeploymentArg(state, parsed.positionals);
  if (!dep) return fail(state, [err(`Error from server (NotFound): deployments.apps "${name ?? ""}" not found`)], "Use the form deployment/NAME, e.g. `kubectl set image deployment/web web=nginx:1.27`.");
  const next = clone(state);
  const nd = next.deployments.find((d) => d.name === dep.name)!;
  switch (what) {
    case "image": {
      const pair = extra[0];
      const [container, image] = pair?.split("=") ?? [];
      if (!container || !image) return fail(state, [err("error: expected CONTAINER=IMAGE, e.g. web=nginx:1.27")]);
      if (container !== nd.template.name) return fail(state, [err(`error: unable to find container named "${container}"`)], `The container in this Deployment is called "${nd.template.name}".`);
      if (nd.template.image === image) return done(state, [out(`deployment.apps/${dep.name} image unchanged`)]);
      nd.template = { ...nd.template, image };
      nd.revision += 1;
      reconcile(next);
      const healthy = templateHealthy(nd.template);
      return done(
        next,
        [out(`deployment.apps/${dep.name} image updated`)],
        healthy
          ? `Changed the Pod template's image to ${image}. That started a rolling update: a new ReplicaSet scaled up while the old one scaled down, so the app stayed available. Check with \`kubectl rollout status deployment/${dep.name}\`.`
          : `Changed the image to ${image}, but the new Pods cannot start. The rollout is stuck while the old Pods keep serving traffic. Undo it with \`kubectl rollout undo deployment/${dep.name}\`.`,
      );
    }
    case "env": {
      const env = { ...nd.template.env };
      for (const pair of extra) {
        if (pair.endsWith("-")) delete env[pair.slice(0, -1)];
        else {
          const [k, ...v] = pair.split("=");
          if (!k || v.length === 0) return fail(state, [err(`error: invalid env pair "${pair}". Use KEY=VALUE.`)]);
          env[k] = v.join("=");
        }
      }
      nd.template = { ...nd.template, env };
      nd.revision += 1;
      reconcile(next);
      return done(next, [out(`deployment.apps/${dep.name} env updated`)], "Changed environment variables in the Pod template. Any template change triggers a rollout, so the Pods were replaced with new ones that have the new configuration.");
    }
    case "resources": {
      const parse = (text: string | true | undefined) => {
        if (typeof text !== "string") return undefined;
        const result: { cpu: number; memory: number } = { cpu: 100, memory: 64 };
        for (const part of text.split(",")) {
          const [k, v] = part.split("=");
          if (k === "cpu") result.cpu = parseCpu(v) ?? result.cpu;
          if (k === "memory") result.memory = parseMemory(v) ?? result.memory;
        }
        return result;
      };
      const requests = parse(parsed.flags.requests);
      const limits = parse(parsed.flags.limits);
      if (!requests && !limits) return fail(state, [err("error: specify --requests=cpu=250m,memory=128Mi and/or --limits=...")]);
      nd.template = { ...nd.template, ...(requests ? { requests } : {}), ...(limits ? { limits } : {}) };
      nd.revision += 1;
      next.pods = next.pods.filter((p) => p.owner !== nd.name || p.hash === templateHash(nd));
      reconcile(next);
      return done(next, [out(`deployment.apps/${dep.name} resource requirements updated`)], "Updated the container's resource requests/limits. Requests drive scheduling, so a smaller request can let a Pending Pod fit onto a node.");
    }
    default:
      return fail(state, [err("Supported: kubectl set image | env | resources deployment/NAME ...")]);
  }
}

function cmdRollout(state: K8sState, args: string[]): Result {
  const [action, ...rest] = args;
  const parsed = parseArgs(rest, { value: ["to-revision"] });
  const { dep, name } = findDeploymentArg(state, parsed.positionals);
  if (!action || !["status", "history", "undo", "restart"].includes(action)) return fail(state, [err("Supported: kubectl rollout status | history | undo | restart deployment/NAME")]);
  if (!dep) return fail(state, [err(`Error from server (NotFound): deployments.apps "${name ?? ""}" not found`)]);
  const next = clone(state);
  const nd = next.deployments.find((d) => d.name === dep.name)!;
  const hash = templateHash(nd);
  switch (action) {
    case "status": {
      const pods = state.pods.filter((p) => p.owner === dep.name);
      const updated = pods.filter((p) => p.hash === hash);
      const healthy = templateHealthy(dep.template);
      if (!healthy) {
        return done(
          state,
          [out(`Waiting for deployment "${dep.name}" rollout to finish: ${updated.filter((p) => podStatus(p, state.tick).ready).length} of ${dep.replicas} updated replicas are available...`), info("(simulated) A real terminal would keep waiting here. Press Ctrl+C to stop.")],
          "The rollout cannot finish because the new Pods never become ready. Investigate with `kubectl get pods` / `describe`, or roll back.",
        );
      }
      return done(state, [out(`deployment "${dep.name}" successfully rolled out`)], "All replicas run the latest Pod template and are available.");
    }
    case "history": {
      const rows = nd.history.map((h) => [String(h.revision), h.image === nd.history[0]?.image && h.revision === 1 ? "<none>" : `image ${h.image}`]);
      return done(state, formatTable(["REVISION", "CHANGE-CAUSE"], rows).map((l) => out(`${l}`)), "Each change to the Pod template creates a new revision (and ReplicaSet). Rollbacks return to one of these.");
    }
    case "undo": {
      const target = typeof parsed.flags["to-revision"] === "string"
        ? nd.history.find((h) => h.revision === Number(parsed.flags["to-revision"]))
        : [...nd.history].reverse().find((h) => h.hash !== hash);
      if (!target) return fail(state, [err(`error: no rollout history found for deployment "${dep.name}"`)], "There is no earlier revision to roll back to.");
      nd.template = structuredClone(target.template);
      nd.revision = Math.max(...nd.history.map((h) => h.revision)) + 1;
      nd.history = nd.history.filter((h) => h.hash !== target.hash);
      reconcile(next);
      return done(next, [out(`deployment.apps/${dep.name} rolled back`)], `Rolled the Pod template back to the earlier version (image ${target.image}). The old ReplicaSet scaled back up and the broken one scaled down. It is recorded as a new revision.`);
    }
    case "restart": {
      nd.template = { ...nd.template, env: { ...nd.template.env, RESTARTED_AT: `t${next.tick}` } };
      delete nd.template.env.RESTARTED_AT;
      next.pods = next.pods.filter((p) => p.owner !== nd.name);
      reconcile(next);
      return done(next, [out(`deployment.apps/${dep.name} restarted`)], "Replaced every Pod with a fresh one, using a rolling update. Useful after changing a ConfigMap the Pods read at startup.");
    }
  }
  return fail(state, []);
}

function cmdCreate(state: K8sState, args: string[]): Result {
  const [kind, ...rest] = args;
  const parsed = parseArgs(rest, { value: ["image", "replicas", "port", "from-literal", "n"], boolean: ["dry-run"] });
  const name = parsed.positionals[0] ?? parsed.positionals[1];
  const next = clone(state);
  switch (kind) {
    case "deployment":
    case "deploy": {
      if (!name || typeof parsed.flags.image !== "string") return fail(state, [err("error: usage: kubectl create deployment NAME --image=IMAGE [--replicas=N]")]);
      if (state.deployments.some((d) => d.name === name)) return fail(state, [err(`Error from server (AlreadyExists): deployments.apps "${name}" already exists`)]);
      const replicas = typeof parsed.flags.replicas === "string" ? Number(parsed.flags.replicas) : 1;
      addDeployment(next, { kind: "Deployment", name, replicas, labels: { app: name }, template: { name, image: parsed.flags.image, port: typeof parsed.flags.port === "string" ? Number(parsed.flags.port) : 80, env: {} } });
      reconcile(next);
      return done(next, [out(`deployment.apps/${name} created`)], `Created a Deployment named ${name} with ${replicas} replica(s) of ${parsed.flags.image}, labelled app=${name}. Quick for experiments; manifests in version control are better for real projects.`);
    }
    case "namespace":
    case "ns": {
      if (!name) return fail(state, [err("error: usage: kubectl create namespace NAME")]);
      if (state.namespaces.includes(name)) return fail(state, [err(`Error from server (AlreadyExists): namespaces "${name}" already exists`)]);
      next.namespaces.push(name);
      return done(next, [out(`namespace/${name} created`)], `Created the namespace "${name}". Use -n ${name} to work inside it. Names only need to be unique within a namespace.`);
    }
    case "configmap":
    case "cm":
    case "secret": {
      const isSecret = kind === "secret";
      const secretName = isSecret ? parsed.positionals[1] : parsed.positionals[0];
      if (!secretName) return fail(state, [err(`error: usage: kubectl create ${isSecret ? "secret generic" : "configmap"} NAME --from-literal=KEY=VALUE`)]);
      const data: Record<string, string> = {};
      for (const pair of parsed.multi["from-literal"] ?? []) {
        const [k, ...v] = pair.split("=");
        data[k] = isSecret ? btoaSafe(v.join("=")) : v.join("=");
      }
      next.configMaps.push({ name: secretName, namespace: "default", data, secret: isSecret });
      return done(
        next,
        [out(`${isSecret ? "secret" : "configmap"}/${secretName} created`)],
        isSecret
          ? "Created a Secret. Its values are stored base64-encoded, which is an encoding, not encryption. Protect Secrets with RBAC and enable encryption at rest in the cluster."
          : "Created a ConfigMap holding non-secret configuration.",
      );
    }
    default:
      return fail(state, [err("Supported: kubectl create deployment | namespace | configmap | secret generic")]);
  }
}

function btoaSafe(text: string): string {
  try {
    return btoa(text);
  } catch {
    return text;
  }
}

function cmdExpose(state: K8sState, args: string[]): Result {
  const parsed = parseArgs(args, { value: ["port", "target-port", "type", "name"] });
  const { dep, name } = findDeploymentArg(state, parsed.positionals);
  if (!dep) return fail(state, [err(`Error from server (NotFound): deployments.apps "${name ?? ""}" not found`)], "Use `kubectl expose deployment NAME --port=80`.");
  if (typeof parsed.flags.port !== "string") return fail(state, [err("error: couldn't find port via --port flag or introspection")]);
  const type = typeof parsed.flags.type === "string" ? parsed.flags.type : "ClusterIP";
  if (!["ClusterIP", "NodePort", "LoadBalancer"].includes(type)) return fail(state, [err(`error: invalid Service type "${type}"`)]);
  const svcName = typeof parsed.flags.name === "string" ? parsed.flags.name : dep.name;
  if (state.services.some((s) => s.name === svcName)) return fail(state, [err(`Error from server (AlreadyExists): services "${svcName}" already exists`)]);
  const next = clone(state);
  const port = Number(parsed.flags.port);
  const targetPort = typeof parsed.flags["target-port"] === "string" ? Number(parsed.flags["target-port"]) : dep.template.port;
  addService(next, { kind: "Service", name: svcName, type: type as K8sService["type"], selector: dep.labels, port, targetPort });
  const svc = next.services.find((s) => s.name === svcName)!;
  const typeText: Record<string, string> = {
    ClusterIP: "ClusterIP makes it reachable only inside the cluster.",
    NodePort: `NodePort also opens port ${svc.nodePort} on every node.`,
    LoadBalancer: "LoadBalancer asks the cloud provider for an external load balancer (EXTERNAL-IP stays <pending> without one).",
  };
  return done(next, [out(`service/${svcName} exposed`)], `Created a ${type} Service selecting ${labelText(dep.labels)}, forwarding port ${port} to targetPort ${targetPort} on matching Pods. ${typeText[type]}`);
}

const K8S_HELP = [
  "Supported simulated kubectl commands:",
  "  kubectl get pods|deployments|replicasets|services|endpoints|nodes|namespaces|configmaps|secrets|events|all",
  "      [-o wide] [-l key=value] [--show-labels] [-n NAMESPACE | -A]",
  "  kubectl describe pod|deployment|service|node NAME",
  "  kubectl logs POD [--previous] | kubectl logs deployment/NAME",
  "  kubectl apply -f FILE | kubectl delete pod|deployment|service NAME | kubectl delete -f FILE",
  "  kubectl create deployment NAME --image=IMAGE | create namespace NAME | create configmap/secret generic ...",
  "  kubectl expose deployment NAME --port=80 [--type=NodePort]",
  "  kubectl scale deployment NAME --replicas=N",
  "  kubectl set image|env|resources deployment/NAME ...",
  "  kubectl rollout status|history|undo|restart deployment/NAME",
  "Shell helpers: ls, cat FILE, clear, help",
];

export function runKubernetesCommand(input: string, state: K8sState): Result {
  const text = normalizeCommand(input);
  const tokenized = tokenize(text);
  if (!tokenized.ok) return fail(state, [err(`syntax error: ${tokenized.error}`)]);
  let tokens = tokenized.tokens;
  if (tokens.length === 0) return done(state, []);
  if (tokens[0] === "k") tokens = ["kubectl", ...tokens.slice(1)];

  const ticked: K8sState = { ...state, tick: state.tick + 1 };
  const [prog, sub, ...args] = tokens;

  if (prog !== "kubectl") {
    switch (prog) {
      case "help":
        return done(state, K8S_HELP.map((l) => out(l)), "Listed the commands this simulator understands.");
      case "ls":
        return done(state, [out(Object.keys(state.files).join("  "))], "Listed the manifest files in the current folder.");
      case "cat": {
        const f = args.length ? undefined : sub;
        const file = f ? state.files[f] : undefined;
        if (!file) return fail(state, [err(`cat: ${sub ?? ""}: No such file or directory`)], `Files: ${Object.keys(state.files).join(", ")}`);
        return done(state, file.content.split("\n").map((l) => out(l)), "Printed the manifest. apiVersion and kind say what object this is, metadata names it, and spec describes the desired state.");
      }
      case "docker":
        return fail(state, [err("docker: this terminal is in Kubernetes mode.")], "Switch the terminal to Docker mode to use docker commands.");
      default:
        return fail(state, [err(`${prog}: command not found (simulated terminal)`)], "This simulated terminal understands kubectl and a few shell helpers. Type `help`.");
    }
  }

  switch (sub) {
    case undefined:
    case "help":
    case "--help":
      return done(state, K8S_HELP.map((l) => out(l)), "Listed the commands this simulator understands.");
    case "version":
      return done(state, [out("Client Version: v1.31.2 (simulated)"), out("Server Version: v1.31.2 (simulated cluster in your browser)")]);
    case "cluster-info":
      return done(state, [out("Kubernetes control plane is running at https://127.0.0.1:6443 (simulated)"), out("CoreDNS is running at https://127.0.0.1:6443/api/v1/namespaces/kube-system/services/kube-dns:dns/proxy")], "kubectl talks to the API server on the control plane. Every kubectl command is an API request. Here, that API is simulated.");
    case "config":
      return done(state, [out("simulated-cluster")], "Showed the current context: which cluster and user kubectl talks to.");
    case "get":
      return cmdGet(ticked, args);
    case "describe":
      return cmdDescribe(ticked, args);
    case "logs":
      return cmdLogs(ticked, args);
    case "apply":
      return cmdApply(ticked, args);
    case "delete":
      return cmdDelete(ticked, args);
    case "scale":
      return cmdScale(ticked, args);
    case "set":
      return cmdSet(ticked, args);
    case "rollout":
      return cmdRollout(ticked, args);
    case "create":
      return cmdCreate(ticked, args);
    case "expose":
      return cmdExpose(ticked, args);
    case "run": {
      const parsed = parseArgs(args, { value: ["image", "port"] });
      const name = parsed.positionals[0];
      if (!name || typeof parsed.flags.image !== "string") return fail(state, [err("error: usage: kubectl run NAME --image=IMAGE")]);
      const next = clone(ticked);
      applyObjects(next, [{ kind: "Pod", name, labels: { run: name }, spec: { name, image: parsed.flags.image, port: 80, env: {} } }]);
      return done(next, [out(`pod/${name} created`)], "Created a single bare Pod. Handy for quick experiments, but nothing will recreate it if it dies. Use a Deployment for real workloads.");
    }
    case "exec":
      return fail(state, [info("(simulated) kubectl exec is not simulated in this cluster.")], "`kubectl exec -it POD -- sh` runs a command inside a running container, similar to `docker exec`.");
    case "port-forward":
      return fail(state, [info("(simulated) Port forwarding is not simulated.")], "`kubectl port-forward svc/web 8080:80` tunnels a local port to a Service or Pod for debugging.");
    case "top":
      return fail(state, [info("(simulated) Metrics are not simulated.")], "`kubectl top pods` needs the metrics-server add-on and shows live CPU/memory usage.");
    default:
      return fail(state, [err(`error: unknown command "${sub}" for "kubectl"`), muted("Type `help` to see supported commands.")]);
  }
}
