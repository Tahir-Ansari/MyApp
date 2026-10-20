import type { LessonContent } from "../types";

export const dockerModule2: Record<string, LessonContent> = {
  "pull-images-and-registries": {
    objectives: [
      "Explain what a registry is and where Docker looks by default",
      "Read full image references: registry, repository, and tag",
      "Pull specific tags and list local images",
    ],
    sections: [
      {
        type: "text",
        heading: "Registries store images",
        paragraphs: [
          "A **registry** is a server that stores images and hands them out on request, much as npm or PyPI store packages. **Docker Hub** is the default public registry. Companies also run private registries, and cloud providers offer their own (for example, GitHub Container Registry or Amazon ECR).",
          "`docker pull` downloads an image from a registry into your machine's local image store. `docker images` lists what is stored locally.",
        ],
      },
      { type: "diagram", diagram: "registry-flow", caption: "Images travel from a registry to your machine with pull (and back with push)." },
      {
        type: "text",
        heading: "Reading an image reference",
        paragraphs: [
          "A full image reference looks like `registry/namespace/repository:tag`. Docker fills in defaults when parts are missing: `nginx` really means `docker.io/library/nginx:latest`. Official images live under the `library` namespace on Docker Hub.",
        ],
      },
      {
        type: "code",
        language: "text",
        caption: "Examples of image references",
        code: `nginx                         -> docker.io/library/nginx:latest
nginx:1.27                    -> docker.io/library/nginx:1.27
redis:7                       -> docker.io/library/redis:7
ghcr.io/acme/billing-api:2.4  -> registry ghcr.io, repository acme/billing-api, tag 2.4`,
      },
      {
        type: "callout",
        tone: "tip",
        title: "Pin your tags",
        body: "Tags are movable labels. `latest` today may point to a different image next month. In real projects, pin versions (e.g. `nginx:1.27`) so builds are repeatable.",
      },
      {
        type: "text",
        heading: "Layers are shared",
        paragraphs: [
          "Images are made of **layers**. When you pull, Docker downloads only the layers you don't already have, which is why the output lists several `Pull complete` lines and why a second, related image often downloads quickly.",
        ],
      },
    ],
    keyTakeaways: [
      "A registry stores and distributes images; Docker Hub is the default.",
      "`nginx` expands to docker.io/library/nginx:latest.",
      "Pin tags for repeatability; latest is only a default name.",
    ],
    quizQuestions: [
      {
        id: "q1",
        prompt: "What does `docker pull redis` download?",
        kind: "single",
        options: [
          { id: "a", text: "The Redis source code" },
          { id: "b", text: "The image docker.io/library/redis:latest" },
          { id: "c", text: "A running Redis container" },
          { id: "d", text: "Every version of Redis" },
        ],
        correct: ["b"],
        explanation: "Without a registry or tag, Docker uses Docker Hub, the library namespace, and the latest tag. pull downloads an image; it does not start anything.",
      },
      {
        id: "q2",
        prompt: "In `ghcr.io/acme/billing-api:2.4`, which part is the tag?",
        kind: "single",
        options: [
          { id: "a", text: "ghcr.io" },
          { id: "b", text: "acme" },
          { id: "c", text: "billing-api" },
          { id: "d", text: "2.4" },
        ],
        correct: ["d"],
        explanation: "The tag comes after the final colon. ghcr.io is the registry and acme/billing-api is the repository.",
      },
      {
        id: "q3",
        prompt: "Why is pinning `nginx:1.27` safer than using `nginx:latest` in production? Select all that apply.",
        kind: "multiple",
        options: [
          { id: "a", text: "latest can point to a different image later" },
          { id: "b", text: "Builds and deployments become repeatable" },
          { id: "c", text: "Pinned tags download without the network" },
          { id: "d", text: "You choose when to upgrade" },
        ],
        correct: ["a", "b", "d"],
        explanation: "Pinned tags make deployments predictable and upgrades deliberate. They still need to be downloaded.",
      },
    ],
    activity: {
      type: "terminal",
      title: "Stock your image shelf",
      instructions: "Pull a pinned tag, pull another image, and inspect your local images.",
      mode: "docker",
      scenario: "docker-empty",
      steps: [
        { id: "pin", instruction: "Pull nginx with the tag 1.27.", hint: "docker pull nginx:1.27", goal: { kind: "docker-image-present", image: "nginx:1.27" } },
        { id: "redis", instruction: "Pull the redis image (default tag).", hint: "docker pull redis", goal: { kind: "docker-image-present", image: "redis:latest" } },
        { id: "list", instruction: "List local images.", hint: "docker images", goal: { kind: "command", pattern: "^docker (images|image ls)\\b" } },
      ],
      explanation: "You now have two images stored locally. Try `docker pull nginx:9.9` in the playground to see what a missing tag looks like.",
    },
  },

  "run-names-and-ports": {
    objectives: [
      "Start containers in the foreground and in the background",
      "Name containers and understand name conflicts",
      "Publish ports with -p HOST:CONTAINER and know what EXPOSE does not do",
    ],
    sections: [
      {
        type: "text",
        heading: "docker run = create + start",
        paragraphs: [
          "`docker run IMAGE` creates a new container from the image and starts it. Without `-d`, your terminal attaches to the container's output until it stops. With `-d` (detached), it runs in the background and Docker prints the container's ID.",
          "Each `docker run` creates a **new** container. Running the same command twice gives you two containers, not one.",
        ],
      },
      {
        type: "text",
        heading: "Names",
        paragraphs: [
          "Docker gives every container a random name such as `jolly_hopper`. Use `--name web` to choose your own. Names must be unique on the machine, so a second `--name web` fails until you remove the first container.",
        ],
      },
      { type: "diagram", diagram: "port-mapping", caption: "-p 8080:80 forwards traffic from the host's port 8080 to port 80 inside the container." },
      {
        type: "text",
        heading: "Publishing ports",
        paragraphs: [
          "A container has its own network namespace, so a web server listening on port 80 inside it is not reachable from your host by default. `-p HOST:CONTAINER` publishes the container port on a host port. `-p 8080:80` means “send traffic for host port 8080 to container port 80”.",
          "The left number is on your machine and can be anything free. The right number must match the port the app actually listens on inside the container.",
        ],
      },
      {
        type: "callout",
        tone: "warning",
        title: "EXPOSE does not publish",
        body: "An image's `EXPOSE 80` instruction only documents which port the app uses. It does not make the port reachable from the host. You still need `-p` (or `-P` to publish all exposed ports to random host ports).",
      },
      {
        type: "code",
        language: "bash",
        caption: "Two copies of the same site on different host ports",
        code: `docker run -d --name site-a -p 8081:80 nginx
docker run -d --name site-b -p 8082:80 nginx   # same container port, different host port`,
      },
    ],
    keyTakeaways: [
      "docker run creates and starts a new container every time.",
      "--name sets a unique, memorable name.",
      "-p HOST:CONTAINER publishes a port; EXPOSE only documents it.",
    ],
    quizQuestions: [
      {
        id: "q1",
        prompt: "An app listens on port 3000 inside its container. You want to reach it at http://localhost:8080. Which flag is right?",
        kind: "single",
        options: [
          { id: "a", text: "-p 3000:8080" },
          { id: "b", text: "-p 8080:3000" },
          { id: "c", text: "--expose 8080" },
          { id: "d", text: "-p 8080" },
        ],
        correct: ["b"],
        explanation: "HOST:CONTAINER, so 8080 on your machine maps to 3000 inside the container.",
      },
      {
        id: "q2",
        prompt: "An image's Dockerfile contains `EXPOSE 80`. You run it without -p. Can you reach it on localhost:80?",
        kind: "single",
        options: [
          { id: "a", text: "Yes, EXPOSE publishes the port automatically" },
          { id: "b", text: "No, EXPOSE only documents the port; you still need -p" },
          { id: "c", text: "Only on Linux" },
          { id: "d", text: "Only if the container is named web" },
        ],
        correct: ["b"],
        explanation: "EXPOSE is metadata. Publishing a port to the host requires -p (or -P).",
      },
      {
        id: "q3",
        prompt: "You run `docker run -d --name web nginx` twice. What happens the second time?",
        kind: "single",
        options: [
          { id: "a", text: "It restarts the first container" },
          { id: "b", text: "It fails because the name web is already in use" },
          { id: "c", text: "It renames the first container" },
          { id: "d", text: "It silently does nothing" },
        ],
        correct: ["b"],
        explanation: "Container names must be unique. Remove the old container or choose a different name.",
      },
    ],
    activity: {
      type: "terminal",
      title: "Two sites, two ports",
      instructions: "Run two nginx containers side by side and reach one of them from the host.",
      mode: "docker",
      scenario: "docker-with-images",
      steps: [
        { id: "a", instruction: "Run nginx as site-a on host port 8081.", hint: "docker run -d --name site-a -p 8081:80 nginx", goal: { kind: "docker-container", state: "running", name: "site-a", hostPort: 8081, containerPort: 80 } },
        { id: "b", instruction: "Run nginx as site-b on host port 8082.", hint: "docker run -d --name site-b -p 8082:80 nginx", goal: { kind: "docker-container", state: "running", name: "site-b", hostPort: 8082, containerPort: 80 } },
        { id: "curl", instruction: "Request site-b from the host.", hint: "curl localhost:8082", goal: { kind: "command", pattern: "^curl (https?://)?(localhost|127\\.0\\.0\\.1):8082" } },
      ],
      explanation: "Both containers listen on port 80 internally, which is fine because each has its own network namespace. Only the host ports must differ.",
    },
  },

  "inspect-running-containers": {
    objectives: [
      "List containers and read the STATUS and PORTS columns",
      "Read a container's logs",
      "Run a one-off command inside a running container with exec",
    ],
    sections: [
      {
        type: "text",
        heading: "Your four inspection tools",
        paragraphs: [
          "Once containers are running, you mostly ask four questions: what is running, what is it saying, what is inside, and how do I stop it? Each has a command.",
        ],
      },
      {
        type: "list",
        items: [
          "`docker ps`: which containers are running, from which image, with which ports. Add `-a` for stopped ones.",
          "`docker logs NAME`: everything the container's main process wrote to stdout and stderr. Add `--tail 20` for the last lines or `-f` to follow.",
          "`docker exec NAME COMMAND`: run an extra command inside a running container, e.g. `docker exec web ls /usr/share/nginx/html`. Use `docker exec -it web sh` for an interactive shell.",
          "`docker stop NAME`: ask the main process to shut down (SIGTERM), then force it after a timeout.",
        ],
      },
      {
        type: "code",
        language: "bash",
        simulated: true,
        caption: "Reading docker ps -a",
        code: `CONTAINER ID   IMAGE    STATUS                     PORTS                  NAMES
3f2a9c1d7b44   nginx    Up 2 minutes               0.0.0.0:8080->80/tcp   shop-frontend
8b1e5d2c9a10   redis:7  Up 2 minutes               6379/tcp               cache
c4d9e8f7a6b5   node:20  Exited (1) 1 minute ago                           legacy-api`,
      },
      {
        type: "text",
        heading: "Reading the columns",
        paragraphs: [
          "**STATUS** tells you whether it is up and, if it exited, the **exit code**. `Exited (0)` usually means the process finished normally; a non-zero code usually means an error, so check its logs.",
          "**PORTS** shows `0.0.0.0:8080->80/tcp` for a published port, or just `6379/tcp` for a port the image exposes but that is not published.",
        ],
      },
      { type: "diagram", diagram: "image-container-lifecycle", caption: "logs and exec only work on containers that exist; exec needs the container to be running." },
      {
        type: "callout",
        tone: "tip",
        title: "exec does not restart anything",
        body: "`docker exec` starts an additional process next to the main one. When that command finishes, the container keeps running. It is perfect for poking around without disturbing the app.",
      },
    ],
    keyTakeaways: [
      "docker ps shows running containers; -a includes stopped ones with exit codes.",
      "docker logs shows the main process's output, which is usually the first place to look.",
      "docker exec runs extra commands inside a running container.",
    ],
    quizQuestions: [
      {
        id: "q1",
        prompt: "A container shows `Exited (1)`. What is the best first step?",
        kind: "single",
        options: [
          { id: "a", text: "docker logs NAME to see what the process printed before exiting" },
          { id: "b", text: "docker rmi to delete the image" },
          { id: "c", text: "docker exec NAME sh" },
          { id: "d", text: "Reinstall Docker" },
        ],
        correct: ["a"],
        explanation: "A non-zero exit code means the main process failed. Its logs usually explain why. exec won't work because the container is not running.",
      },
      {
        id: "q2",
        prompt: "What does `docker exec web ls /` do?",
        kind: "single",
        options: [
          { id: "a", text: "Creates a new container called web" },
          { id: "b", text: "Runs ls / inside the already-running web container" },
          { id: "c", text: "Lists files on the host" },
          { id: "d", text: "Restarts web and then runs ls" },
        ],
        correct: ["b"],
        explanation: "exec runs an additional command inside an existing, running container.",
      },
      {
        id: "q3",
        prompt: "In the PORTS column, what does `6379/tcp` (with no arrow) mean? Select all that apply.",
        kind: "multiple",
        options: [
          { id: "a", text: "The image exposes port 6379" },
          { id: "b", text: "The port is not published to the host" },
          { id: "c", text: "The host's port 6379 forwards to the container" },
          { id: "d", text: "The container is stopped" },
        ],
        correct: ["a", "b"],
        explanation: "No `host->container` arrow means nothing is published. The port is merely exposed (documented) by the image.",
      },
    ],
    activity: {
      type: "terminal",
      title: "Investigate a busy machine",
      instructions: "This machine already runs a few containers. Inspect them.",
      mode: "docker",
      scenario: "docker-mixed",
      steps: [
        { id: "ps", instruction: "List all containers, including stopped ones.", hint: "docker ps -a", goal: { kind: "command", pattern: "^docker (ps|container ls) (-a|--all)\\b" } },
        { id: "logs", instruction: "Read the logs of legacy-api to see why it exited.", hint: "docker logs legacy-api", goal: { kind: "command", pattern: "^docker logs legacy-api" } },
        { id: "exec", instruction: "List the web root inside shop-frontend.", hint: "docker exec shop-frontend ls /usr/share/nginx/html", goal: { kind: "command", pattern: "^docker exec shop-frontend ls" } },
        { id: "stop", instruction: "Stop the cache container.", hint: "docker stop cache", goal: { kind: "command", pattern: "^docker stop cache$" } },
      ],
      explanation: "ps for the overview, logs for the story, exec to look inside, and stop to shut down: that covers most day-to-day inspection.",
    },
  },

  "container-lifecycle": {
    objectives: [
      "Trace a container through created, running, exited, and removed",
      "Explain why a container stops when its main process ends",
      "Avoid common beginner mistakes",
    ],
    sections: [
      {
        type: "text",
        heading: "States",
        paragraphs: [
          "A container moves through a small set of states. `docker create` makes a **created** container. `docker start` (or `docker run`, which does both) makes it **running**. When its main process ends, by itself or through `docker stop`, it becomes **exited**. `docker rm` deletes it. A removed container is gone; a new one must be created from the image.",
        ],
      },
      { type: "diagram", diagram: "image-container-lifecycle", caption: "Step through the lifecycle. Each command moves the container to a new state." },
      {
        type: "text",
        heading: "One main process",
        paragraphs: [
          "A container lives exactly as long as its **main process** (PID 1). Run `docker run ubuntu` and it exits immediately: the default command is a shell, and with no terminal attached it has nothing to do, so it exits. That is normal behaviour, not a bug.",
          "Long-running servers like nginx stay up because their main process keeps running in the foreground.",
        ],
      },
      {
        type: "list",
        heading: "Common mistakes",
        items: [
          "**Expecting `docker run` to reuse a container.** It always creates a new one. Use `docker start NAME` to restart an existing one.",
          "**Leaving stopped containers behind.** They pile up in `docker ps -a`. Use `--rm` for throwaway runs or clean up with `docker rm`.",
          "**Removing a running container.** `docker rm` refuses. Stop it first or use `docker rm -f`.",
          "**Storing important data in the container.** Removing the container deletes its writable layer. Use volumes.",
          "**Restarting to fix a config error.** A container that exits because of bad configuration will exit again. Read the logs and fix the cause.",
        ],
      },
      {
        type: "callout",
        tone: "info",
        title: "stop vs. kill",
        body: "`docker stop` sends SIGTERM and waits (10 seconds by default) for a graceful shutdown before sending SIGKILL. `docker kill` sends SIGKILL immediately, giving the app no chance to clean up.",
      },
    ],
    keyTakeaways: [
      "States: created → running → exited → removed.",
      "A container stops when its main process ends.",
      "docker start reuses a stopped container; docker run always makes a new one.",
    ],
    quizQuestions: [
      {
        id: "q1",
        prompt: "`docker run ubuntu` exits immediately with code 0. Why?",
        kind: "single",
        options: [
          { id: "a", text: "The ubuntu image is broken" },
          { id: "b", text: "Its main process (a shell) had nothing to do and finished, so the container stopped" },
          { id: "c", text: "Docker ran out of memory" },
          { id: "d", text: "You need -p to keep it running" },
        ],
        correct: ["b"],
        explanation: "A container runs only as long as its main process. A non-interactive shell exits straight away.",
      },
      {
        id: "q2",
        prompt: "You stopped a container named web yesterday. How do you run it again with the same configuration?",
        kind: "single",
        options: [
          { id: "a", text: "docker run web" },
          { id: "b", text: "docker start web" },
          { id: "c", text: "docker pull web" },
          { id: "d", text: "docker build web" },
        ],
        correct: ["b"],
        explanation: "docker start restarts an existing container. `docker run web` would try to create a new container from an image named web.",
      },
      {
        id: "q3",
        prompt: "Which commands delete something permanently? Select all that apply.",
        kind: "multiple",
        options: [
          { id: "a", text: "docker rm web" },
          { id: "b", text: "docker stop web" },
          { id: "c", text: "docker rmi nginx" },
          { id: "d", text: "docker ps -a" },
        ],
        correct: ["a", "c"],
        explanation: "rm deletes a container (and its writable layer); rmi deletes an image. stop and ps don't delete anything.",
      },
    ],
    activity: {
      type: "ordering",
      title: "Order the lifecycle",
      instructions: "Arrange the events in the order a typical container goes through them.",
      items: [
        { id: "pull", label: "Image is pulled to the machine", detail: "docker pull nginx" },
        { id: "create", label: "Container is created", detail: "docker create (part of docker run)" },
        { id: "start", label: "Container is running", detail: "docker start (part of docker run)" },
        { id: "stop", label: "Container is exited", detail: "docker stop, or the main process ends" },
        { id: "rm", label: "Container is removed", detail: "docker rm" },
      ],
      explanation: "docker run combines create and start. A stopped container can be started again until it is removed.",
    },
  },
};
