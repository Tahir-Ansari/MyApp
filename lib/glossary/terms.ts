/**
 * Glossary data. Static, local, and safe to import from client components.
 * Each term links to the lesson that teaches it (validated against the catalog in getGlossaryTerms).
 */
import { getLessonEntry } from "@/lib/curriculum/catalog";

export type GlossaryCategory = "docker" | "kubernetes" | "general";

export interface GlossaryTerm {
  /** URL fragment and React key. */
  id: string;
  term: string;
  category: GlossaryCategory;
  /** Short, beginner-friendly definition. */
  definition: string;
  /** Optional one-line example or extra note. */
  example?: string;
  /** Extra words that should match a search (abbreviations, plurals, commands). */
  aliases?: string[];
  /** Slug of the lesson that teaches this term. */
  lessonSlug?: string;
  related?: string[];
}

const TERMS: GlossaryTerm[] = [
  {
    id: "container",
    term: "Container",
    category: "docker",
    definition:
      "A running (or stopped) instance created from an image. It is an isolated process with its own view of the filesystem, network, and process list, but it shares the host's operating-system kernel.",
    example: "docker run nginx creates and starts a container from the nginx image.",
    lessonSlug: "what-is-a-container",
    related: ["image", "volume"],
  },
  {
    id: "image",
    term: "Image",
    category: "docker",
    definition:
      "A read-only template that contains an application and everything it needs to run: files, libraries, and default settings. You create containers from images; the image itself does not run.",
    aliases: ["docker image", "template"],
    lessonSlug: "images-vs-containers",
    related: ["container", "layer", "registry", "tag"],
  },
  {
    id: "registry",
    term: "Registry",
    category: "docker",
    definition:
      "A service that stores and distributes images, such as Docker Hub or a private company registry. docker pull downloads from a registry; docker push uploads to one.",
    aliases: ["docker hub", "pull", "push"],
    lessonSlug: "pull-images-and-registries",
    related: ["image", "tag"],
  },
  {
    id: "tag",
    term: "Tag",
    category: "docker",
    definition:
      "A label after the colon in an image name that identifies a version, as in nginx:1.27. If you leave it out, Docker assumes latest, which is just a name and not a promise of the newest version.",
    aliases: ["latest", "version"],
    lessonSlug: "pull-images-and-registries",
    related: ["image", "registry"],
  },
  {
    id: "dockerfile",
    term: "Dockerfile",
    category: "docker",
    definition:
      "A text file of instructions (FROM, WORKDIR, COPY, RUN, CMD, and others) that Docker follows, in order, to build an image.",
    aliases: ["from", "run", "copy", "cmd", "entrypoint", "workdir", "docker build"],
    lessonSlug: "what-a-dockerfile-does",
    related: ["image", "build-context", "layer"],
  },
  {
    id: "build-context",
    term: "Build Context",
    category: "docker",
    definition:
      "The set of files sent to the builder when you run docker build (usually the current folder, written as a dot). COPY can only use files from the build context; .dockerignore keeps unneeded files out.",
    aliases: [".dockerignore", "dockerignore", "context"],
    lessonSlug: "build-context-and-layers",
    related: ["dockerfile", "layer"],
  },
  {
    id: "layer",
    term: "Layer",
    category: "docker",
    definition:
      "A read-only set of filesystem changes. An image is a stack of layers, and many build instructions add one. Unchanged layers are reused from cache, which makes rebuilds faster.",
    aliases: ["cache", "layers"],
    lessonSlug: "build-context-and-layers",
    related: ["image", "dockerfile"],
  },
  {
    id: "volume",
    term: "Volume",
    category: "docker",
    definition:
      "Storage managed by Docker that lives outside a container's writable layer, so the data survives when the container is removed and replaced.",
    aliases: ["persistent data", "-v"],
    lessonSlug: "volumes-and-bind-mounts",
    related: ["bind-mount", "container"],
  },
  {
    id: "bind-mount",
    term: "Bind Mount",
    category: "docker",
    definition:
      "Maps a specific folder from the host machine into a container. Handy for development (edit code on the host, see it in the container), but it ties the container to the host's file layout.",
    aliases: ["mount", "host folder"],
    lessonSlug: "volumes-and-bind-mounts",
    related: ["volume"],
  },
  {
    id: "port-mapping",
    term: "Port Mapping",
    category: "docker",
    definition:
      "Publishing a container's port on the host with -p HOST:CONTAINER, so traffic to the host port reaches the container. EXPOSE in a Dockerfile only documents a port; it does not publish it.",
    example: "-p 8080:80 sends traffic from host port 8080 to container port 80.",
    aliases: ["-p", "publish", "expose", "ports"],
    lessonSlug: "run-names-and-ports",
    related: ["network", "container"],
  },
  {
    id: "network",
    term: "Network",
    category: "docker",
    definition:
      "A virtual network that lets containers talk to each other. On a user-defined Docker network, containers can reach one another by container name.",
    aliases: ["bridge", "networking", "dns"],
    lessonSlug: "docker-networking",
    related: ["port-mapping", "docker-compose"],
  },
  {
    id: "docker-compose",
    term: "Docker Compose",
    category: "docker",
    definition:
      "A tool that describes a multi-container application (services, networks, volumes) in one YAML file, usually compose.yaml, and starts it all with docker compose up.",
    aliases: ["compose", "docker-compose.yml", "compose.yaml"],
    lessonSlug: "docker-compose",
    related: ["network", "volume", "yaml"],
  },
  {
    id: "orchestration",
    term: "Orchestration",
    category: "general",
    definition:
      "Automatically running containers across many machines: placing them, restarting failed ones, scaling up and down, and rolling out new versions. Kubernetes is an orchestrator.",
    aliases: ["orchestrator"],
    lessonSlug: "why-kubernetes",
    related: ["cluster", "reconciliation"],
  },
  {
    id: "cluster",
    term: "Cluster",
    category: "kubernetes",
    definition:
      "A group of machines (nodes) managed together by Kubernetes. A control plane makes decisions; worker nodes run your workloads.",
    lessonSlug: "cluster-architecture",
    related: ["node", "control-plane"],
  },
  {
    id: "node",
    term: "Node",
    category: "kubernetes",
    definition:
      "A machine (physical or virtual) in a Kubernetes cluster. Worker nodes run Pods; each node runs an agent called the kubelet and a container runtime.",
    aliases: ["worker node", "kubelet", "nodes"],
    lessonSlug: "cluster-architecture",
    related: ["cluster", "pod"],
  },
  {
    id: "control-plane",
    term: "Control Plane",
    category: "kubernetes",
    definition:
      "The components that manage the cluster: the API server you talk to with kubectl, the scheduler that places Pods on nodes, controllers that reconcile state, and etcd, which stores cluster data.",
    aliases: ["api server", "scheduler", "etcd", "master"],
    lessonSlug: "cluster-architecture",
    related: ["cluster", "reconciliation"],
  },
  {
    id: "pod",
    term: "Pod",
    category: "kubernetes",
    definition:
      "The smallest deployable unit in Kubernetes: one or more containers that share a network address and storage. In production you usually let a controller such as a Deployment create Pods rather than creating them by hand.",
    aliases: ["pods"],
    lessonSlug: "pods",
    related: ["deployment", "node"],
  },
  {
    id: "deployment",
    term: "Deployment",
    category: "kubernetes",
    definition:
      "Declares how many identical Pods (replicas) of an app should run and which image they use. A Deployment manages ReplicaSets to keep that number running and to roll out updates.",
    aliases: ["deploy", "replicas", "deployments"],
    lessonSlug: "deployments-and-replicasets",
    related: ["replicaset", "pod", "rollout"],
  },
  {
    id: "replicaset",
    term: "ReplicaSet",
    category: "kubernetes",
    definition:
      "Keeps a set number of matching Pods running, creating replacements when Pods disappear. You rarely create one directly; Deployments create and manage them for you.",
    aliases: ["replica set", "replicas"],
    lessonSlug: "deployments-and-replicasets",
    related: ["deployment", "pod"],
  },
  {
    id: "service",
    term: "Service",
    category: "kubernetes",
    definition:
      "A stable name and address for a changing set of Pods, chosen by label selector. ClusterIP is reachable inside the cluster, NodePort opens a port on every node, and LoadBalancer asks the environment for an external load balancer.",
    aliases: ["clusterip", "nodeport", "loadbalancer", "svc", "services"],
    lessonSlug: "services",
    related: ["selector", "label", "pod"],
  },
  {
    id: "namespace",
    term: "Namespace",
    category: "kubernetes",
    definition:
      "A way to divide one cluster into named groups of objects, for example per team or environment. Names must be unique within a namespace, not across the whole cluster.",
    aliases: ["ns", "namespaces"],
    lessonSlug: "namespaces-labels-selectors",
    related: ["label"],
  },
  {
    id: "label",
    term: "Label",
    category: "kubernetes",
    definition:
      "A key/value pair attached to an object, such as app: web. Labels are how Kubernetes objects find and group each other.",
    aliases: ["labels"],
    lessonSlug: "namespaces-labels-selectors",
    related: ["selector", "service"],
  },
  {
    id: "selector",
    term: "Selector",
    category: "kubernetes",
    definition:
      "A query that matches objects by their labels. A Service uses a selector to decide which Pods receive its traffic; a Deployment uses one to know which Pods it manages.",
    aliases: ["label selector", "selectors", "matchlabels"],
    lessonSlug: "namespaces-labels-selectors",
    related: ["label", "service", "deployment"],
  },
  {
    id: "configmap",
    term: "ConfigMap",
    category: "kubernetes",
    definition:
      "Stores non-secret configuration (settings, feature flags, config files) separately from the image, so the same image can run with different settings.",
    aliases: ["config map", "configuration"],
    lessonSlug: "configmaps-and-secrets",
    related: ["secret"],
  },
  {
    id: "secret",
    term: "Secret",
    category: "kubernetes",
    definition:
      "An object for sensitive values such as passwords and tokens. Values are base64-encoded, which is not encryption: protect Secrets with access controls (RBAC) and enable encryption at rest where your cluster supports it.",
    aliases: ["secrets", "base64", "password"],
    lessonSlug: "configmaps-and-secrets",
    related: ["configmap"],
  },
  {
    id: "probe",
    term: "Probe",
    category: "kubernetes",
    definition:
      "A periodic health check on a container. A readiness probe decides whether a Pod should receive traffic; a liveness probe decides whether the container should be restarted.",
    aliases: ["readiness", "liveness", "health check", "probes"],
    lessonSlug: "readiness-and-liveness-probes",
    related: ["pod"],
  },
  {
    id: "resource-request",
    term: "Resource Request",
    category: "kubernetes",
    definition:
      "The CPU and memory a container asks to have reserved. The scheduler uses requests to choose a node with enough room; if no node fits, the Pod stays Pending.",
    aliases: ["requests", "cpu", "memory", "pending"],
    lessonSlug: "requests-and-limits",
    related: ["resource-limit", "node"],
  },
  {
    id: "resource-limit",
    term: "Resource Limit",
    category: "kubernetes",
    definition:
      "The most CPU and memory a container may use. Going over the CPU limit slows the container down (throttling); going over the memory limit gets it killed (OOMKilled).",
    aliases: ["limits", "oomkilled", "throttling"],
    lessonSlug: "requests-and-limits",
    related: ["resource-request"],
  },
  {
    id: "rollout",
    term: "Rollout",
    category: "kubernetes",
    definition:
      "The process of moving a Deployment to a new version. A rolling update replaces Pods gradually so the app stays available throughout.",
    aliases: ["rolling update", "kubectl rollout"],
    lessonSlug: "rolling-updates-and-rollbacks",
    related: ["rollback", "deployment"],
  },
  {
    id: "rollback",
    term: "Rollback",
    category: "kubernetes",
    definition:
      "Returning a Deployment to a previous version, for example with kubectl rollout undo, when a new version misbehaves.",
    aliases: ["undo", "rollout undo"],
    lessonSlug: "rolling-updates-and-rollbacks",
    related: ["rollout", "deployment"],
  },
  {
    id: "reconciliation",
    term: "Reconciliation",
    category: "kubernetes",
    definition:
      "The loop controllers run constantly: compare the desired state you declared with the actual state of the cluster, then act to close the gap. It is why deleted Pods come back.",
    aliases: ["desired state", "control loop", "self-healing"],
    lessonSlug: "desired-state-reconciliation",
    related: ["control-plane", "deployment"],
  },
  {
    id: "kubectl",
    term: "kubectl",
    category: "kubernetes",
    definition:
      "The command-line tool for talking to a Kubernetes cluster's API server: get, describe, apply, logs, scale, and more. In this app, kubectl runs only in a simulator.",
    aliases: ["kubectl get", "kubectl apply", "kubectl describe", "kubectl logs", "cli"],
    lessonSlug: "reading-kubectl-output",
    related: ["control-plane"],
  },
  {
    id: "yaml",
    term: "YAML",
    category: "general",
    definition:
      "A human-readable data format that uses indentation for structure. Kubernetes manifests and Compose files are written in YAML; indentation mistakes are a common source of errors.",
    aliases: ["manifest", "apiversion", "kind", "spec", "metadata", "yml"],
    lessonSlug: "kubernetes-yaml-basics",
    related: ["docker-compose"],
  },
];

export interface ResolvedGlossaryTerm extends GlossaryTerm {
  lesson?: { slug: string; title: string; number: number };
}

/** All terms, alphabetical, with lesson links resolved. Links to unknown lessons are dropped rather than rendered dead. */
export function getGlossaryTerms(): ResolvedGlossaryTerm[] {
  return TERMS.map((t) => {
    const entry = t.lessonSlug ? getLessonEntry(t.lessonSlug) : undefined;
    return { ...t, lesson: entry ? { slug: entry.slug, title: entry.title, number: entry.number } : undefined };
  }).sort((a, b) => a.term.localeCompare(b.term, "en", { sensitivity: "base" }));
}

export const GLOSSARY_CATEGORY_LABEL: Record<GlossaryCategory, string> = {
  docker: "Docker",
  kubernetes: "Kubernetes",
  general: "General",
};
