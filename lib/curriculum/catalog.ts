import type { LessonEntry, ModuleMeta, TrackId, TrackMeta } from "./types";

/**
 * The curriculum structure: tracks, modules, and lesson metadata.
 * Lesson content lives in ./content and is merged in by ./index.ts.
 * This file is intentionally light so client components can import it.
 */

export const TRACKS: Record<TrackId, TrackMeta> = {
  docker: {
    id: "docker",
    title: "Docker Foundations",
    tagline: "Package an app once, run it anywhere Docker runs.",
    description:
      "Learn what containers are, run and inspect them, write Dockerfiles, and handle ports, volumes, configuration, and Compose.",
    href: "/learn/docker",
  },
  kubernetes: {
    id: "kubernetes",
    title: "Kubernetes Adventures",
    tagline: "Run many containers reliably across many machines.",
    description:
      "Understand clusters and desired state, then deploy, expose, scale, update, and troubleshoot a sample application.",
    href: "/learn/kubernetes",
  },
};

export const MODULES: ModuleMeta[] = [
  {
    id: "containers-from-zero",
    number: 1,
    track: "docker",
    title: "Containers from Zero",
    description: "Why containers exist and the core ideas behind images and containers.",
    lessons: [
      {
        slug: "works-on-my-machine",
        title: "Why “it works on my machine” happens",
        summary: "Hidden differences between environments break software. Containers package those differences away.",
        difficulty: "beginner",
        estimatedMinutes: 5,
      },
      {
        slug: "what-is-a-container",
        title: "What a container is",
        summary: "An isolated process with its own filesystem view, running on a shared host kernel.",
        difficulty: "beginner",
        estimatedMinutes: 6,
      },
      {
        slug: "containers-vs-virtual-machines",
        title: "Containers vs. virtual machines",
        summary: "Both isolate workloads, but they do it at different layers with different trade-offs.",
        difficulty: "beginner",
        estimatedMinutes: 6,
      },
      {
        slug: "images-vs-containers",
        title: "Images vs. containers",
        summary: "An image is a read-only template. A container is an instance created from it.",
        difficulty: "beginner",
        estimatedMinutes: 5,
      },
      {
        slug: "first-docker-workflow",
        title: "Your first Docker workflow",
        summary: "Pull an image, run a container, check that it is running, then clean up, all in a simulated terminal.",
        difficulty: "beginner",
        estimatedMinutes: 7,
      },
    ],
  },
  {
    id: "docker-commands",
    number: 2,
    track: "docker",
    title: "Docker Commands",
    description: "The everyday commands for getting images and running, inspecting, and stopping containers.",
    lessons: [
      {
        slug: "pull-images-and-registries",
        title: "docker pull, docker images, and registries",
        summary: "Where images come from, how they are named, and how tags work.",
        difficulty: "beginner",
        estimatedMinutes: 6,
      },
      {
        slug: "run-names-and-ports",
        title: "docker run, container names, and port mapping",
        summary: "Start containers in the background, give them names, and publish ports.",
        difficulty: "beginner",
        estimatedMinutes: 7,
      },
      {
        slug: "inspect-running-containers",
        title: "docker ps, logs, exec, and stop",
        summary: "See what is running, read output, run commands inside, and stop cleanly.",
        difficulty: "beginner",
        estimatedMinutes: 7,
      },
      {
        slug: "container-lifecycle",
        title: "Container lifecycle and common mistakes",
        summary: "Created, running, stopped, removed, and the mistakes beginners make along the way.",
        difficulty: "beginner",
        estimatedMinutes: 6,
      },
    ],
  },
  {
    id: "build-your-own-image",
    number: 3,
    track: "docker",
    title: "Build Your Own Image",
    description: "Write Dockerfiles, understand layers and build context, and build a web app image.",
    lessons: [
      {
        slug: "what-a-dockerfile-does",
        title: "What a Dockerfile does",
        summary: "A Dockerfile is a recipe of instructions that Docker follows to build an image.",
        difficulty: "beginner",
        estimatedMinutes: 5,
      },
      {
        slug: "dockerfile-core-instructions",
        title: "FROM, WORKDIR, COPY, and RUN",
        summary: "The four instructions that appear in almost every Dockerfile.",
        difficulty: "beginner",
        estimatedMinutes: 7,
      },
      {
        slug: "cmd-vs-entrypoint",
        title: "CMD vs. ENTRYPOINT",
        summary: "How an image decides what to run by default, and how you can override it.",
        difficulty: "intermediate",
        estimatedMinutes: 6,
      },
      {
        slug: "build-context-and-layers",
        title: "Build context, .dockerignore, and layers",
        summary: "What gets sent to the builder, how layers are cached, and how to keep builds fast.",
        difficulty: "intermediate",
        estimatedMinutes: 8,
      },
      {
        slug: "build-a-web-app-image",
        title: "Build and inspect a sample web app image",
        summary: "Put it all together: build, tag, run, and check a small web app image.",
        difficulty: "intermediate",
        estimatedMinutes: 8,
      },
    ],
  },
  {
    id: "real-world-containers",
    number: 4,
    track: "docker",
    title: "Real-World Container Concepts",
    description: "Networking, data persistence, configuration, Compose, and debugging.",
    lessons: [
      {
        slug: "docker-networking",
        title: "Port mapping and container networking",
        summary: "How containers talk to the host and to each other.",
        difficulty: "intermediate",
        estimatedMinutes: 8,
      },
      {
        slug: "volumes-and-bind-mounts",
        title: "Persisting data with volumes and bind mounts",
        summary: "Keep data safe when containers are replaced.",
        difficulty: "intermediate",
        estimatedMinutes: 8,
      },
      {
        slug: "environment-variables",
        title: "Environment variables and configuration",
        summary: "Configure one image differently for each environment.",
        difficulty: "beginner",
        estimatedMinutes: 6,
      },
      {
        slug: "docker-compose",
        title: "Multi-container development with Docker Compose",
        summary: "Describe an app made of several containers in one file.",
        difficulty: "intermediate",
        estimatedMinutes: 8,
      },
      {
        slug: "debugging-docker-errors",
        title: "Debugging common Docker errors",
        summary: "Port conflicts, name conflicts, missing images, and containers that exit immediately.",
        difficulty: "intermediate",
        estimatedMinutes: 8,
      },
      {
        slug: "docker-review-mission",
        title: "Docker review mission",
        summary: "Use everything from the Docker track to ship and check a small web service.",
        difficulty: "intermediate",
        estimatedMinutes: 10,
      },
    ],
  },
  {
    id: "why-kubernetes",
    number: 5,
    track: "kubernetes",
    title: "Why Kubernetes?",
    description: "The problems orchestration solves, cluster architecture, desired state, and YAML.",
    lessons: [
      {
        slug: "why-kubernetes",
        title: "Why one container is not enough at scale",
        summary: "Restarts, scaling, multiple machines, and rollouts are hard to do by hand.",
        difficulty: "beginner",
        estimatedMinutes: 6,
      },
      {
        slug: "cluster-architecture",
        title: "What a cluster is: control plane and worker nodes",
        summary: "The parts of a cluster and what each one is responsible for.",
        difficulty: "beginner",
        estimatedMinutes: 7,
      },
      {
        slug: "desired-state-reconciliation",
        title: "Desired state and reconciliation",
        summary: "You describe what you want. Controllers keep working until reality matches.",
        difficulty: "beginner",
        estimatedMinutes: 6,
      },
      {
        slug: "kubernetes-yaml-basics",
        title: "Kubernetes YAML basics",
        summary: "apiVersion, kind, metadata, and spec: how to read a manifest.",
        difficulty: "beginner",
        estimatedMinutes: 7,
      },
    ],
  },
  {
    id: "core-objects",
    number: 6,
    track: "kubernetes",
    title: "Core Objects",
    description: "Pods, Deployments, Services, Namespaces, labels, ConfigMaps, and Secrets.",
    lessons: [
      {
        slug: "pods",
        title: "Pods: the smallest deployable unit",
        summary: "What a Pod wraps around your containers, and why you rarely create Pods by hand.",
        difficulty: "beginner",
        estimatedMinutes: 7,
      },
      {
        slug: "deployments-and-replicasets",
        title: "Deployments and ReplicaSets",
        summary: "How Deployments keep the right number of identical Pods running.",
        difficulty: "beginner",
        estimatedMinutes: 7,
      },
      {
        slug: "services",
        title: "Services: stable networking for workloads",
        summary: "Give a changing set of Pods one stable address.",
        difficulty: "beginner",
        estimatedMinutes: 8,
      },
      {
        slug: "namespaces-labels-selectors",
        title: "Namespaces and labels/selectors",
        summary: "Organize objects and connect them with labels.",
        difficulty: "beginner",
        estimatedMinutes: 7,
      },
      {
        slug: "configmaps-and-secrets",
        title: "ConfigMaps and Secrets",
        summary: "Keep configuration out of images, and understand what Secrets do and do not protect.",
        difficulty: "intermediate",
        estimatedMinutes: 8,
      },
    ],
  },
  {
    id: "operate-an-application",
    number: 7,
    track: "kubernetes",
    title: "Operate an Application",
    description: "Deploy, expose, scale, health-check, size, and update a sample web app.",
    lessons: [
      {
        slug: "deploy-with-a-manifest",
        title: "Deploy a sample app with a Deployment manifest",
        summary: "Apply a manifest and watch the cluster create Pods.",
        difficulty: "beginner",
        estimatedMinutes: 7,
      },
      {
        slug: "expose-with-a-service",
        title: "Expose it with a Service",
        summary: "Create a Service and check which Pods it routes to.",
        difficulty: "beginner",
        estimatedMinutes: 7,
      },
      {
        slug: "scaling-and-self-healing",
        title: "Scale replicas and understand self-healing",
        summary: "Change the replica count and watch the controller replace deleted Pods.",
        difficulty: "beginner",
        estimatedMinutes: 7,
      },
      {
        slug: "readiness-and-liveness-probes",
        title: "Readiness and liveness probes",
        summary: "Tell Kubernetes when a container is ready for traffic and when it needs a restart.",
        difficulty: "intermediate",
        estimatedMinutes: 8,
      },
      {
        slug: "requests-and-limits",
        title: "Resource requests and limits",
        summary: "Help the scheduler place Pods and stop one container from using too much.",
        difficulty: "intermediate",
        estimatedMinutes: 8,
      },
      {
        slug: "rolling-updates-and-rollbacks",
        title: "Rolling updates and rollbacks",
        summary: "Ship a new version gradually, and undo it if something goes wrong.",
        difficulty: "intermediate",
        estimatedMinutes: 8,
      },
    ],
  },
  {
    id: "troubleshooting-and-review",
    number: 8,
    track: "kubernetes",
    title: "Troubleshooting and Review",
    description: "Diagnose common failure states and finish with a full mission.",
    lessons: [
      {
        slug: "pending-pods",
        title: "Why a Pod may be Pending",
        summary: "A Pod that cannot be scheduled waits as Pending. Learn how to find out why.",
        difficulty: "intermediate",
        estimatedMinutes: 7,
      },
      {
        slug: "crashloopbackoff",
        title: "CrashLoopBackOff: what it means",
        summary: "A status that tells you a container keeps crashing, not why it crashes.",
        difficulty: "intermediate",
        estimatedMinutes: 8,
      },
      {
        slug: "imagepullbackoff",
        title: "ImagePullBackOff and image pull problems",
        summary: "Typos, missing tags, and private registries that stop Pods before they start.",
        difficulty: "intermediate",
        estimatedMinutes: 7,
      },
      {
        slug: "reading-kubectl-output",
        title: "Read kubectl get, describe, and logs output",
        summary: "Learn which command answers which question, and how to read its output.",
        difficulty: "intermediate",
        estimatedMinutes: 8,
      },
      {
        slug: "final-mission",
        title: "Final mission: deploy, inspect, scale, and troubleshoot",
        summary: "Run the full workflow on a sample app, from apply to diagnosis.",
        difficulty: "intermediate",
        estimatedMinutes: 12,
      },
    ],
  },
];

function buildEntries(): LessonEntry[] {
  const entries: LessonEntry[] = [];
  let number = 0;
  for (const mod of MODULES) {
    for (const lesson of mod.lessons) {
      number += 1;
      entries.push({
        ...lesson,
        id: `lesson-${String(number).padStart(2, "0")}`,
        number,
        track: mod.track,
        module: { id: mod.id, number: mod.number, title: mod.title },
        prerequisites: [],
        previousSlug: null,
        nextSlug: null,
      });
    }
  }
  // Within each track, a lesson requires the lesson before it. Each track starts unlocked.
  for (const track of ["docker", "kubernetes"] as const) {
    const inTrack = entries.filter((e) => e.track === track);
    inTrack.forEach((entry, i) => {
      entry.prerequisites = i > 0 ? [inTrack[i - 1].slug] : [];
    });
  }
  entries.forEach((entry, i) => {
    entry.previousSlug = i > 0 ? entries[i - 1].slug : null;
    entry.nextSlug = i < entries.length - 1 ? entries[i + 1].slug : null;
  });
  return entries;
}

export const LESSON_ENTRIES: LessonEntry[] = buildEntries();

const BY_SLUG = new Map(LESSON_ENTRIES.map((e) => [e.slug, e]));

export function getLessonEntry(slug: string): LessonEntry | undefined {
  return BY_SLUG.get(slug);
}

export function getModulesForTrack(track: TrackId): ModuleMeta[] {
  return MODULES.filter((m) => m.track === track);
}

export function getEntriesForTrack(track: TrackId): LessonEntry[] {
  return LESSON_ENTRIES.filter((e) => e.track === track);
}

export function getEntriesForModule(moduleId: string): LessonEntry[] {
  return LESSON_ENTRIES.filter((e) => e.module.id === moduleId);
}

export const TOTAL_LESSONS = LESSON_ENTRIES.length;
