import type { LessonContent } from "../types";

export const dockerModule4: Record<string, LessonContent> = {
  "docker-networking": {
    objectives: [
      "Distinguish host-to-container traffic from container-to-container traffic",
      "Create a user-defined network and connect containers to it",
      "Reach another container by name using Docker's DNS",
    ],
    sections: [
      {
        type: "text",
        heading: "Two kinds of traffic",
        paragraphs: [
          "**From the host (or the outside world) into a container**: you need to publish a port with `-p HOST:CONTAINER`, as you have been doing.",
          "**From one container to another**: containers on the same Docker network can talk directly over the network using the **container port**. No `-p` is needed for that.",
        ],
      },
      { type: "diagram", diagram: "port-mapping", caption: "Host traffic needs a published port. The mapping is HOST:CONTAINER." },
      {
        type: "text",
        heading: "User-defined networks and DNS",
        paragraphs: [
          "Every container joins the default `bridge` network unless told otherwise. On the default bridge, containers cannot find each other by name. On a **user-defined bridge network**, created with `docker network create`, Docker runs a built-in DNS server, so a container can reach another simply by its name, e.g. `http://api:80`.",
        ],
      },
      { type: "diagram", diagram: "container-network", caption: "On a user-defined network, containers resolve each other by name." },
      {
        type: "code",
        language: "bash",
        caption: "Connect two containers by name",
        code: `docker network create appnet
docker run -d --name api    --network appnet nginx
docker run -d --name client --network appnet nginx
docker exec client curl http://api      # resolves "api" via Docker DNS`,
      },
      {
        type: "callout",
        tone: "warning",
        title: "Use the container port inside the network",
        body: "If api is published with -p 8080:80, other containers still talk to it on port 80. The 8080 mapping exists only on the host.",
      },
    ],
    keyTakeaways: [
      "Host → container traffic needs -p; container → container traffic doesn't.",
      "User-defined networks provide DNS so containers find each other by name.",
      "Inside a network, use the container's own port, not the published host port.",
    ],
    quizQuestions: [
      {
        id: "q1",
        prompt: "A web container must call a container named db on port 5432. Both are on network appnet. What address should web use?",
        kind: "single",
        options: [
          { id: "a", text: "localhost:5432" },
          { id: "b", text: "db:5432" },
          { id: "c", text: "The host's IP and a published port only" },
          { id: "d", text: "It is impossible without -p" },
        ],
        correct: ["b"],
        explanation: "On a user-defined network, Docker's DNS resolves container names. localhost inside web means web itself.",
      },
      {
        id: "q2",
        prompt: "Two containers on the default bridge network fail to reach each other by name. Why?",
        kind: "single",
        options: [
          { id: "a", text: "The default bridge doesn't provide name-based DNS between containers" },
          { id: "b", text: "Containers can never communicate" },
          { id: "c", text: "They need to be on different hosts" },
          { id: "d", text: "Names only work with docker exec" },
        ],
        correct: ["a"],
        explanation: "Name resolution between containers is a feature of user-defined networks. Create one with docker network create.",
      },
      {
        id: "q3",
        prompt: "api is started with `-p 8080:80` on network appnet. Which statements are true? Select all that apply.",
        kind: "multiple",
        options: [
          { id: "a", text: "From the host, use localhost:8080" },
          { id: "b", text: "From another container on appnet, use api:80" },
          { id: "c", text: "From another container on appnet, use api:8080" },
          { id: "d", text: "The mapping makes port 8080 open inside the container" },
        ],
        correct: ["a", "b"],
        explanation: "The published port lives on the host. Inside the network, the app is still on its container port 80.",
      },
    ],
    activity: {
      type: "terminal",
      title: "Talk by name",
      instructions: "Create a network, attach two containers, and let one call the other by name.",
      mode: "docker",
      scenario: "docker-with-images",
      steps: [
        { id: "net", instruction: "Create a network called appnet.", hint: "docker network create appnet", goal: { kind: "command", pattern: "^docker network create appnet$" } },
        { id: "api", instruction: "Run nginx named api on appnet.", hint: "docker run -d --name api --network appnet nginx", goal: { kind: "docker-container", state: "running", name: "api" } },
        { id: "client", instruction: "Run nginx named client on appnet.", hint: "docker run -d --name client --network appnet nginx", goal: { kind: "docker-container", state: "running", name: "client" } },
        { id: "curl", instruction: "From client, request http://api.", hint: "docker exec client curl http://api", goal: { kind: "command", pattern: "^docker exec client (curl|wget|ping)\\b.*\\bapi\\b" } },
      ],
      explanation: "The request succeeded because both containers share a user-defined network with built-in DNS, and it used api's container port 80 directly.",
    },
  },

  "volumes-and-bind-mounts": {
    objectives: [
      "Explain why data in a container's writable layer is temporary",
      "Use named volumes for persistent data",
      "Know when a bind mount is the right choice",
    ],
    sections: [
      {
        type: "text",
        heading: "The writable layer is disposable",
        paragraphs: [
          "Files written inside a container go to its writable layer. That layer is deleted with the container. That's fine for scratch files, but a disaster for a database.",
          "A **volume** is storage managed by Docker that exists **independently of any container**. You mount it at a path inside the container; everything written under that path goes to the volume. Remove the container, and the volume (and its data) is still there.",
        ],
      },
      { type: "diagram", diagram: "volume-persistence", caption: "Remove the container: the writable layer goes, the volume stays." },
      {
        type: "code",
        language: "bash",
        caption: "Persist PostgreSQL data in a named volume",
        code: `docker volume create pgdata
docker run -d --name db -e POSTGRES_PASSWORD=example \\
  -v pgdata:/var/lib/postgresql/data postgres:16`,
      },
      {
        type: "text",
        heading: "Bind mounts",
        paragraphs: [
          "A **bind mount** maps a specific folder from your host into the container, e.g. `-v $(pwd)/src:/app/src`. Changes on either side are visible immediately. That makes it ideal for live-reloading code during development, but it ties the container to the host's folder layout.",
        ],
      },
      {
        type: "list",
        heading: "Which one?",
        items: [
          "**Named volume**: databases, uploads, any data the app owns. Portable, managed with `docker volume` commands.",
          "**Bind mount**: development source code and config files you edit on the host.",
          "**Writable layer**: temporary files you don't mind losing.",
        ],
      },
      {
        type: "callout",
        tone: "warning",
        title: "Removing a container keeps its named volumes",
        body: "`docker rm` leaves named volumes in place, so data is safe, but unused volumes can pile up. `docker volume rm NAME` deletes one and all its data, permanently.",
      },
    ],
    keyTakeaways: [
      "A container's writable layer is deleted with the container.",
      "Named volumes persist independently and are the default choice for app data.",
      "Bind mounts share a host folder and suit development workflows.",
    ],
    quizQuestions: [
      {
        id: "q1",
        prompt: "A database container stores data in its writable layer. You remove and recreate the container. What happens to the data?",
        kind: "single",
        options: [
          { id: "a", text: "It is kept automatically" },
          { id: "b", text: "It is lost with the old container" },
          { id: "c", text: "It moves into the image" },
          { id: "d", text: "It is restored from the registry" },
        ],
        correct: ["b"],
        explanation: "The writable layer belongs to one container. Use a volume for data that must survive.",
      },
      {
        id: "q2",
        prompt: "Which option best fits live-editing source code on your laptop while a container runs it?",
        kind: "single",
        options: [
          { id: "a", text: "Bake the code into the image and rebuild for every keystroke" },
          { id: "b", text: "A bind mount of the source folder" },
          { id: "c", text: "A named volume that you copy files into manually" },
          { id: "d", text: "The container's writable layer" },
        ],
        correct: ["b"],
        explanation: "A bind mount shows host edits inside the container instantly.",
      },
      {
        id: "q3",
        prompt: "Which statements about named volumes are true? Select all that apply.",
        kind: "multiple",
        options: [
          { id: "a", text: "They exist independently of containers" },
          { id: "b", text: "docker rm deletes them by default" },
          { id: "c", text: "The same volume can be mounted into a new container" },
          { id: "d", text: "docker volume rm deletes the data permanently" },
        ],
        correct: ["a", "c", "d"],
        explanation: "Volumes outlive containers and can be reattached. docker rm leaves named volumes alone; docker volume rm destroys them.",
      },
    ],
    activity: {
      type: "classify",
      title: "Where does the data live?",
      instructions: "Sort each description under the storage type it describes.",
      buckets: [
        { id: "volume", label: "Named volume" },
        { id: "bind", label: "Bind mount" },
        { id: "layer", label: "Writable layer" },
      ],
      items: [
        { id: "managed", label: "Managed by Docker, survives container removal", bucket: "volume" },
        { id: "hostdir", label: "Maps a specific folder from your host", bucket: "bind" },
        { id: "deleted", label: "Deleted together with the container", bucket: "layer" },
        { id: "dev", label: "Great for live-editing code in development", bucket: "bind" },
        { id: "db", label: "Recommended for database files", bucket: "volume" },
        { id: "unmounted", label: "Holds files written to paths that aren't mounted", bucket: "layer" },
      ],
      explanation: "Volumes for data the app owns, bind mounts for files you edit on the host, writable layer for throwaway files.",
    },
  },

  "environment-variables": {
    objectives: [
      "Configure containers with -e and --env-file",
      "Explain why configuration belongs outside the image",
      "Diagnose a container that exits because configuration is missing",
    ],
    sections: [
      {
        type: "text",
        heading: "Build once, configure per environment",
        paragraphs: [
          "The same image should run in development, staging, and production. What changes between them, such as database addresses, feature flags, and log levels, is supplied as **configuration** when the container starts. The most common way is **environment variables**.",
        ],
      },
      { type: "diagram", diagram: "env-config", caption: "One image, three containers, three different configurations." },
      {
        type: "code",
        language: "bash",
        caption: "Passing environment variables",
        code: `docker run -d -e LOG_LEVEL=debug -e PORT=3000 my-api
docker run -d --env-file ./staging.env my-api   # many variables from a file`,
      },
      {
        type: "text",
        heading: "When configuration is missing",
        paragraphs: [
          "Many images refuse to start without required settings. The official postgres image, for example, exits immediately if `POSTGRES_PASSWORD` is not set and explains why in its logs. The pattern is always the same: `docker ps -a` shows `Exited (1)`, `docker logs` shows the reason, and you recreate the container with the variable set.",
        ],
      },
      {
        type: "callout",
        tone: "warning",
        title: "Environment variables are not a vault",
        body: "Variables passed with -e are visible to anyone who can run `docker inspect` on the container. They are fine for development; production systems use a dedicated secrets mechanism. And never bake secrets into the image with ENV.",
      },
    ],
    keyTakeaways: [
      "Keep configuration out of images; inject it at run time.",
      "-e KEY=value sets a variable; --env-file loads many at once.",
      "A container exiting at startup is often missing configuration, so check its logs.",
    ],
    quizQuestions: [
      {
        id: "q1",
        prompt: "Why pass a database URL as an environment variable instead of writing it into the image?",
        kind: "single",
        options: [
          { id: "a", text: "Images cannot contain text" },
          { id: "b", text: "The same image can then be used in every environment with different settings" },
          { id: "c", text: "Environment variables are encrypted" },
          { id: "d", text: "It makes the container start faster" },
        ],
        correct: ["b"],
        explanation: "Separating configuration from the image lets you build once and deploy everywhere.",
      },
      {
        id: "q2",
        prompt: "`docker run -d --name db postgres` exits with code 1 right away. What is the most likely fix?",
        kind: "single",
        options: [
          { id: "a", text: "Run it again until it works" },
          { id: "b", text: "Recreate it with -e POSTGRES_PASSWORD=..." },
          { id: "c", text: "Delete the postgres image" },
          { id: "d", text: "Add -p 5432:5432" },
        ],
        correct: ["b"],
        explanation: "The logs say the superuser password is not specified. Restarting won't change the configuration.",
      },
      {
        id: "q3",
        prompt: "Which are reasonable ways to supply configuration to a container? Select all that apply.",
        kind: "multiple",
        options: [
          { id: "a", text: "-e KEY=value" },
          { id: "b", text: "--env-file settings.env" },
          { id: "c", text: "A config file mounted with a bind mount or volume" },
          { id: "d", text: "Editing files inside the running container by hand every time" },
        ],
        correct: ["a", "b", "c"],
        explanation: "Flags, env files, and mounted config files are all repeatable. Manual edits are lost when the container is replaced.",
      },
    ],
    activity: {
      type: "terminal",
      title: "Fix a missing setting",
      instructions: "Start PostgreSQL the wrong way, read why it fails, then fix it.",
      mode: "docker",
      scenario: "docker-with-images",
      steps: [
        { id: "bad", instruction: "Run postgres in the background named db, with no options.", hint: "docker run -d --name db postgres", goal: { kind: "docker-container", state: "exists", name: "db", image: "postgres" } },
        { id: "logs", instruction: "Read db's logs.", hint: "docker logs db", goal: { kind: "command", pattern: "^docker logs db$" } },
        { id: "rm", instruction: "Remove the failed container.", hint: "docker rm db", goal: { kind: "docker-container", state: "removed", name: "db" } },
        { id: "good", instruction: "Run it again with POSTGRES_PASSWORD set.", hint: "docker run -d --name db -e POSTGRES_PASSWORD=example postgres", goal: { kind: "docker-container", state: "running", name: "db", env: "POSTGRES_PASSWORD" } },
      ],
      explanation: "Logs told you exactly what was missing, and supplying it at run time fixed the problem without touching the image.",
    },
  },

  "docker-compose": {
    objectives: [
      "Describe a multi-container app in compose.yaml",
      "Start, inspect, and stop a whole stack with docker compose",
      "Understand service names, networks, and volumes in Compose",
    ],
    sections: [
      {
        type: "text",
        heading: "Too many flags to remember",
        paragraphs: [
          "A real app often needs several containers: a web server, a cache, a database. Starting each with the right ports, networks, volumes, and variables by hand is error-prone. **Docker Compose** lets you describe the whole set in one file, `compose.yaml`, and manage it with one command.",
        ],
      },
      {
        type: "code",
        language: "yaml",
        filename: "compose.yaml",
        code: `services:
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
  cache-data:`,
      },
      { type: "diagram", diagram: "compose-stack", caption: "Compose creates a network for the project; services reach each other by service name." },
      {
        type: "list",
        heading: "What Compose does for you",
        items: [
          "Creates a project network, so `web` reaches Redis at the hostname `cache`.",
          "Creates named volumes declared under `volumes:`.",
          "Builds images for services with `build:` and pulls the others.",
          "Starts services, respecting `depends_on` for start order.",
        ],
      },
      {
        type: "code",
        language: "bash",
        caption: "Everyday Compose commands",
        code: `docker compose up -d      # create and start everything in the background
docker compose ps         # list this project's containers
docker compose logs web   # logs for one service
docker compose down       # stop and remove containers and the network (volumes stay)`,
      },
      {
        type: "callout",
        tone: "info",
        title: "depends_on is about order, not readiness",
        body: "`depends_on` starts cache before web, but it does not wait until Redis is ready to accept connections unless you add a health check condition. Apps should retry connections anyway.",
      },
    ],
    keyTakeaways: [
      "compose.yaml describes services, networks, and volumes in one place.",
      "Services reach each other by service name on the project network.",
      "docker compose down keeps named volumes unless you add -v.",
    ],
    quizQuestions: [
      {
        id: "q1",
        prompt: "In the compose file above, how does the web service connect to Redis?",
        kind: "single",
        options: [
          { id: "a", text: "localhost:6379" },
          { id: "b", text: "cache:6379" },
          { id: "c", text: "redis.docker.io:6379" },
          { id: "d", text: "It needs a published port for 6379" },
        ],
        correct: ["b"],
        explanation: "Compose puts services on a shared network where each service name resolves via DNS.",
      },
      {
        id: "q2",
        prompt: "What does `docker compose down` (without -v) remove?",
        kind: "single",
        options: [
          { id: "a", text: "Containers, the network, and named volumes" },
          { id: "b", text: "Containers and the network; named volumes are kept" },
          { id: "c", text: "Only the images" },
          { id: "d", text: "Nothing; it only stops containers" },
        ],
        correct: ["b"],
        explanation: "Data in named volumes survives `down`. Add -v to delete those volumes too.",
      },
      {
        id: "q3",
        prompt: "Which are benefits of Compose? Select all that apply.",
        kind: "multiple",
        options: [
          { id: "a", text: "The whole stack's configuration is versioned in one file" },
          { id: "b", text: "One command starts every service with the right settings" },
          { id: "c", text: "It replaces Kubernetes for running across many machines" },
          { id: "d", text: "New teammates get a working environment quickly" },
        ],
        correct: ["a", "b", "d"],
        explanation: "Compose shines on a single host, especially for development. Orchestrating many machines is Kubernetes' job.",
      },
    ],
    activity: {
      type: "terminal",
      title: "Run the stack",
      instructions: "Bring up the project, check it, reach it, and tear it down.",
      mode: "docker",
      scenario: "docker-compose",
      steps: [
        { id: "cat", instruction: "Read compose.yaml.", hint: "cat compose.yaml", goal: { kind: "command", pattern: "^cat compose\\.yaml$" } },
        { id: "up", instruction: "Start everything in the background.", hint: "docker compose up -d", goal: { kind: "command", pattern: "^docker(-| )compose up\\b" } },
        { id: "ps", instruction: "List the project's containers.", hint: "docker compose ps", goal: { kind: "command", pattern: "^docker(-| )compose ps$" } },
        { id: "curl", instruction: "Request the web service from the host.", hint: "curl localhost:8080", goal: { kind: "command", pattern: "^curl (https?://)?(localhost|127\\.0\\.0\\.1):8080" } },
        { id: "down", instruction: "Stop and remove the stack.", hint: "docker compose down", goal: { kind: "command", pattern: "^docker(-| )compose down" } },
      ],
      explanation: "One file and a few commands managed a network, a volume, a build, and two containers.",
    },
  },

  "debugging-docker-errors": {
    objectives: [
      "Recognise the most common Docker error messages",
      "Choose a sensible next step for each",
      "Build a repeatable debugging routine",
    ],
    sections: [
      {
        type: "text",
        heading: "A short debugging routine",
        paragraphs: [
          "Most Docker problems yield to the same routine: **read the error message** carefully, **check state** with `docker ps -a`, **read logs** with `docker logs`, and **inspect configuration** with `docker inspect`. Resist the urge to retry the same command hoping for a different result.",
        ],
      },
      {
        type: "list",
        heading: "Errors you will meet",
        items: [
          "`port is already allocated`: another container (or program) already uses that host port. Find it with `docker ps`, then stop it or pick a different host port.",
          "`Conflict. The container name \"/web\" is already in use`: a container with that name exists, possibly stopped. `docker rm web` or choose another name.",
          "`pull access denied ... repository does not exist`: a typo in the image name, or a private image that needs `docker login`.",
          "`manifest ... not found`: the repository exists but that tag doesn't.",
          "`Exited (1)` immediately: the app crashed at startup. `docker logs` tells you why, often missing configuration.",
          "`container ... is not running` from exec: start the container first. exec needs a running container.",
        ],
      },
      { type: "diagram", diagram: "port-mapping", caption: "Two containers can't both claim the same host port." },
      {
        type: "code",
        language: "bash",
        simulated: true,
        caption: "A port conflict in action",
        code: `$ docker run -d --name web2 -p 8080:80 nginx
docker: Error response from daemon: driver failed programming external connectivity
on endpoint web2: Bind for 0.0.0.0:8080 failed: port is already allocated.`,
      },
      {
        type: "callout",
        tone: "tip",
        title: "The failed container still exists",
        body: "After a port conflict, Docker has already created web2. It just couldn't start it. Remove it (`docker rm web2`) before retrying with the same name.",
      },
    ],
    keyTakeaways: [
      "Read the message, check state, read logs, inspect configuration.",
      "Port and name conflicts mean something already uses that port or name.",
      "Startup crashes are diagnosed with logs, not by restarting.",
    ],
    quizQuestions: [
      {
        id: "q1",
        prompt: "`Bind for 0.0.0.0:8080 failed: port is already allocated`. What is the best next step?",
        kind: "single",
        options: [
          { id: "a", text: "Reinstall Docker" },
          { id: "b", text: "Run docker ps to find what already uses host port 8080" },
          { id: "c", text: "Delete the nginx image" },
          { id: "d", text: "Change the container port to 8080" },
        ],
        correct: ["b"],
        explanation: "Something already holds the host port. Find it, then stop it or use a different host port such as -p 8081:80.",
      },
      {
        id: "q2",
        prompt: "`pull access denied for ngnix, repository does not exist`. What is the most likely cause?",
        kind: "single",
        options: [
          { id: "a", text: "Docker Hub is down" },
          { id: "b", text: "A typo in the image name" },
          { id: "c", text: "The disk is full" },
          { id: "d", text: "The container is stopped" },
        ],
        correct: ["b"],
        explanation: "ngnix is a misspelling of nginx. Private images can trigger the same message, but check spelling first.",
      },
      {
        id: "q3",
        prompt: "A container exits with code 1 seconds after starting. Which actions help? Select all that apply.",
        kind: "multiple",
        options: [
          { id: "a", text: "docker logs NAME" },
          { id: "b", text: "docker inspect NAME to check its environment and command" },
          { id: "c", text: "docker start NAME repeatedly until it works" },
          { id: "d", text: "docker exec NAME sh while it is stopped" },
        ],
        correct: ["a", "b"],
        explanation: "Logs and inspect reveal the cause. Restarting repeats the crash, and exec needs a running container.",
      },
    ],
    activity: {
      type: "scenario",
      title: "Port trouble",
      symptom: "You run `docker run -d --name web2 -p 8080:80 nginx` and get “port is already allocated”.",
      context: {
        label: "docker ps (simulated)",
        language: "text",
        code: `CONTAINER ID   IMAGE   STATUS        PORTS                  NAMES
3f2a9c1d7b44   nginx   Up 3 hours    0.0.0.0:8080->80/tcp   web`,
      },
      question: "You need both containers running. What should you do?",
      options: [
        { id: "a", text: "Run web2 with -p 8081:80 after removing the failed web2 container", correct: true, feedback: "Yes. Each host port can be used by one container. Both can still use port 80 internally." },
        { id: "b", text: "Run web2 with -p 8080:81", correct: false, feedback: "The host port 8080 is still taken, and nginx doesn't listen on 81." },
        { id: "c", text: "Restart Docker so the port frees up", correct: false, feedback: "web would get the port again when it restarts. The conflict is real, not a glitch." },
        { id: "d", text: "Delete the nginx image", correct: false, feedback: "Both containers use that image. Deleting it doesn't solve a port clash." },
      ],
      explanation: "Host ports are a shared, unique resource. Pick a free host port; container ports can repeat.",
    },
  },

  "docker-review-mission": {
    objectives: [
      "Build, tag, run, inspect, and clean up an app on your own",
      "Connect each step to the concept behind it",
      "Feel ready to start the Kubernetes track",
    ],
    sections: [
      {
        type: "text",
        heading: "Mission brief",
        paragraphs: [
          "Your team needs the demo app packaged as version 1.0 and running on host port 8080. You will build the image, run it, confirm it responds, check its logs, and clean up, with only the checklist and hints to guide you.",
        ],
      },
      { type: "diagram", diagram: "dockerfile-pipeline", caption: "Everything you've learned in one loop." },
      {
        type: "list",
        heading: "Concept check before you start",
        items: [
          "**Image vs. container**: you'll build one image and create a container from it.",
          "**Tags**: `demo-app:1.0` pins a version.",
          "**Ports**: the app listens on 3000 inside; the host should use 8080.",
          "**Logs**: the first place to look when something seems wrong.",
          "**Cleanup**: `docker rm -f` stops and removes in one go.",
        ],
      },
      {
        type: "callout",
        tone: "tip",
        title: "Next up: Kubernetes",
        body: "Kubernetes runs the images you build with Docker. It doesn't replace building them. Everything here carries over.",
      },
    ],
    keyTakeaways: [
      "Build → run → verify → inspect → clean up is the core container workflow.",
      "Versioned tags and explicit port mappings make deployments predictable.",
      "Kubernetes builds on these same images.",
    ],
    quizQuestions: [
      {
        id: "q1",
        prompt: "The app listens on 3000; the team wants http://localhost:8080. Which mapping?",
        kind: "single",
        options: [
          { id: "a", text: "-p 3000:8080" },
          { id: "b", text: "-p 8080:3000" },
          { id: "c", text: "-p 8080:8080" },
          { id: "d", text: "--expose 8080" },
        ],
        correct: ["b"],
        explanation: "HOST:CONTAINER, so host 8080 maps to container 3000.",
      },
      {
        id: "q2",
        prompt: "Which command builds the current folder as demo-app version 1.0?",
        kind: "single",
        options: [
          { id: "a", text: "docker build demo-app:1.0" },
          { id: "b", text: "docker build -t demo-app:1.0 ." },
          { id: "c", text: "docker run -t demo-app:1.0 ." },
          { id: "d", text: "docker tag . demo-app:1.0" },
        ],
        correct: ["b"],
        explanation: "-t sets the name:tag and `.` is the build context.",
      },
      {
        id: "q3",
        prompt: "Which pairs of concepts are correctly matched? Select all that apply.",
        kind: "multiple",
        options: [
          { id: "a", text: "Volume: persistent data independent of containers" },
          { id: "b", text: "EXPOSE: publishes a port to the host" },
          { id: "c", text: "Registry: stores and distributes images" },
          { id: "d", text: "Writable layer: deleted with its container" },
        ],
        correct: ["a", "c", "d"],
        explanation: "EXPOSE only documents a port; -p publishes it.",
      },
    ],
    activity: {
      type: "terminal",
      title: "Ship demo-app 1.0",
      instructions: "Complete the mission checklist. Hints are there if you need them.",
      mode: "docker",
      scenario: "docker-build",
      steps: [
        { id: "build", instruction: "Build the image as demo-app:1.0.", hint: "docker build -t demo-app:1.0 .", goal: { kind: "docker-image-present", image: "demo-app:1.0" } },
        { id: "run", instruction: "Run it as demo on host port 8080.", hint: "docker run -d --name demo -p 8080:3000 demo-app:1.0", goal: { kind: "docker-container", state: "running", name: "demo", hostPort: 8080, containerPort: 3000 } },
        { id: "curl", instruction: "Confirm it responds.", hint: "curl localhost:8080", goal: { kind: "command", pattern: "^curl (https?://)?(localhost|127\\.0\\.0\\.1):8080" } },
        { id: "logs", instruction: "Check its logs.", hint: "docker logs demo", goal: { kind: "command", pattern: "^docker logs demo$" } },
        { id: "rm", instruction: "Stop and remove it in one command.", hint: "docker rm -f demo", goal: { kind: "docker-container", state: "removed", name: "demo" } },
      ],
      explanation: "Mission complete. You can package and run an application with Docker from start to finish.",
    },
  },
};
