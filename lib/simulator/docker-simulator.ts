import { hashString } from "@/lib/utils";
import { formatTable, normalizeCommand, parseArgs, tokenize } from "./command-parser";
import { type CommandResult, type OutputLine, err, info, muted, out } from "./types";

/* ------------------------------------------------------------------ */
/* State model                                                         */
/* ------------------------------------------------------------------ */

export interface DockerImage {
  repository: string;
  tag: string;
  id: string;
  size: string;
  createdLabel: string;
  command: string;
  exposes: number[];
  behavior: "server" | "exit";
  logs: string[];
  requiredEnv?: { name: string; errorLogs: string[] };
  workdir: string;
  files: string[];
}

export interface PortMapping {
  host: number;
  container: number;
  hostIp: string;
}

export interface Mount {
  type: "volume" | "bind";
  source: string;
  target: string;
  readOnly: boolean;
}

export interface DockerContainer {
  id: string;
  name: string;
  image: string;
  command: string;
  status: "created" | "running" | "exited";
  exitCode: number;
  ports: PortMapping[];
  env: Record<string, string>;
  mounts: Mount[];
  network: string;
  createdTick: number;
  statusTick: number;
  logs: string[];
  layerFiles: string[];
  autoRemove: boolean;
  composeProject?: string;
}

export interface DockerVolume {
  name: string;
  files: string[];
}

export interface ComposeService {
  name: string;
  image: string;
  build?: boolean;
  ports?: { host: number; container: number }[];
  env?: Record<string, string>;
  volumes?: { source: string; target: string }[];
}

export interface ComposeProject {
  name: string;
  services: ComposeService[];
}

export interface DockerState {
  images: DockerImage[];
  containers: DockerContainer[];
  volumes: DockerVolume[];
  networks: string[];
  files: Record<string, string>;
  compose?: ComposeProject;
  builtOnce: string[];
  tick: number;
  seq: number;
}

/* ------------------------------------------------------------------ */
/* Image catalog (what the simulated registry can "serve")             */
/* ------------------------------------------------------------------ */

interface CatalogImage {
  tags: string[];
  size: string;
  command: string;
  exposes: number[];
  behavior: "server" | "exit";
  logs: string[];
  requiredEnv?: { name: string; errorLogs: string[] };
  workdir?: string;
  files?: string[];
}

const NGINX_LOGS = [
  "/docker-entrypoint.sh: Configuration complete; ready for start up",
  "2025/01/01 10:00:00 [notice] 1#1: using the \"epoll\" event method",
  "2025/01/01 10:00:00 [notice] 1#1: nginx/1.27.2",
  "2025/01/01 10:00:00 [notice] 1#1: start worker processes",
];

const CATALOG: Record<string, CatalogImage> = {
  nginx: {
    tags: ["latest", "1.27", "alpine"],
    size: "192MB",
    command: "/docker-entrypoint.sh nginx -g 'daemon off;'",
    exposes: [80],
    behavior: "server",
    logs: NGINX_LOGS,
    workdir: "/",
    files: ["bin", "dev", "docker-entrypoint.d", "etc", "home", "lib", "proc", "root", "run", "srv", "sys", "tmp", "usr", "var"],
  },
  httpd: {
    tags: ["latest", "2.4"],
    size: "148MB",
    command: "httpd-foreground",
    exposes: [80],
    behavior: "server",
    logs: ["AH00558: httpd: Could not reliably determine the server's fully qualified domain name", "Apache/2.4.62 (Unix) configured -- resuming normal operations"],
  },
  redis: {
    tags: ["latest", "7"],
    size: "117MB",
    command: "docker-entrypoint.sh redis-server",
    exposes: [6379],
    behavior: "server",
    logs: ["1:C Redis version=7.4.1, bits=64, commit=00000000, modified=0", "1:M Server initialized", "1:M Ready to accept connections tcp"],
    workdir: "/data",
    files: [],
  },
  postgres: {
    tags: ["latest", "16"],
    size: "435MB",
    command: "docker-entrypoint.sh postgres",
    exposes: [5432],
    behavior: "server",
    logs: ["PostgreSQL init process complete; ready for start up.", "LOG:  database system is ready to accept connections"],
    requiredEnv: {
      name: "POSTGRES_PASSWORD",
      errorLogs: [
        "Error: Database is uninitialized and superuser password is not specified.",
        "       You must specify POSTGRES_PASSWORD to a non-empty value for the",
        "       superuser. For example, \"-e POSTGRES_PASSWORD=password\" on \"docker run\".",
      ],
    },
  },
  node: {
    tags: ["latest", "20", "20-alpine"],
    size: "1.1GB",
    command: "docker-entrypoint.sh node",
    exposes: [],
    behavior: "exit",
    logs: [],
  },
  python: {
    tags: ["latest", "3.12", "3.12-slim"],
    size: "1.02GB",
    command: "python3",
    exposes: [],
    behavior: "exit",
    logs: [],
  },
  alpine: {
    tags: ["latest", "3.20"],
    size: "7.8MB",
    command: "/bin/sh",
    exposes: [],
    behavior: "exit",
    logs: [],
  },
  ubuntu: {
    tags: ["latest", "24.04"],
    size: "78.1MB",
    command: "/bin/bash",
    exposes: [],
    behavior: "exit",
    logs: [],
  },
  busybox: {
    tags: ["latest"],
    size: "4.3MB",
    command: "sh",
    exposes: [],
    behavior: "exit",
    logs: [],
  },
  "hello-world": {
    tags: ["latest"],
    size: "13.3kB",
    command: "/hello",
    exposes: [],
    behavior: "exit",
    logs: [
      "Hello from Docker!",
      "This message shows that your installation appears to be working correctly.",
      "(In this app, the whole run is simulated.)",
    ],
  },
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function hex(seed: string, length: number): string {
  let result = "";
  let n = 0;
  while (result.length < length) {
    result += hashString(`${seed}:${n++}`).toString(16).padStart(8, "0");
  }
  return result.slice(0, length);
}

export function parseImageRef(ref: string): { repository: string; tag: string } {
  let clean = ref.replace(/^docker\.io\//, "").replace(/^library\//, "");
  const at = clean.indexOf("@");
  if (at !== -1) clean = clean.slice(0, at);
  const lastColon = clean.lastIndexOf(":");
  const lastSlash = clean.lastIndexOf("/");
  if (lastColon > lastSlash) {
    return { repository: clean.slice(0, lastColon), tag: clean.slice(lastColon + 1) || "latest" };
  }
  return { repository: clean, tag: "latest" };
}

const refOf = (img: { repository: string; tag: string }) => `${img.repository}:${img.tag}`;

function findImage(state: DockerState, ref: string): DockerImage | undefined {
  const { repository, tag } = parseImageRef(ref);
  return (
    state.images.find((i) => i.repository === repository && i.tag === tag) ??
    (ref.length >= 4 ? state.images.find((i) => i.id.startsWith(ref)) : undefined)
  );
}

function findContainer(state: DockerState, key: string): DockerContainer | undefined {
  return (
    state.containers.find((c) => c.name === key) ??
    (key.length >= 3 ? state.containers.find((c) => c.id.startsWith(key)) : undefined)
  );
}

function catalogImage(repository: string, tag: string): DockerImage | null {
  const def = CATALOG[repository];
  if (!def || !def.tags.includes(tag)) return null;
  return {
    repository,
    tag,
    id: hex(`${repository}:${tag}`, 12),
    size: def.size,
    createdLabel: "2 weeks ago",
    command: def.command,
    exposes: def.exposes,
    behavior: def.behavior,
    logs: def.logs,
    requiredEnv: def.requiredEnv,
    workdir: def.workdir ?? "/",
    files: def.files ?? ["bin", "dev", "etc", "home", "lib", "proc", "root", "run", "sys", "tmp", "usr", "var"],
  };
}

function seconds(ticks: number) {
  return ticks * 6 + 3;
}

function durationLabel(ticks: number): string {
  const s = seconds(ticks);
  if (s < 60) return `${s} seconds`;
  if (s < 120) return "About a minute";
  return `${Math.floor(s / 60)} minutes`;
}

function agoLabel(ticks: number): string {
  const d = durationLabel(ticks);
  return d === "About a minute" ? "About a minute ago" : `${d} ago`;
}

function statusLabel(c: DockerContainer, tick: number): string {
  if (c.status === "running") return `Up ${durationLabel(tick - c.statusTick)}`;
  if (c.status === "created") return "Created";
  return `Exited (${c.exitCode}) ${agoLabel(tick - c.statusTick)}`;
}

function portsLabel(c: DockerContainer, state: DockerState): string {
  if (c.status !== "running") return "";
  const img = findImage(state, c.image);
  const published = c.ports.map((p) => `${p.hostIp}:${p.host}->${p.container}/tcp`);
  const unpublished = (img?.exposes ?? [])
    .filter((port) => !c.ports.some((p) => p.container === port))
    .map((port) => `${port}/tcp`);
  return [...published, ...unpublished].join(", ");
}

function shortCommand(cmd: string): string {
  const text = cmd.length > 20 ? `${cmd.slice(0, 19)}…` : cmd;
  return `"${text}"`;
}

const ADJECTIVES = ["brave", "calm", "eager", "fervent", "gifted", "happy", "jolly", "keen", "lucid", "quirky"];
const SCIENTISTS = ["hopper", "lovelace", "turing", "curie", "noether", "ritchie", "torvalds", "hamilton", "babbage", "franklin"];

function autoName(seq: number): string {
  return `${ADJECTIVES[seq % ADJECTIVES.length]}_${SCIENTISTS[Math.floor(seq / ADJECTIVES.length) % SCIENTISTS.length]}`;
}

function clone(state: DockerState): DockerState {
  return structuredClone(state);
}

const NAME_RE = /^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/;

/* ------------------------------------------------------------------ */
/* Scenarios                                                           */
/* ------------------------------------------------------------------ */

const DEMO_DOCKERFILE = `FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]`;

const DEMO_SERVER = `const http = require("http");
const port = process.env.PORT || 3000;
http
  .createServer((req, res) => res.end("Hello from demo-app!"))
  .listen(port, () => console.log("Server listening on port " + port));`;

const DEMO_PACKAGE = `{
  "name": "demo-app",
  "version": "1.0.0",
  "main": "server.js"
}`;

const DEMO_DOCKERIGNORE = `node_modules
.git
*.log
.env`;

const COMPOSE_FILE = `services:
  web:
    build: .
    ports:
      - "8080:3000"
    environment:
      REDIS_HOST: cache
    depends_on:
      - cache
  cache:
    image: redis:7
    volumes:
      - cache-data:/data

volumes:
  cache-data:`;

function makeContainer(
  state: DockerState,
  opts: Partial<DockerContainer> & { name: string; image: string },
): DockerContainer {
  const img = findImage(state, opts.image);
  state.seq += 1;
  return {
    id: hex(`${opts.name}-${state.seq}`, 64),
    command: img?.command ?? "",
    status: "running",
    exitCode: 0,
    ports: [],
    env: {},
    mounts: [],
    network: "bridge",
    createdTick: state.tick,
    statusTick: state.tick,
    logs: img?.logs ?? [],
    layerFiles: [],
    autoRemove: false,
    ...opts,
  };
}

function baseState(): DockerState {
  return {
    images: [],
    containers: [],
    volumes: [],
    networks: ["bridge", "host", "none"],
    files: {},
    builtOnce: [],
    tick: 0,
    seq: 0,
  };
}

export function createDockerState(scenario: string = "docker-empty"): DockerState {
  const state = baseState();
  const add = (ref: string) => {
    const { repository, tag } = parseImageRef(ref);
    const img = catalogImage(repository, tag);
    if (img) state.images.push(img);
  };
  switch (scenario) {
    case "docker-with-images":
      add("nginx:latest");
      add("alpine:latest");
      add("redis:7");
      break;
    case "docker-mixed": {
      add("nginx:latest");
      add("redis:7");
      add("node:20");
      add("alpine:latest");
      state.tick = 20;
      state.containers.push(
        makeContainer(state, {
          name: "shop-frontend",
          image: "nginx:latest",
          ports: [{ host: 8080, container: 80, hostIp: "0.0.0.0" }],
          createdTick: 2,
          statusTick: 2,
        }),
        makeContainer(state, { name: "cache", image: "redis:7", createdTick: 5, statusTick: 5 }),
        makeContainer(state, {
          name: "report-job",
          image: "alpine:latest",
          status: "exited",
          exitCode: 0,
          command: "sh -c 'echo report done'",
          logs: ["report done"],
          createdTick: 1,
          statusTick: 3,
        }),
        makeContainer(state, {
          name: "legacy-api",
          image: "node:20",
          status: "exited",
          exitCode: 1,
          command: "node index.js",
          logs: ["Error: Cannot find module '/index.js'", "    at Module._resolveFilename (node:internal/modules/cjs/loader:1145:15)"],
          createdTick: 4,
          statusTick: 6,
        }),
      );
      break;
    }
    case "docker-build":
      state.files = {
        Dockerfile: DEMO_DOCKERFILE,
        ".dockerignore": DEMO_DOCKERIGNORE,
        "package.json": DEMO_PACKAGE,
        "server.js": DEMO_SERVER,
      };
      break;
    case "docker-compose":
      state.files = {
        "compose.yaml": COMPOSE_FILE,
        Dockerfile: DEMO_DOCKERFILE,
        "package.json": DEMO_PACKAGE,
        "server.js": DEMO_SERVER,
      };
      state.compose = {
        name: "shop",
        services: [
          { name: "web", image: "shop-web:latest", build: true, ports: [{ host: 8080, container: 3000 }], env: { REDIS_HOST: "cache" } },
          { name: "cache", image: "redis:7", volumes: [{ source: "cache-data", target: "/data" }] },
        ],
      };
      break;
    default:
      break;
  }
  return state;
}

export const DOCKER_SCENARIOS = [
  { id: "docker-empty", label: "Fresh machine", description: "No images or containers yet." },
  { id: "docker-with-images", label: "Some images pulled", description: "nginx, alpine, and redis are already local." },
  { id: "docker-mixed", label: "Busy machine", description: "A mix of running and stopped containers." },
  { id: "docker-build", label: "App with a Dockerfile", description: "A small Node.js app ready to build." },
  { id: "docker-compose", label: "Compose project", description: "A web app and Redis described in compose.yaml." },
] as const;

/* ------------------------------------------------------------------ */
/* Command implementation                                              */
/* ------------------------------------------------------------------ */

type Result = CommandResult<DockerState>;

const fail = (state: DockerState, lines: OutputLine[], explanation?: string): Result => ({
  state,
  lines,
  explanation,
  ok: false,
});

const done = (state: DockerState, lines: OutputLine[], explanation?: string): Result => ({
  state,
  lines,
  explanation,
  ok: true,
});

function pullImage(state: DockerState, ref: string): { ok: boolean; lines: OutputLine[]; image?: DockerImage } {
  const { repository, tag } = parseImageRef(ref);
  const existing = findImage(state, `${repository}:${tag}`);
  const path = repository.includes("/") ? repository : `library/${repository}`;
  if (existing) {
    return {
      ok: true,
      image: existing,
      lines: [
        out(`${tag}: Pulling from ${path}`),
        out(`Digest: sha256:${hex(`${repository}:${tag}:digest`, 64)}`),
        out(`Status: Image is up to date for ${repository}:${tag}`),
      ],
    };
  }
  const img = catalogImage(repository, tag);
  if (!img) {
    if (CATALOG[repository]) {
      return {
        ok: false,
        lines: [err(`Error response from daemon: manifest for ${repository}:${tag} not found: manifest unknown: manifest unknown`)],
      };
    }
    return {
      ok: false,
      lines: [
        err(`Error response from daemon: pull access denied for ${repository}, repository does not exist or may require 'docker login'`),
      ],
    };
  }
  state.images.push(img);
  const layers = [hex(`${ref}-l1`, 12), hex(`${ref}-l2`, 12), hex(`${ref}-l3`, 12)];
  return {
    ok: true,
    image: img,
    lines: [
      out(`${tag}: Pulling from ${path}`),
      ...layers.map((l) => out(`${l}: Pull complete`)),
      out(`Digest: sha256:${hex(`${repository}:${tag}:digest`, 64)}`),
      out(`Status: Downloaded newer image for ${repository}:${tag}`),
      out(`docker.io/${path}:${tag}`),
    ],
  };
}

function cmdImages(state: DockerState, args: string[]): Result {
  const parsed = parseArgs(args, { boolean: ["q", "quiet", "a", "all"], aliases: { quiet: "q", all: "a" } });
  if (parsed.flags.q) return done(state, state.images.map((i) => out(i.id)));
  if (state.images.length === 0) {
    return done(
      state,
      formatTable(["REPOSITORY", "TAG", "IMAGE ID", "CREATED", "SIZE"], []).map((l) => out(l)),
      "Listed local images. There are none yet. Try `docker pull nginx` to download one from a registry.",
    );
  }
  const rows = state.images.map((i) => [i.repository, i.tag, i.id, i.createdLabel, i.size]);
  return done(
    state,
    formatTable(["REPOSITORY", "TAG", "IMAGE ID", "CREATED", "SIZE"], rows).map((l) => out(l)),
    `Listed the ${state.images.length} image(s) stored locally. Images are read-only templates; listing them does not start anything.`,
  );
}

function cmdPull(state: DockerState, args: string[]): Result {
  const parsed = parseArgs(args, { boolean: ["q", "quiet", "a"] });
  const ref = parsed.positionals[0];
  if (!ref) return fail(state, [err('"docker pull" requires exactly 1 argument.'), muted("Usage:  docker pull [OPTIONS] NAME[:TAG]")]);
  const { repository, tag } = parseImageRef(ref);
  const result = pullImage(state, ref);
  if (!result.ok) {
    return fail(
      state,
      result.lines,
      CATALOG[repository]
        ? `The repository "${repository}" exists, but the tag "${tag}" does not. Check the tag. Known tags in this simulation: ${CATALOG[repository].tags.join(", ")}.`
        : `The registry has no image named "${repository}". Check the spelling. This simulation knows: ${Object.keys(CATALOG).join(", ")}.`,
    );
  }
  return done(
    state,
    result.lines,
    `Downloaded ${repository}:${tag} from the Docker Hub registry (simulated). ${
      ref.includes(":") ? "" : "No tag was given, so Docker used the default tag `latest`. "
    }The image is now stored locally and can be used to create containers.`,
  );
}

function parsePort(spec: string, seq: number): PortMapping | null {
  const clean = spec.replace(/\/(tcp|udp)$/, "");
  const parts = clean.split(":");
  const toNum = (s: string) => (/^\d+$/.test(s) ? Number(s) : NaN);
  if (parts.length === 1) {
    const c = toNum(parts[0]);
    return Number.isNaN(c) ? null : { hostIp: "0.0.0.0", host: 32768 + (seq % 1000), container: c };
  }
  if (parts.length === 2) {
    const h = toNum(parts[0]);
    const c = toNum(parts[1]);
    return Number.isNaN(h) || Number.isNaN(c) ? null : { hostIp: "0.0.0.0", host: h, container: c };
  }
  if (parts.length === 3) {
    const h = toNum(parts[1]);
    const c = toNum(parts[2]);
    return Number.isNaN(h) || Number.isNaN(c) ? null : { hostIp: parts[0] || "0.0.0.0", host: h, container: c };
  }
  return null;
}

function parseMount(spec: string): Mount | null {
  const parts = spec.split(":");
  if (parts.length < 2) return null;
  const readOnly = parts[2] === "ro";
  const [source, target] = parts;
  if (!target.startsWith("/")) return null;
  const isBind = source.startsWith("/") || source.startsWith(".") || source.startsWith("~") || source.startsWith("$");
  return { type: isBind ? "bind" : "volume", source, target, readOnly };
}

function portConflict(state: DockerState, ports: PortMapping[], ignoreId?: string): PortMapping | undefined {
  return ports.find((p) =>
    state.containers.some((c) => c.id !== ignoreId && c.status === "running" && c.ports.some((q) => q.host === p.host)),
  );
}

function cmdRun(state: DockerState, args: string[]): Result {
  const parsed = parseArgs(args, {
    boolean: ["d", "i", "t", "rm"],
    value: ["name", "p", "e", "v", "network", "w", "restart", "entrypoint", "env-file", "user", "u", "hostname"],
    aliases: { detach: "d", publish: "p", env: "e", volume: "v", interactive: "i", tty: "t", workdir: "w", net: "network" },
    stopAtFirstPositional: true,
  });
  if (parsed.unknown.length) return fail(state, [err(`unknown flag: ${parsed.unknown[0]}`), muted("See 'docker run --help'.")]);
  if (parsed.missingValue.length)
    return fail(state, [err(`flag needs an argument: ${parsed.missingValue[0]}`), muted("See 'docker run --help'.")]);
  const ref = parsed.positionals[0];
  if (!ref) return fail(state, [err("docker: 'docker run' requires at least 1 argument."), muted("Usage:  docker run [OPTIONS] IMAGE [COMMAND] [ARG...]")]);

  const detached = parsed.flags.d === true;
  const name = typeof parsed.flags.name === "string" ? parsed.flags.name : autoName(state.seq);
  if (!NAME_RE.test(name)) return fail(state, [err(`docker: Error response from daemon: Invalid container name (${name}).`)]);
  const conflict = state.containers.find((c) => c.name === name);
  if (conflict) {
    return fail(
      state,
      [
        err(
          `docker: Error response from daemon: Conflict. The container name "/${name}" is already in use by container "${conflict.id}". You have to remove (or rename) that container to be able to reuse that name.`,
        ),
      ],
      `Container names must be unique. A container named "${name}" already exists (status: ${conflict.status}). Remove it with \`docker rm ${name}\` (add -f if it is running), or pick a different --name.`,
    );
  }

  const ports: PortMapping[] = [];
  for (const spec of parsed.multi.p ?? []) {
    const p = parsePort(spec, state.seq + ports.length);
    if (!p) return fail(state, [err(`docker: invalid publish spec "${spec}". Expected HOST:CONTAINER, for example 8080:80.`)]);
    ports.push(p);
  }
  const env: Record<string, string> = {};
  for (const e of parsed.multi.e ?? []) {
    const [k, ...v] = e.split("=");
    if (k) env[k] = v.join("=");
  }
  const mounts: Mount[] = [];
  for (const spec of parsed.multi.v ?? []) {
    const m = parseMount(spec);
    if (!m) return fail(state, [err(`docker: invalid volume spec "${spec}". Expected NAME:/container/path or /host/path:/container/path.`)]);
    mounts.push(m);
  }
  const network = typeof parsed.flags.network === "string" ? parsed.flags.network : "bridge";
  if (!state.networks.includes(network)) {
    return fail(state, [err(`docker: Error response from daemon: network ${network} not found.`)], `Create the network first with \`docker network create ${network}\`.`);
  }

  const next = clone(state);
  const lines: OutputLine[] = [];
  let image = findImage(next, ref);
  if (!image) {
    const { repository, tag } = parseImageRef(ref);
    lines.push(out(`Unable to find image '${repository}:${tag}' locally`));
    const pulled = pullImage(next, ref);
    lines.push(...pulled.lines);
    if (!pulled.ok || !pulled.image) {
      lines.push(muted("See 'docker run --help'."));
      return fail(state, lines, "Docker could not find the image locally or in the registry, so no container was created. Check the image name and tag.");
    }
    image = pulled.image;
  }

  // Auto-create named volumes, as Docker does.
  for (const m of mounts) {
    if (m.type === "volume" && !next.volumes.some((v) => v.name === m.source)) next.volumes.push({ name: m.source, files: [] });
  }

  const userCommand = parsed.rest;
  const container = makeContainer(next, {
    name,
    image: refOf(image),
    command: userCommand.length ? userCommand.join(" ") : image.command,
    ports,
    env,
    mounts,
    network,
    autoRemove: parsed.flags.rm === true,
    logs: [],
  });
  const explanationParts: string[] = [
    `Created a container named "${name}" from the image ${refOf(image)}`,
  ];

  // Decide how the simulated process behaves.
  const interactive = parsed.flags.i === true || parsed.flags.t === true;
  const first = userCommand[0];
  if (first === "echo") {
    container.status = "exited";
    container.logs = [userCommand.slice(1).join(" ")];
  } else if (first === "sleep") {
    container.status = "running";
  } else if (first && ["sh", "bash", "/bin/sh", "/bin/bash"].includes(first)) {
    container.status = "exited";
    if (interactive) lines.push(info("(simulated) Interactive shells are not simulated here. The shell exited straight away."));
  } else if (image.repository === "nginx" && first === "nginx" && userCommand[1] === "-v") {
    container.status = "exited";
    container.logs = ["nginx version: nginx/1.27.2"];
  } else if (first) {
    container.status = "exited";
  } else if (image.requiredEnv && !env[image.requiredEnv.name]) {
    container.status = "exited";
    container.exitCode = 1;
    container.logs = image.requiredEnv.errorLogs;
  } else if (image.behavior === "server") {
    container.status = "running";
    container.logs = image.logs;
  } else {
    container.status = "exited";
    container.logs = image.logs;
    if (interactive && image.command.includes("sh")) {
      lines.push(info("(simulated) Interactive shells are not simulated here. The shell exited straight away."));
    }
  }

  if (container.status === "running") {
    const clash = portConflict(next, ports);
    if (clash) {
      container.status = "created";
      container.logs = [];
      next.containers.push(container);
      lines.push(
        out(container.id),
        err(
          `docker: Error response from daemon: driver failed programming external connectivity on endpoint ${name}: Bind for 0.0.0.0:${clash.host} failed: port is already allocated.`,
        ),
      );
      return fail(
        next,
        lines,
        `Host port ${clash.host} is already used by another running container, so "${name}" was created but could not start. Pick another host port (e.g. -p ${clash.host + 1}:${clash.container}) or stop the other container. Then remove this one with \`docker rm ${name}\`.`,
      );
    }
  }

  next.containers.push(container);
  if (detached) {
    lines.push(out(container.id));
  } else {
    lines.push(...container.logs.map((l) => out(l)));
    if (container.status === "running") {
      lines.push(info("(simulated) Without -d, a real terminal would stay attached to this output until you press Ctrl+C. Here it keeps running in the background."));
    }
  }

  if (container.status === "running") {
    explanationParts.push(detached ? "and started it in the background (-d)." : "and started it.");
  } else if (container.exitCode !== 0) {
    explanationParts.push(`but its main process exited with code ${container.exitCode}. Read why with \`docker logs ${name}\`.`);
  } else {
    explanationParts.push(
      `. Its main process (${container.command}) finished and the container exited. A container only runs as long as its main process.`,
    );
  }
  for (const p of ports) {
    explanationParts.push(`Host port ${p.host} now forwards to port ${p.container} inside the container (-p ${p.host}:${p.container}).`);
    if (image.exposes.length && !image.exposes.includes(p.container)) {
      explanationParts.push(
        `Careful: this image listens on ${image.exposes.join(", ")} inside the container, not on ${p.container}. The mapping order is HOST:CONTAINER.`,
      );
    }
  }
  if (ports.length === 0 && image.exposes.length && container.status === "running") {
    explanationParts.push(
      `No ports were published, so the app on container port ${image.exposes[0]} is not reachable from the host. EXPOSE alone does not publish a port; use -p.`,
    );
  }
  for (const m of mounts) {
    explanationParts.push(
      m.type === "volume"
        ? `The volume "${m.source}" is mounted at ${m.target}. Data written there survives container removal.`
        : `The host path ${m.source} is bind-mounted at ${m.target}.`,
    );
  }
  if (Object.keys(env).length) explanationParts.push(`Environment variables set: ${Object.keys(env).join(", ")}.`);
  if (container.autoRemove && container.status === "exited") {
    next.containers = next.containers.filter((c) => c.id !== container.id);
    explanationParts.push("Because of --rm, the stopped container was removed automatically.");
  }
  return done(next, lines, explanationParts.join(" ").replace(" .", "."));
}

function cmdPs(state: DockerState, args: string[]): Result {
  const parsed = parseArgs(args, { boolean: ["a", "q", "all", "quiet"], aliases: { all: "a", quiet: "q" } });
  const showAll = parsed.flags.a === true;
  const list = state.containers.filter((c) => showAll || c.status === "running");
  if (parsed.flags.q) return done(state, list.map((c) => out(c.id.slice(0, 12))));
  const rows = list.map((c) => [
    c.id.slice(0, 12),
    c.image.replace(/:latest$/, ""),
    shortCommand(c.command),
    agoLabel(state.tick - c.createdTick),
    statusLabel(c, state.tick),
    portsLabel(c, state),
    c.name,
  ]);
  const lines = formatTable(["CONTAINER ID", "IMAGE", "COMMAND", "CREATED", "STATUS", "PORTS", "NAMES"], rows).map((l) => out(l));
  const stopped = state.containers.filter((c) => c.status !== "running").length;
  let explanation = showAll
    ? `Listed all ${list.length} container(s), including stopped ones. "Exited (0)" means the process finished normally; a non-zero code usually means an error.`
    : `Listed ${list.length} running container(s).`;
  if (!showAll && stopped > 0) explanation += ` ${stopped} stopped container(s) are hidden. Add -a to see them.`;
  if (!showAll && list.length === 0) explanation += " Nothing is running right now.";
  return done(state, lines, explanation);
}

function cmdLogs(state: DockerState, args: string[]): Result {
  const parsed = parseArgs(args, { boolean: ["f", "follow", "t", "timestamps"], value: ["tail", "n"], aliases: { follow: "f", n: "tail" } });
  const key = parsed.positionals[0];
  if (!key) return fail(state, [err('"docker logs" requires exactly 1 argument.')]);
  const c = findContainer(state, key);
  if (!c) return fail(state, [err(`Error response from daemon: No such container: ${key}`)], "There is no container with that name or ID. Run `docker ps -a` to see container names.");
  let logs = c.logs;
  if (typeof parsed.flags.tail === "string" && /^\d+$/.test(parsed.flags.tail)) logs = logs.slice(-Number(parsed.flags.tail));
  const lines = logs.map((l) => out(l));
  if (parsed.flags.f) lines.push(info("(simulated) Following new output is not simulated; showing the current log."));
  if (logs.length === 0) lines.push(muted("(no output)"));
  return done(
    state,
    lines,
    `Showed what the container's main process wrote to stdout/stderr. ${
      c.exitCode !== 0 ? "Because this container exited with an error, the last lines usually explain why." : ""
    }`.trim(),
  );
}

function listPath(c: DockerContainer, state: DockerState, path: string): string[] | null {
  const img = findImage(state, c.image);
  const normalized = path.replace(/\/+$/, "") || "/";
  const mount = c.mounts.find((m) => normalized === m.target || normalized.startsWith(`${m.target}/`));
  if (mount) {
    if (mount.type === "volume") return state.volumes.find((v) => v.name === mount.source)?.files ?? [];
    return ["(simulated bind mount: files from the host folder appear here)"];
  }
  const layer = c.layerFiles.filter((f) => f.startsWith(`${normalized}/`)).map((f) => f.slice(normalized.length + 1));
  if (normalized === "/") return [...(img?.files ?? []), ...c.mounts.map((m) => m.target.slice(1).split("/")[0])];
  if (normalized === "/usr/share/nginx/html" && img?.repository === "nginx") return ["50x.html", "index.html", ...layer];
  if (normalized === "/app" && img && img.workdir === "/app") return [...img.files, ...layer];
  if (layer.length) return layer;
  if (normalized === "/tmp" || normalized === "/data" || normalized === "/root") return [];
  return null;
}

function cmdExec(state: DockerState, args: string[]): Result {
  const parsed = parseArgs(args, { boolean: ["i", "t", "d"], value: ["e", "w", "u"], aliases: { interactive: "i", tty: "t" }, stopAtFirstPositional: true });
  const key = parsed.positionals[0];
  const command = parsed.rest;
  if (!key || command.length === 0) return fail(state, [err('"docker exec" requires at least 2 arguments.'), muted("Usage:  docker exec [OPTIONS] CONTAINER COMMAND [ARG...]")]);
  const c = findContainer(state, key);
  if (!c) return fail(state, [err(`Error response from daemon: No such container: ${key}`)]);
  if (c.status !== "running") {
    return fail(
      state,
      [err(`Error response from daemon: container ${c.id} is not running`)],
      `docker exec runs an extra process inside a running container. "${c.name}" is ${c.status}. Start it first with \`docker start ${c.name}\`.`,
    );
  }
  const next = clone(state);
  const nc = findContainer(next, c.name)!;
  const img = findImage(next, nc.image);
  const [prog, ...rest] = command;
  const why = `Ran \`${command.join(" ")}\` as an extra process inside the running container "${c.name}". The container keeps running afterwards.`;
  switch (prog) {
    case "sh":
    case "bash":
    case "/bin/sh":
    case "/bin/bash":
      return done(
        state,
        [info("(simulated) Interactive shells are not simulated. Run single commands instead, e.g. `docker exec web ls /`.")],
        "In a real terminal, `docker exec -it NAME sh` opens a shell inside the container. Type `exit` to leave it; the container keeps running.",
      );
    case "ls": {
      const path = rest.find((r) => !r.startsWith("-")) ?? img?.workdir ?? "/";
      const items = listPath(nc, next, path);
      if (items === null) return fail(state, [err(`ls: ${path}: No such file or directory`)]);
      return done(state, items.length ? [out(items.join("  "))] : [muted("(empty directory)")], why);
    }
    case "touch": {
      const path = rest[0];
      if (!path?.startsWith("/")) return fail(state, [err("touch: use an absolute path, e.g. /data/notes.txt")]);
      const mount = nc.mounts.find((m) => path.startsWith(`${m.target}/`));
      const fileName = mount ? path.slice(mount.target.length + 1) : path;
      if (mount?.readOnly) return fail(state, [err(`touch: ${path}: Read-only file system`)]);
      if (mount?.type === "volume") {
        const vol = next.volumes.find((v) => v.name === mount.source);
        if (vol && !vol.files.includes(fileName)) vol.files.push(fileName);
        return done(next, [], `${why} The file was written to the volume "${mount.source}", so it will outlive this container.`);
      }
      if (!nc.layerFiles.includes(path)) nc.layerFiles.push(path);
      return done(next, [], `${why} The file lives in this container's writable layer. It disappears if the container is removed.`);
    }
    case "cat": {
      const path = rest[0] ?? "";
      if (path === "/usr/share/nginx/html/index.html" && img?.repository === "nginx") {
        return done(state, [out("<!DOCTYPE html>"), out("<html><head><title>Welcome to nginx!</title></head>"), out("<body><h1>Welcome to nginx!</h1></body></html>")], why);
      }
      if (path === "/etc/hostname") return done(state, [out(nc.id.slice(0, 12))], why);
      if (path === "/etc/os-release") return done(state, [out('NAME="Debian GNU/Linux"'), out('VERSION_ID="12"')], why);
      return fail(state, [err(`cat: ${path || "(missing file)"}: No such file or directory (simulated filesystem)`)]);
    }
    case "env":
    case "printenv": {
      const vars = { PATH: "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin", HOSTNAME: nc.id.slice(0, 12), ...nc.env };
      const lines = rest[0] ? [out(vars[rest[0] as keyof typeof vars] ?? "")] : Object.entries(vars).map(([k, v]) => out(`${k}=${v}`));
      return done(state, lines, `${why} These are the environment variables the container's processes can see.`);
    }
    case "echo":
      return done(state, [out(rest.join(" "))], why);
    case "hostname":
      return done(state, [out(nc.id.slice(0, 12))], `${why} By default a container's hostname is its short ID.`);
    case "pwd":
      return done(state, [out(img?.workdir ?? "/")], why);
    case "whoami":
      return done(state, [out("root")], `${why} Many images run as root by default. Production images often switch to a non-root USER.`);
    case "nginx":
      if (img?.repository === "nginx" && rest[0] === "-v") return done(state, [out("nginx version: nginx/1.27.2")], why);
      break;
    case "ps":
      return done(state, [out("PID   USER     COMMAND"), out(`    1 root     ${nc.command}`), out(`   42 root     ps`)], `${why} PID 1 is the container's main process. If it exits, the container stops.`);
    case "ping":
    case "curl":
    case "wget":
      return networkProbe(state, nc, prog, rest, why);
    default:
      break;
  }
  return fail(
    state,
    [err(`OCI runtime exec failed: exec: "${prog}": executable file not found in $PATH (simulated)`)],
    "This simulation supports: ls, cat, touch, env, echo, hostname, pwd, whoami, ps, ping, curl inside containers.",
  );
}

function networkProbe(state: DockerState, from: DockerContainer, prog: string, rest: string[], why: string): Result {
  const targetArg = rest.filter((r) => !r.startsWith("-") && !/^\d+$/.test(r))[0] ?? "";
  const hostMatch = targetArg.replace(/^https?:\/\//, "").split("/")[0];
  const [host, portText] = hostMatch.split(":");
  const target = state.containers.find((c) => c.name === host);
  const sameUserNetwork = target && target.network === from.network && from.network !== "bridge";
  if (!host) return fail(state, [err(`${prog}: missing host`)]);
  if (!target || !sameUserNetwork || target.status !== "running") {
    const reason = !target
      ? `No container named "${host}" exists.`
      : target.status !== "running"
        ? `"${host}" is not running.`
        : from.network === "bridge"
          ? `Both containers are on the default "bridge" network, which does not provide name-based DNS. Put them on a user-defined network (docker network create) to reach each other by name.`
          : `"${host}" is on a different network (${target.network}).`;
    return fail(
      state,
      [err(prog === "ping" ? `ping: bad address '${host}'` : `curl: (6) Could not resolve host: ${host}`)],
      reason,
    );
  }
  if (prog === "ping") {
    return done(
      state,
      [out(`PING ${host} (172.18.0.${(hashString(host) % 200) + 2}): 56 data bytes`), out("64 bytes from 172.18.0.x: seq=0 ttl=64 time=0.081 ms")],
      `${why} Containers on the same user-defined network can find each other by container name through Docker's built-in DNS.`,
    );
  }
  const img = findImage(state, target.image);
  const port = portText ? Number(portText) : 80;
  if (!img?.exposes.includes(port)) return fail(state, [err(`curl: (7) Failed to connect to ${host} port ${port}: Connection refused`)], `Nothing listens on port ${port} in "${host}". Inside a network, use the container port, not the published host port.`);
  return done(state, [out(img.repository === "nginx" ? "<h1>Welcome to nginx!</h1>" : "OK")], `${why} Container-to-container traffic uses the container port directly, with no -p mapping needed.`);
}

function cmdStop(state: DockerState, args: string[], action: "stop" | "kill"): Result {
  const parsed = parseArgs(args, { value: ["t", "time", "s", "signal"] });
  if (parsed.positionals.length === 0) return fail(state, [err(`"docker ${action}" requires at least 1 argument.`)]);
  const next = clone(state);
  const lines: OutputLine[] = [];
  let ok = true;
  for (const key of parsed.positionals) {
    const c = findContainer(next, key);
    if (!c) {
      lines.push(err(`Error response from daemon: No such container: ${key}`));
      ok = false;
      continue;
    }
    if (c.status === "running") {
      c.status = "exited";
      c.exitCode = action === "kill" ? 137 : 0;
      c.statusTick = next.tick;
      if (c.autoRemove) next.containers = next.containers.filter((x) => x.id !== c.id);
    }
    lines.push(out(key));
  }
  return {
    state: next,
    lines,
    ok,
    explanation:
      action === "stop"
        ? "Sent the main process a SIGTERM so it can shut down gracefully (Docker sends SIGKILL if it takes longer than 10 seconds). The container still exists in a stopped state. `docker ps -a` shows it, and `docker start` brings it back."
        : "Sent SIGKILL, which ends the process immediately with no chance to clean up (exit code 137). Prefer `docker stop`.",
  };
}

function cmdStart(state: DockerState, args: string[], restart: boolean): Result {
  const parsed = parseArgs(args, { boolean: ["a", "i"], value: ["t", "time"] });
  if (parsed.positionals.length === 0) return fail(state, [err(`"docker ${restart ? "restart" : "start"}" requires at least 1 argument.`)]);
  const next = clone(state);
  const lines: OutputLine[] = [];
  let ok = true;
  let explanation = restart
    ? "Stopped and then started the container again. It keeps its name, configuration, and writable layer."
    : "Started an existing stopped container again with the same configuration (image, ports, volumes, environment). Nothing was recreated.";
  for (const key of parsed.positionals) {
    const c = findContainer(next, key);
    if (!c) {
      lines.push(err(`Error response from daemon: No such container: ${key}`));
      ok = false;
      continue;
    }
    const img = findImage(next, c.image);
    const clash = portConflict(next, c.ports, c.id);
    if (clash && c.status !== "running") {
      lines.push(err(`Error response from daemon: driver failed programming external connectivity on endpoint ${c.name}: Bind for 0.0.0.0:${clash.host} failed: port is already allocated`));
      ok = false;
      explanation = `Another running container already uses host port ${clash.host}.`;
      continue;
    }
    if (img?.requiredEnv && !c.env[img.requiredEnv.name] && c.command === img.command) {
      c.status = "exited";
      c.exitCode = 1;
      c.statusTick = next.tick;
      c.logs = [...c.logs, ...img.requiredEnv.errorLogs];
      lines.push(out(key));
      explanation = `The container started, but its process exited again immediately with code 1. Starting it again does not fix a configuration problem. Check \`docker logs ${c.name}\`.`;
      continue;
    }
    const keepsRunning = img?.behavior === "server" && c.command === img.command || c.command.startsWith("sleep");
    c.status = keepsRunning ? "running" : "exited";
    c.exitCode = 0;
    c.statusTick = next.tick;
    if (keepsRunning && img) c.logs = [...c.logs, ...img.logs.slice(-1)];
    lines.push(out(key));
    if (!keepsRunning) explanation = "The container started, but its main process finished straight away, so it is stopped again.";
  }
  return { state: next, lines, ok, explanation };
}

function cmdRm(state: DockerState, args: string[]): Result {
  const parsed = parseArgs(args, { boolean: ["f", "force", "v", "volumes"], aliases: { force: "f", volumes: "v" } });
  if (parsed.positionals.length === 0) return fail(state, [err('"docker rm" requires at least 1 argument.')]);
  const next = clone(state);
  const lines: OutputLine[] = [];
  let ok = true;
  let explanation =
    "Removed the container and its writable layer. The image is untouched, and so are any named volumes. Data stored in a volume survives this.";
  for (const key of parsed.positionals) {
    const c = findContainer(next, key);
    if (!c) {
      lines.push(err(`Error response from daemon: No such container: ${key}`));
      ok = false;
      continue;
    }
    if (c.status === "running" && !parsed.flags.f) {
      lines.push(
        err(`Error response from daemon: cannot remove container "/${c.name}": container is running: stop the container before removing or force remove`),
      );
      ok = false;
      explanation = `"${c.name}" is still running. Stop it first with \`docker stop ${c.name}\`, or force-remove it with \`docker rm -f ${c.name}\`.`;
      continue;
    }
    next.containers = next.containers.filter((x) => x.id !== c.id);
    lines.push(out(key));
  }
  return { state: next, lines, ok, explanation };
}

function cmdRmi(state: DockerState, args: string[]): Result {
  const parsed = parseArgs(args, { boolean: ["f", "force"], aliases: { force: "f" } });
  if (parsed.positionals.length === 0) return fail(state, [err('"docker rmi" requires at least 1 argument.')]);
  const next = clone(state);
  const lines: OutputLine[] = [];
  let ok = true;
  for (const key of parsed.positionals) {
    const img = findImage(next, key);
    if (!img) {
      lines.push(err(`Error response from daemon: No such image: ${key}`));
      ok = false;
      continue;
    }
    const user = next.containers.find((c) => c.image === refOf(img));
    if (user && !parsed.flags.f) {
      lines.push(
        err(`Error response from daemon: conflict: unable to remove repository reference "${key}" (must force) - container ${user.id.slice(0, 12)} is using its referenced image ${img.id}`),
      );
      ok = false;
      continue;
    }
    next.images = next.images.filter((i) => i !== img);
    lines.push(out(`Untagged: ${refOf(img)}`), out(`Deleted: sha256:${hex(img.id, 64)}`));
  }
  return {
    state: next,
    lines,
    ok,
    explanation: ok
      ? "Deleted the image from local storage. You can pull or build it again any time."
      : "An image cannot be removed while a container (even a stopped one) was created from it. Remove that container first.",
  };
}

function cmdInspect(state: DockerState, args: string[]): Result {
  const parsed = parseArgs(args, { value: ["f", "format"], aliases: { format: "f" } });
  const key = parsed.positionals[0];
  if (!key) return fail(state, [err('"docker inspect" requires at least 1 argument.')]);
  const c = findContainer(state, key);
  if (c) {
    const json = {
      Id: c.id,
      Name: `/${c.name}`,
      State: { Status: c.status, Running: c.status === "running", ExitCode: c.exitCode },
      Config: { Image: c.image, Cmd: c.command.split(" "), Env: Object.entries(c.env).map(([k, v]) => `${k}=${v}`) },
      HostConfig: {
        PortBindings: Object.fromEntries(c.ports.map((p) => [`${p.container}/tcp`, [{ HostIp: "", HostPort: String(p.host) }]])),
      },
      Mounts: c.mounts.map((m) => ({ Type: m.type, Source: m.source, Destination: m.target, RW: !m.readOnly })),
      NetworkSettings: { Networks: { [c.network]: { IPAddress: `172.17.0.${(hashString(c.name) % 200) + 2}` } } },
    };
    return done(
      state,
      JSON.stringify([json], null, 2).split("\n").map((l) => out(l)),
      "Printed the container's full configuration and state as JSON (shortened in this simulation). Useful for checking ports, mounts, environment, and exit codes.",
    );
  }
  const img = findImage(state, key);
  if (img) {
    const json = {
      Id: `sha256:${hex(img.id, 64)}`,
      RepoTags: [refOf(img)],
      Config: { Cmd: img.command.split(" "), ExposedPorts: Object.fromEntries(img.exposes.map((p) => [`${p}/tcp`, {}])), WorkingDir: img.workdir },
      Size: img.size,
    };
    return done(state, JSON.stringify([json], null, 2).split("\n").map((l) => out(l)), "Printed the image's metadata, including its default command and documented (EXPOSEd) ports.");
  }
  return fail(state, [err(`Error: No such object: ${key}`)]);
}

function cmdPort(state: DockerState, args: string[]): Result {
  const key = args[0];
  if (!key) return fail(state, [err('"docker port" requires at least 1 argument.')]);
  const c = findContainer(state, key);
  if (!c) return fail(state, [err(`Error response from daemon: No such container: ${key}`)]);
  return done(
    state,
    c.ports.length ? c.ports.map((p) => out(`${p.container}/tcp -> ${p.hostIp}:${p.host}`)) : [muted("(no published ports)")],
    "Showed which container ports are published to which host ports.",
  );
}

function cmdVolume(state: DockerState, args: string[]): Result {
  const [sub, ...rest] = args;
  const next = clone(state);
  switch (sub) {
    case "ls":
    case "list": {
      const lines = formatTable(["DRIVER", "VOLUME NAME"], state.volumes.map((v) => ["local", v.name])).map((l) => out(l));
      return done(state, lines, "Listed named volumes. Volumes are managed by Docker and exist independently of any container.");
    }
    case "create": {
      const name = rest.find((r) => !r.startsWith("-")) ?? hex(`vol-${state.seq}`, 32);
      if (!next.volumes.some((v) => v.name === name)) next.volumes.push({ name, files: [] });
      next.seq += 1;
      return done(next, [out(name)], `Created the volume "${name}". Mount it with -v ${name}:/path/in/container.`);
    }
    case "rm": {
      const name = rest[0];
      if (!name) return fail(state, [err('"docker volume rm" requires at least 1 argument.')]);
      if (!state.volumes.some((v) => v.name === name)) return fail(state, [err(`Error response from daemon: get ${name}: no such volume`)]);
      const user = state.containers.find((c) => c.mounts.some((m) => m.source === name));
      if (user) return fail(state, [err(`Error response from daemon: remove ${name}: volume is in use - [${user.id.slice(0, 12)}]`)], "A volume cannot be removed while a container uses it, even a stopped one.");
      next.volumes = next.volumes.filter((v) => v.name !== name);
      return done(next, [out(name)], "Deleted the volume and all data in it. This cannot be undone.");
    }
    case "inspect": {
      const name = rest[0];
      const vol = state.volumes.find((v) => v.name === name);
      if (!vol) return fail(state, [err(`Error response from daemon: get ${name}: no such volume`)]);
      const json = [{ Driver: "local", Mountpoint: `/var/lib/docker/volumes/${vol.name}/_data`, Name: vol.name, Scope: "local" }];
      return done(state, JSON.stringify(json, null, 2).split("\n").map((l) => out(l)), `Docker stores this volume's data on the host under /var/lib/docker/volumes. It currently holds ${vol.files.length} file(s).`);
    }
    default:
      return fail(state, [err(`Usage: docker volume COMMAND (ls, create, rm, inspect)`)]);
  }
}

function cmdNetwork(state: DockerState, args: string[]): Result {
  const [sub, ...rest] = args;
  switch (sub) {
    case "ls":
    case "list": {
      const rows = state.networks.map((n) => [hex(`net-${n}`, 12), n, n === "host" ? "host" : n === "none" ? "null" : "bridge", "local"]);
      return done(state, formatTable(["NETWORK ID", "NAME", "DRIVER", "SCOPE"], rows).map((l) => out(l)), "Listed networks. `bridge` is the default. User-defined bridge networks also give containers DNS by name.");
    }
    case "create": {
      const name = rest.find((r) => !r.startsWith("-"));
      if (!name) return fail(state, [err('"docker network create" requires exactly 1 argument.')]);
      if (state.networks.includes(name)) return fail(state, [err(`Error response from daemon: network with name ${name} already exists`)]);
      const next = clone(state);
      next.networks.push(name);
      return done(next, [out(hex(`net-${name}`, 64))], `Created a user-defined bridge network "${name}". Containers started with --network ${name} can reach each other by container name.`);
    }
    case "rm": {
      const name = rest[0];
      if (!name || !state.networks.includes(name) || ["bridge", "host", "none"].includes(name)) return fail(state, [err(`Error response from daemon: network ${name ?? ""} not found or cannot be removed`)]);
      const next = clone(state);
      next.networks = next.networks.filter((n) => n !== name);
      return done(next, [out(name)], "Removed the network.");
    }
    default:
      return fail(state, [err("Usage: docker network COMMAND (ls, create, rm)")]);
  }
}

function dockerfileSteps(text: string) {
  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
  const fsSteps = lines.filter((l) => /^(FROM|WORKDIR|COPY|ADD|RUN|USER)\b/i.test(l));
  const from = lines.find((l) => /^FROM\b/i.test(l))?.split(/\s+/)[1] ?? "scratch";
  const expose = lines.filter((l) => /^EXPOSE\b/i.test(l)).flatMap((l) => l.split(/\s+/).slice(1).map((p) => Number(p.split("/")[0])));
  const cmdLine = lines.find((l) => /^CMD\b/i.test(l));
  let cmd = cmdLine ? cmdLine.replace(/^CMD\s+/i, "") : "";
  try {
    if (cmd.startsWith("[")) cmd = (JSON.parse(cmd) as string[]).join(" ");
  } catch {
    // keep raw text
  }
  const workdir = [...lines].reverse().find((l) => /^WORKDIR\b/i.test(l))?.split(/\s+/)[1] ?? "/";
  return { fsSteps, from, expose, cmd, workdir };
}

function cmdBuild(state: DockerState, args: string[]): Result {
  const parsed = parseArgs(args, { boolean: ["q", "no-cache", "pull"], value: ["t", "tag", "f", "file", "build-arg", "target", "platform"], aliases: { tag: "t", file: "f" } });
  if (parsed.unknown.length) return fail(state, [err(`unknown flag: ${parsed.unknown[0]}`)]);
  if (parsed.positionals.length !== 1) {
    return fail(
      state,
      [err('ERROR: "docker buildx build" requires exactly 1 argument.'), muted("Usage:  docker build [OPTIONS] PATH | URL | -")],
      "You must tell Docker where the build context is. Usually that is `.`, meaning the current folder, as in `docker build -t demo-app .`.",
    );
  }
  const dockerfileName = typeof parsed.flags.f === "string" ? parsed.flags.f : "Dockerfile";
  const dockerfile = state.files[dockerfileName];
  if (!dockerfile) {
    return fail(
      state,
      [err(`ERROR: failed to solve: failed to read dockerfile: open ${dockerfileName}: no such file or directory`)],
      "There is no Dockerfile in the build context. In the playground, switch to the \"App with a Dockerfile\" scenario to try a build.",
    );
  }
  const next = clone(state);
  const tagRef = typeof parsed.flags.t === "string" ? parsed.flags.t : null;
  const { fsSteps, from, expose, cmd, workdir } = dockerfileSteps(dockerfile);
  const total = fsSteps.length;
  const cacheKey = `${tagRef ?? "untagged"}`;
  const cached = next.builtOnce.includes(cacheKey) && !parsed.flags["no-cache"];
  const ignored = (next.files[".dockerignore"] ?? "").split("\n").filter(Boolean);
  const contextFiles = Object.keys(next.files).length;
  const lines: OutputLine[] = [
    info("(simulated build output)"),
    out(`[+] Building ${cached ? "0.6" : "8.4"}s (${total + 4}/${total + 4}) FINISHED`),
    out(` => [internal] load build definition from ${dockerfileName}`),
    out(` => [internal] load .dockerignore`),
    out(` => [internal] load metadata for docker.io/library/${from}`),
    out(` => [internal] load build context (${contextFiles} files${ignored.length ? `, ${ignored.length} patterns ignored` : ""})`),
  ];
  fsSteps.forEach((step, i) => {
    const isFrom = /^FROM/i.test(step);
    lines.push(out(` => ${cached && !isFrom ? "CACHED " : ""}[${i + 1}/${total}] ${isFrom ? `FROM docker.io/library/${from}` : step}`));
  });
  const { repository, tag } = tagRef ? parseImageRef(tagRef) : { repository: "<none>", tag: "<none>" };
  const id = hex(`build-${cacheKey}`, 12);
  lines.push(out(" => exporting to image"), out(` => => writing image sha256:${hex(id, 64)}`));
  if (tagRef) lines.push(out(` => => naming to docker.io/library/${repository}:${tag}`));

  next.images = next.images.filter((i) => !(i.repository === repository && i.tag === tag && tagRef));
  next.images.push({
    repository,
    tag,
    id,
    size: "142MB",
    createdLabel: "Less than a second ago",
    command: cmd || "node",
    exposes: expose,
    behavior: "server",
    logs: [`Server listening on port ${expose[0] ?? 3000}`],
    workdir,
    files: ["package.json", "server.js", "node_modules"],
  });
  if (!next.builtOnce.includes(cacheKey)) next.builtOnce.push(cacheKey);
  // Base images pulled during a build show up locally too.
  const base = parseImageRef(from);
  if (!findImage(next, from)) {
    const baseImg = catalogImage(base.repository, base.tag);
    if (baseImg) next.images.push(baseImg);
  }

  const explanation = [
    `Read the Dockerfile and ran its ${total} filesystem steps, each producing an image layer.`,
    cached ? "Every step after FROM was CACHED because nothing in the instructions or copied files changed, so the build was fast." : "",
    tagRef ? `The result was tagged ${repository}:${tag}. Run it with \`docker run -d -p 3000:${expose[0] ?? 3000} ${repository}\`.` : "No -t tag was given, so the image is listed as <none>. Add -t name to give it a name.",
    expose.length ? `EXPOSE ${expose.join(" ")} only documents the port. You still need -p to publish it.` : "",
  ]
    .filter(Boolean)
    .join(" ");
  return done(next, lines, explanation);
}

function cmdCompose(state: DockerState, args: string[]): Result {
  const project = state.compose;
  const [sub, ...rest] = args;
  if (!project) {
    return fail(
      state,
      [err("no configuration file provided: not found")],
      "There is no compose.yaml in this folder. Switch the playground to the \"Compose project\" scenario.",
    );
  }
  const next = clone(state);
  const network = `${project.name}_default`;
  const cname = (svc: string) => `${project.name}-${svc}-1`;
  switch (sub) {
    case "up": {
      const lines: OutputLine[] = [info("(simulated compose output)")];
      if (!next.networks.includes(network)) {
        next.networks.push(network);
        lines.push(out(` ✔ Network ${network}  Created`));
      }
      for (const svc of project.services) {
        for (const v of svc.volumes ?? []) {
          if (!next.volumes.some((x) => x.name === `${project.name}_${v.source}`)) {
            next.volumes.push({ name: `${project.name}_${v.source}`, files: [] });
            lines.push(out(` ✔ Volume "${project.name}_${v.source}"  Created`));
          }
        }
      }
      for (const svc of [...project.services].reverse()) {
        const { repository, tag } = parseImageRef(svc.image);
        if (!findImage(next, svc.image)) {
          if (svc.build) {
            next.images.push({
              repository, tag, id: hex(`compose-${svc.image}`, 12), size: "142MB", createdLabel: "Less than a second ago",
              command: "node server.js", exposes: [3000], behavior: "server", logs: ["Server listening on port 3000", "Connected to Redis at cache:6379"], workdir: "/app", files: ["package.json", "server.js"],
            });
            lines.push(out(` ✔ Service ${svc.name}  Built`));
          } else {
            pullImage(next, svc.image);
            lines.push(out(` ✔ ${svc.name} Pulled`));
          }
        }
        const existing = findContainer(next, cname(svc.name));
        if (existing) {
          existing.status = "running";
          existing.statusTick = next.tick;
          lines.push(out(` ✔ Container ${cname(svc.name)}  Running`));
          continue;
        }
        next.containers.push(
          makeContainer(next, {
            name: cname(svc.name),
            image: svc.image,
            network,
            composeProject: project.name,
            ports: (svc.ports ?? []).map((p) => ({ ...p, hostIp: "0.0.0.0" })),
            env: svc.env ?? {},
            mounts: (svc.volumes ?? []).map((v) => ({ type: "volume" as const, source: `${project.name}_${v.source}`, target: v.target, readOnly: false })),
          }),
        );
        lines.push(out(` ✔ Container ${cname(svc.name)}  Started`));
      }
      return done(
        next,
        lines,
        `Read compose.yaml and created everything it describes: a network, a named volume, and one container per service, in dependency order (cache before web). Services reach each other by service name, so web connects to Redis at "cache". ${
          rest.includes("-d") ? "-d runs them in the background." : "Without -d, the logs would stream in your terminal."
        }`,
      );
    }
    case "ps": {
      const list = next.containers.filter((c) => c.composeProject === project.name);
      const rows = list.map((c) => [c.name, c.image, c.name.split("-")[1], statusLabel(c, next.tick), portsLabel(c, next)]);
      return done(state, formatTable(["NAME", "IMAGE", "SERVICE", "STATUS", "PORTS"], rows).map((l) => out(l)), "Listed only the containers that belong to this Compose project.");
    }
    case "logs": {
      const svc = rest.find((r) => !r.startsWith("-"));
      const list = next.containers.filter((c) => c.composeProject === project.name && (!svc || c.name === cname(svc)));
      const lines = list.flatMap((c) => c.logs.map((l) => out(`${c.name.split("-")[1].padEnd(6)}| ${l}`)));
      return done(state, lines.length ? lines : [muted("(no output)")], "Showed logs from the project's services, each line prefixed with its service name.");
    }
    case "down": {
      const removeVolumes = rest.includes("-v") || rest.includes("--volumes");
      const lines: OutputLine[] = [];
      for (const c of next.containers.filter((x) => x.composeProject === project.name)) lines.push(out(` ✔ Container ${c.name}  Removed`));
      next.containers = next.containers.filter((c) => c.composeProject !== project.name);
      if (next.networks.includes(network)) {
        next.networks = next.networks.filter((n) => n !== network);
        lines.push(out(` ✔ Network ${network}  Removed`));
      }
      if (removeVolumes) {
        next.volumes = next.volumes.filter((v) => !v.name.startsWith(`${project.name}_`));
        lines.push(out(` ✔ Volume ${project.name}_cache-data  Removed`));
      }
      return done(
        next,
        lines,
        removeVolumes
          ? "Stopped and removed the project's containers and network, and with -v also its named volumes (the data is gone)."
          : "Stopped and removed the project's containers and network. Named volumes were kept, so data survives the next `docker compose up`.",
      );
    }
    case "stop": {
      for (const c of next.containers.filter((x) => x.composeProject === project.name)) {
        c.status = "exited";
        c.statusTick = next.tick;
      }
      return done(next, project.services.map((s) => out(` ✔ Container ${cname(s.name)}  Stopped`)), "Stopped the services without removing them.");
    }
    default:
      return fail(state, [err("Usage: docker compose COMMAND (up -d, ps, logs, stop, down)")]);
  }
}

const DOCKER_HELP = [
  "Supported simulated Docker commands:",
  "  docker images | docker pull IMAGE[:TAG] | docker rmi IMAGE",
  "  docker run [-d] [--name NAME] [-p HOST:CONTAINER] [-e KEY=VALUE] [-v VOLUME:/path] [--network NET] [--rm] IMAGE [CMD]",
  "  docker ps [-a] | docker logs NAME | docker exec NAME CMD",
  "  docker stop | start | restart | kill | rm [-f] NAME",
  "  docker inspect NAME | docker port NAME",
  "  docker build -t NAME . | docker volume ls|create|rm|inspect | docker network ls|create|rm",
  "  docker compose up -d | ps | logs | stop | down",
  "Shell helpers: ls, cat FILE, curl localhost:PORT, clear, help",
];

function hostShell(state: DockerState, tokens: string[]): Result | null {
  const [prog, ...rest] = tokens;
  switch (prog) {
    case "help":
      return done(state, DOCKER_HELP.map((l) => out(l)), "Listed the commands this simulator understands.");
    case "ls": {
      const names = Object.keys(state.files);
      return done(state, names.length ? [out(names.join("  "))] : [muted("(empty folder)")], "Listed files in the current folder of the simulated host.");
    }
    case "cat": {
      const file = rest[0];
      if (!file || !(file in state.files)) return fail(state, [err(`cat: ${file ?? ""}: No such file or directory`)]);
      return done(state, state.files[file].split("\n").map((l) => out(l)), `Printed ${file}.`);
    }
    case "pwd":
      return done(state, [out("/home/learner/project")]);
    case "whoami":
      return done(state, [out("learner")]);
    case "echo":
      return done(state, [out(rest.join(" "))]);
    case "curl": {
      const target = rest.find((r) => !r.startsWith("-")) ?? "";
      const match = target.replace(/^https?:\/\//, "").match(/^(localhost|127\.0\.0\.1|0\.0\.0\.0)(?::(\d+))?/);
      if (!match) {
        return fail(state, [err(`curl: (6) Could not resolve host: ${target || "(none)"}`)], "This simulation only supports curl to localhost on the host, or between containers via docker exec. It never makes real network requests.");
      }
      const port = Number(match[2] ?? 80);
      const c = state.containers.find((x) => x.status === "running" && x.ports.some((p) => p.host === port));
      if (!c) {
        return fail(state, [err(`curl: (7) Failed to connect to localhost port ${port}: Connection refused`)], `No running container publishes host port ${port}. Check \`docker ps\` and the -p HOST:CONTAINER mapping.`);
      }
      const mapping = c.ports.find((p) => p.host === port)!;
      const img = findImage(state, c.image);
      if (!img?.exposes.includes(mapping.container)) {
        return fail(state, [err(`curl: (56) Recv failure: Connection reset by peer`)], `Host port ${port} forwards to container port ${mapping.container}, but nothing inside "${c.name}" listens there. It listens on ${img?.exposes.join(", ") || "no port"}.`);
      }
      const body =
        img.repository === "nginx" ? ["<!DOCTYPE html>", "<html><head><title>Welcome to nginx!</title></head>", "<body><h1>Welcome to nginx!</h1></body></html>"]
          : img.repository === "httpd" ? ["<html><body><h1>It works!</h1></body></html>"]
            : ["Hello from demo-app!"];
      return done(state, [info("(simulated response)"), ...body.map((l) => out(l))], `The request to localhost:${port} on the host was forwarded to port ${mapping.container} inside "${c.name}". This is port mapping in action.`);
    }
    default:
      return null;
  }
}

export function runDockerCommand(input: string, state: DockerState): Result {
  const text = normalizeCommand(input);
  const tokenized = tokenize(text);
  if (!tokenized.ok) return fail(state, [err(`syntax error: ${tokenized.error}`)]);
  let tokens = tokenized.tokens;
  if (tokens.length === 0) return done(state, []);
  if (tokens[0] === "sudo") tokens = tokens.slice(1);

  const ticked = { ...state, tick: state.tick + 1 };

  if (tokens[0] !== "docker") {
    if (tokens[0] === "docker-compose") return cmdCompose(ticked, tokens.slice(1));
    if (tokens[0] === "kubectl") {
      return fail(state, [err("kubectl: this terminal is in Docker mode.")], "Switch the terminal to Kubernetes mode to use kubectl.");
    }
    const shell = hostShell(ticked, tokens);
    if (shell) return shell;
    return fail(
      state,
      [err(`${tokens[0]}: command not found (simulated terminal)`)],
      "This is a safe simulated terminal. It only understands Docker commands and a few shell helpers. Type `help` to see them.",
    );
  }

  let [, sub, ...args] = tokens;
  // Normalise management-command forms: docker container ls -> docker ps, docker image ls -> docker images
  if (sub === "container" || sub === "image") {
    const group = sub;
    const [action, ...more] = args;
    const map: Record<string, string> = group === "container"
      ? { ls: "ps", list: "ps", run: "run", start: "start", stop: "stop", rm: "rm", logs: "logs", inspect: "inspect", exec: "exec", restart: "restart", kill: "kill", port: "port" }
      : { ls: "images", list: "images", pull: "pull", rm: "rmi", build: "build", inspect: "inspect" };
    if (!action || !map[action]) return fail(state, [err(`docker ${group}: unknown command "${action ?? ""}"`)]);
    sub = map[action];
    args = more;
  }
  if (sub === "buildx" && args[0] === "build") {
    sub = "build";
    args = args.slice(1);
  }

  switch (sub) {
    case undefined:
    case "help":
    case "--help":
      return done(state, DOCKER_HELP.map((l) => out(l)), "Listed the commands this simulator understands.");
    case "--version":
    case "-v":
      return done(state, [out("Docker version 27.3.1, build simulated")], "Printed the (simulated) Docker client version.");
    case "version":
      return done(state, [out("Client:  Version 27.3.1 (simulated)"), out("Server:  Docker Engine (simulated in your browser)")], "Shows client and engine versions. Here, the engine is a simulation running in your browser.");
    case "info":
      return done(
        state,
        [out(`Containers: ${state.containers.length}`), out(`  Running: ${state.containers.filter((c) => c.status === "running").length}`), out(`Images: ${state.images.length}`), out("Server Version: 27.3.1 (simulated)")],
        "Summarised the state of the simulated Docker engine.",
      );
    case "images":
      return cmdImages(ticked, args);
    case "pull":
      return cmdPull(ticked, args);
    case "run":
      return cmdRun(ticked, args);
    case "create": {
      const result = cmdRun(ticked, ["-d", ...args]);
      if (!result.ok) return result;
      const created = result.state.containers[result.state.containers.length - 1];
      created.status = "created";
      return { ...result, explanation: "Created the container without starting it. Start it with `docker start`." };
    }
    case "ps":
      return cmdPs(ticked, args);
    case "logs":
      return cmdLogs(ticked, args);
    case "exec":
      return cmdExec(ticked, args);
    case "stop":
      return cmdStop(ticked, args, "stop");
    case "kill":
      return cmdStop(ticked, args, "kill");
    case "start":
      return cmdStart(ticked, args, false);
    case "restart":
      return cmdStart(ticked, args, true);
    case "rm":
      return cmdRm(ticked, args);
    case "rmi":
      return cmdRmi(ticked, args);
    case "inspect":
      return cmdInspect(ticked, args);
    case "port":
      return cmdPort(ticked, args);
    case "volume":
      return cmdVolume(ticked, args);
    case "network":
      return cmdNetwork(ticked, args);
    case "build":
      return cmdBuild(ticked, args);
    case "compose":
      return cmdCompose(ticked, args);
    case "push":
    case "login":
      return fail(state, [info("(simulated) Pushing to and logging in to registries is not simulated.")], "`docker push` uploads a tagged image to a registry such as Docker Hub. It needs an account, so this offline simulation skips it.");
    case "tag": {
      const [source, target] = args;
      const img = source ? findImage(state, source) : undefined;
      if (!img || !target) return fail(state, [err("Usage: docker tag SOURCE_IMAGE[:TAG] TARGET_IMAGE[:TAG]")]);
      const next = clone(ticked);
      const t = parseImageRef(target);
      next.images.push({ ...img, repository: t.repository, tag: t.tag });
      return done(next, [], `Added a new name ${t.repository}:${t.tag} pointing to the same image ID ${img.id}. No data was copied.`);
    }
    default:
      return fail(state, [err(`docker: '${sub}' is not a docker command (or is not simulated).`), muted("Type `help` to see supported commands.")]);
  }
}
