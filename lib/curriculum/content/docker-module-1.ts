import type { LessonContent } from "../types";

export const dockerModule1: Record<string, LessonContent> = {
  "works-on-my-machine": {
    objectives: [
      "Explain why software that works on one computer can fail on another",
      "Name the parts of an environment that an app silently depends on",
      "Describe how packaging the environment with the app solves the problem",
    ],
    sections: [
      {
        type: "text",
        heading: "The classic bug report",
        paragraphs: [
          "You finish a feature, run it, and everything works. A teammate pulls the same code and it crashes. The server in production fails in a third, different way. Nobody changed the code, so what is different?",
          "The answer is the **environment**: everything around your code that it needs in order to run. That includes the language runtime (say, Python 3.12 vs. 3.8), system libraries, installed packages and their exact versions, configuration files, environment variables, and even the operating system.",
        ],
      },
      { type: "diagram", diagram: "works-on-my-machine", caption: "The same code behaves differently because each machine has a slightly different environment." },
      {
        type: "list",
        heading: "Common hidden differences",
        items: [
          "**Runtime versions**: your laptop has Node 20, the server has Node 16.",
          "**Dependency versions**: a library updated a minor version and changed behaviour.",
          "**System packages**: an image library or database driver is installed on one machine only.",
          "**Configuration**: an environment variable such as `DATABASE_URL` exists on your machine but not elsewhere.",
          "**Operating system details**: file paths, line endings, and case-sensitive filenames.",
        ],
      },
      {
        type: "analogy",
        title: "Analogy: the recipe vs. the kitchen",
        body: "A recipe (your code) assumes a certain oven, certain ingredients, and certain tools. Hand the same recipe to a different kitchen and the cake may fail, not because the recipe is wrong but because the kitchen differs. Containers ship a standard, portable kitchen together with the recipe.",
      },
      {
        type: "text",
        heading: "Package the environment with the app",
        paragraphs: [
          "Docker's core idea is to bundle your application **and** the environment it needs into one artifact called an **image**. Anyone who runs that image, on a laptop, a CI server, or a production machine, gets the same files, the same runtime, and the same libraries.",
          "The machine still needs a container runtime such as Docker, and some things (like secrets and per-environment configuration) are deliberately supplied at run time. But the large class of “works on my machine” bugs caused by mismatched dependencies largely disappears.",
        ],
      },
      {
        type: "callout",
        tone: "info",
        title: "What containers do not fix",
        body: "Containers do not fix bugs in your code, and they do not make a Linux image run natively on a different CPU architecture. They make the environment repeatable, so differences you still see are much easier to pin down.",
      },
    ],
    keyTakeaways: [
      "An app depends on its environment: runtime, libraries, configuration, and OS details.",
      "Small environment differences between machines cause most “works on my machine” failures.",
      "Docker packages the app and its environment into a portable image.",
    ],
    quizQuestions: [
      {
        id: "q1",
        prompt: "A script works on your laptop but fails on the server with “module not found”. Nobody changed the code. What is the most likely cause?",
        kind: "single",
        options: [
          { id: "a", text: "The code has a syntax error that only appears on servers" },
          { id: "b", text: "A dependency is installed on your laptop but missing on the server" },
          { id: "c", text: "The server's CPU is too slow" },
          { id: "d", text: "The file was renamed by the network" },
        ],
        correct: ["b"],
        explanation: "“Module not found” means the runtime cannot locate a dependency. That is an environment difference: the package exists on one machine and not the other.",
      },
      {
        id: "q2",
        prompt: "Which of these are part of an application's environment? Select all that apply.",
        kind: "multiple",
        options: [
          { id: "a", text: "The installed language runtime version" },
          { id: "b", text: "Environment variables such as DATABASE_URL" },
          { id: "c", text: "System libraries the app links against" },
          { id: "d", text: "The colour of the developer's terminal theme" },
        ],
        correct: ["a", "b", "c"],
        explanation: "Runtime versions, environment variables, and system libraries all affect how code runs. A terminal colour theme does not.",
      },
      {
        id: "q3",
        prompt: "How does Docker reduce “works on my machine” problems?",
        kind: "single",
        options: [
          { id: "a", text: "It automatically rewrites your code to be portable" },
          { id: "b", text: "It packages the app together with its runtime and dependencies into an image" },
          { id: "c", text: "It uploads your laptop's whole hard drive to the server" },
          { id: "d", text: "It disables environment variables" },
        ],
        correct: ["b"],
        explanation: "An image bundles the app with the environment it needs, so every machine that runs the image starts from the same files and libraries.",
      },
    ],
    activity: {
      type: "classify",
      title: "Environment or code?",
      instructions: "Sort each item: is it part of the environment around your app, or part of your application code?",
      buckets: [
        { id: "env", label: "Environment" },
        { id: "code", label: "Application code" },
      ],
      items: [
        { id: "runtime", label: "Python 3.12 installed on the machine", bucket: "env" },
        { id: "lib", label: "The libpq system library", bucket: "env" },
        { id: "envvar", label: "A DATABASE_URL environment variable", bucket: "env" },
        { id: "fn", label: "A function that calculates order totals", bucket: "code" },
        { id: "tpl", label: "Your HTML templates", bucket: "code" },
        { id: "pkgver", label: "The exact version of a library installed by the package manager", bucket: "env" },
      ],
      explanation: "Docker images capture the environment items (runtime, libraries, installed packages) alongside your code. Configuration like DATABASE_URL is usually supplied when the container starts.",
    },
  },

  "what-is-a-container": {
    objectives: [
      "Define a container accurately: an isolated process, not a tiny computer",
      "Explain the role of the shared host kernel",
      "Name the Linux features that provide isolation and resource limits",
    ],
    sections: [
      {
        type: "text",
        heading: "A container is a process with boundaries",
        paragraphs: [
          "A **container** is a normal process (or group of processes) running on a host machine, with boundaries drawn around it. Inside those boundaries, the process sees its own filesystem, its own process list, and its own network interfaces, as if it had the machine to itself.",
          "That is the key mental model: a container is not a small virtual computer. It is your program, running directly on the host, with a restricted and customised view of the system.",
        ],
      },
      { type: "diagram", diagram: "container-isolation", caption: "Each container is an isolated process. All of them share the host's kernel." },
      {
        type: "text",
        heading: "The shared kernel",
        paragraphs: [
          "The **kernel** is the core of the operating system: it schedules processes, manages memory, and talks to hardware. All containers on a host share that host's kernel. A container image does not include a kernel. It includes the files a program needs, such as libraries and tools from a Linux distribution.",
          "This is why containers start in a fraction of a second and use little memory: there is no second operating system to boot. It is also why a Linux container needs a Linux kernel. Docker Desktop on macOS and Windows quietly runs a lightweight Linux virtual machine to provide one.",
        ],
      },
      {
        type: "list",
        heading: "How Linux draws the boundaries",
        items: [
          "**Namespaces** give a process its own view of things like process IDs, network interfaces, mount points, and hostname.",
          "**Control groups (cgroups)** limit and account for resources such as CPU and memory.",
          "**A separate root filesystem**, unpacked from an image, decides which files the process can see.",
        ],
      },
      {
        type: "callout",
        tone: "warning",
        title: "Isolation is strong, not absolute",
        body: "Containers are well isolated for everyday use, but because they share a kernel, they are a weaker security boundary than separate virtual machines. Don't run untrusted code in a container assuming it is as isolated as a VM.",
      },
      {
        type: "code",
        language: "bash",
        simulated: true,
        caption: "Inside a container, the main process often sees itself as PID 1.",
        code: `$ docker exec web ps
PID   USER     COMMAND
    1 root     nginx: master process
   42 root     ps`,
      },
    ],
    keyTakeaways: [
      "A container is an isolated process running on the host, not a mini virtual machine.",
      "All containers on a host share the host kernel; images contain files, not a kernel.",
      "Namespaces isolate what a process can see; cgroups limit what it can use.",
    ],
    quizQuestions: [
      {
        id: "q1",
        prompt: "Which statement best describes a container?",
        kind: "single",
        options: [
          { id: "a", text: "A lightweight virtual machine with its own kernel" },
          { id: "b", text: "An isolated process that shares the host's kernel" },
          { id: "c", text: "A compressed archive of source code" },
          { id: "d", text: "A cloud server rented by the minute" },
        ],
        correct: ["b"],
        explanation: "A container is a process (or group of processes) with isolation applied. It runs on the host's kernel rather than booting its own.",
      },
      {
        id: "q2",
        prompt: "What do Linux namespaces provide for a container?",
        kind: "single",
        options: [
          { id: "a", text: "Encryption of the container's files" },
          { id: "b", text: "An isolated view of resources such as processes, network, and mounts" },
          { id: "c", text: "A faster CPU" },
          { id: "d", text: "Automatic backups" },
        ],
        correct: ["b"],
        explanation: "Namespaces control what a process can see: its own PIDs, network interfaces, mounts, hostname, and more. Resource limits come from cgroups.",
      },
      {
        id: "q3",
        prompt: "Why can containers start much faster than traditional virtual machines? Select all that apply.",
        kind: "multiple",
        options: [
          { id: "a", text: "They do not boot a separate operating system kernel" },
          { id: "b", text: "Starting one is mostly starting a process with isolation applied" },
          { id: "c", text: "They skip loading any files" },
          { id: "d", text: "They run on a special container CPU" },
        ],
        correct: ["a", "b"],
        explanation: "Because the kernel is already running, starting a container is mostly setting up isolation and launching a process. Files are still loaded, and no special hardware is involved.",
      },
    ],
    activity: {
      type: "matching",
      title: "What provides what?",
      instructions: "Match each building block to what it does for a container.",
      pairs: [
        { id: "ns", term: "Namespaces", definition: "Give the process its own view of PIDs, network, and mounts" },
        { id: "cg", term: "cgroups", definition: "Limit how much CPU and memory the process can use" },
        { id: "fs", term: "Image filesystem", definition: "Decides which files and libraries the process can see" },
        { id: "kernel", term: "Host kernel", definition: "Shared by every container on the machine" },
      ],
      explanation: "Together these turn an ordinary process into a container: isolated view, limited resources, its own files, and the host's kernel underneath.",
    },
  },

  "containers-vs-virtual-machines": {
    objectives: [
      "Compare where containers and VMs draw their isolation boundary",
      "Weigh the trade-offs in size, speed, and isolation strength",
      "Recognise situations where each is the better fit",
    ],
    sections: [
      {
        type: "text",
        heading: "Two ways to isolate workloads",
        paragraphs: [
          "A **virtual machine (VM)** emulates a whole computer. A piece of software called a **hypervisor** lets many VMs share physical hardware, and each VM boots its own complete operating system, kernel included.",
          "A **container** isolates at the operating-system level instead. Containers share the host's kernel and only package the application and the user-space files it needs.",
        ],
      },
      { type: "diagram", diagram: "container-vs-vm", caption: "VMs each carry a guest OS. Containers share the host kernel through a container runtime." },
      {
        type: "list",
        heading: "Trade-offs at a glance",
        items: [
          "**Size**: VM images are often gigabytes because they include an OS. Container images are often tens to hundreds of megabytes.",
          "**Startup**: VMs boot an OS, which takes tens of seconds or more. Containers start a process, usually in about a second.",
          "**Density**: one host can run many more containers than VMs.",
          "**Isolation**: a VM's hypervisor boundary is stronger. Containers share a kernel, so a kernel vulnerability can affect all of them.",
          "**Flexibility**: a VM can run a different OS kernel (e.g. Windows on a Linux host). A Linux container needs a Linux kernel.",
        ],
      },
      {
        type: "callout",
        tone: "tip",
        title: "They are often used together",
        body: "It's not either/or. Cloud providers commonly run containers inside VMs: the VM gives strong tenant isolation, and containers give fast, dense packaging of apps on top.",
      },
      {
        type: "analogy",
        title: "Analogy: houses and apartments",
        body: "VMs are like separate houses: each has its own foundation, plumbing, and wiring (its own OS). Containers are like apartments in one building: they share the foundation and main utilities (the kernel) but each has its own locked front door and rooms.",
      },
    ],
    keyTakeaways: [
      "VMs virtualise hardware and run a full guest OS; containers share the host kernel.",
      "Containers are smaller, faster to start, and denser; VMs offer stronger isolation.",
      "In practice, containers frequently run inside VMs.",
    ],
    quizQuestions: [
      {
        id: "q1",
        prompt: "What does every traditional VM include that a container image does not?",
        kind: "single",
        options: [
          { id: "a", text: "Application code" },
          { id: "b", text: "Its own operating system kernel" },
          { id: "c", text: "Configuration files" },
          { id: "d", text: "Network access" },
        ],
        correct: ["b"],
        explanation: "A VM boots its own guest OS, kernel included. Containers rely on the host's kernel.",
      },
      {
        id: "q2",
        prompt: "You must run completely untrusted code from many customers on shared hardware. Which statement is most accurate?",
        kind: "single",
        options: [
          { id: "a", text: "Containers alone always give the strongest isolation" },
          { id: "b", text: "VM-level isolation (possibly with containers inside) gives a stronger boundary" },
          { id: "c", text: "Isolation is not possible on shared hardware" },
          { id: "d", text: "Running everything as root is fine" },
        ],
        correct: ["b"],
        explanation: "Because containers share a kernel, VM boundaries are generally considered stronger for hostile multi-tenant workloads.",
      },
      {
        id: "q3",
        prompt: "Which are typical advantages of containers over VMs? Select all that apply.",
        kind: "multiple",
        options: [
          { id: "a", text: "Faster startup" },
          { id: "b", text: "Smaller images" },
          { id: "c", text: "Ability to run a different kernel than the host" },
          { id: "d", text: "More workloads per host" },
        ],
        correct: ["a", "b", "d"],
        explanation: "Containers are faster, smaller, and denser. Running a different kernel is something VMs can do and containers cannot.",
      },
    ],
    activity: {
      type: "classify",
      title: "Container or VM?",
      instructions: "Decide which technology each statement describes.",
      buckets: [
        { id: "container", label: "Container" },
        { id: "vm", label: "Virtual machine" },
      ],
      items: [
        { id: "kernel", label: "Shares the host's kernel", bucket: "container" },
        { id: "guest", label: "Boots a full guest operating system", bucket: "vm" },
        { id: "fast", label: "Usually starts in about a second", bucket: "container" },
        { id: "hyper", label: "Relies on a hypervisor", bucket: "vm" },
        { id: "mb", label: "Image often measured in megabytes", bucket: "container" },
        { id: "otheros", label: "Can run a different OS kernel than the host", bucket: "vm" },
      ],
      explanation: "The deciding question is usually: does it bring its own kernel? VMs do, containers don't.",
    },
  },

  "images-vs-containers": {
    objectives: [
      "Distinguish an image (template) from a container (instance)",
      "Explain the container's writable layer",
      "Read image names in repository:tag form",
    ],
    sections: [
      {
        type: "text",
        heading: "Template and instance",
        paragraphs: [
          "An **image** is a read-only template. It contains a filesystem (your app, its dependencies, and some OS files) plus metadata such as the default command to run.",
          "A **container** is an instance created from an image. When you start a container, Docker adds a thin **writable layer** on top of the image's read-only layers and starts the image's command as an isolated process. A container can be running or stopped, but it is still a container until you remove it.",
        ],
      },
      { type: "diagram", diagram: "image-container-lifecycle", caption: "One image can produce many containers. Each container gets its own writable layer." },
      {
        type: "analogy",
        title: "Analogy: a class and its objects",
        body: "If you program, think of an image as a class and containers as objects created from it. You can create many objects from one class, each with its own state, and changing an object does not change the class.",
      },
      {
        type: "text",
        heading: "Changes stay in the container",
        paragraphs: [
          "Files you create or edit inside a running container are written to that container's writable layer. The image is never modified. If you remove the container, its writable layer and those changes are deleted too.",
          "That is why important data, like a database's files, should be stored in a **volume** (covered later), not in the writable layer.",
        ],
      },
      {
        type: "code",
        language: "bash",
        simulated: true,
        caption: "Images are named repository:tag. Without a tag, Docker assumes latest.",
        code: `$ docker images
REPOSITORY   TAG       IMAGE ID       CREATED       SIZE
nginx        latest    4f67c83422ec   2 weeks ago   192MB
redis        7         a3b1c2d4e5f6   2 weeks ago   117MB`,
      },
      {
        type: "callout",
        tone: "warning",
        title: "“latest” is just a name",
        body: "The tag `latest` does not guarantee the newest version. It is simply the default tag. For anything important, pin a specific tag such as `nginx:1.27`.",
      },
    ],
    keyTakeaways: [
      "An image is a read-only template; a container is a running or stopped instance of it.",
      "Each container has its own writable layer, which is deleted when the container is removed.",
      "Image names follow repository:tag, and latest is only the default tag.",
    ],
    quizQuestions: [
      {
        id: "q1",
        prompt: "You start three containers from the same nginx image. How many images and containers exist?",
        kind: "single",
        options: [
          { id: "a", text: "Three images, three containers" },
          { id: "b", text: "One image, three containers" },
          { id: "c", text: "One image, one container" },
          { id: "d", text: "Three images, one container" },
        ],
        correct: ["b"],
        explanation: "Containers are instances. One image can be the template for any number of containers.",
      },
      {
        id: "q2",
        prompt: "You edit a config file inside a running container, then remove the container. What happens to the edit?",
        kind: "single",
        options: [
          { id: "a", text: "It is saved into the image automatically" },
          { id: "b", text: "It is deleted with the container's writable layer" },
          { id: "c", text: "It is uploaded to the registry" },
          { id: "d", text: "It moves to every other container" },
        ],
        correct: ["b"],
        explanation: "Changes live in the container's writable layer. Removing the container removes them. Images are never modified by running containers.",
      },
      {
        id: "q3",
        prompt: "Which statements about a stopped container are true? Select all that apply.",
        kind: "multiple",
        options: [
          { id: "a", text: "It still exists until you remove it" },
          { id: "b", text: "It keeps its writable layer" },
          { id: "c", text: "It can be started again" },
          { id: "d", text: "It turns back into an image" },
        ],
        correct: ["a", "b", "c"],
        explanation: "A stopped container keeps its configuration and writable layer, and `docker start` can run it again. It does not become an image.",
      },
    ],
    activity: {
      type: "classify",
      title: "Image or container?",
      instructions: "Sort each statement under the concept it describes.",
      buckets: [
        { id: "image", label: "Image" },
        { id: "container", label: "Container" },
      ],
      items: [
        { id: "ro", label: "Read-only template", bucket: "image" },
        { id: "rw", label: "Has its own writable layer", bucket: "container" },
        { id: "state", label: "Can be running or stopped", bucket: "container" },
        { id: "tag", label: "Identified by repository:tag", bucket: "image" },
        { id: "many", label: "Many can be created from one of the other", bucket: "container" },
        { id: "registry", label: "Stored in and pulled from a registry", bucket: "image" },
      ],
      explanation: "Images are the shareable, read-only templates; containers are the live, stateful instances created from them.",
    },
  },

  "first-docker-workflow": {
    objectives: [
      "Run the core workflow: pull, run, list, stop, remove",
      "Read the output of docker images and docker ps",
      "Clean up containers you no longer need",
    ],
    sections: [
      {
        type: "text",
        heading: "The loop you will use every day",
        paragraphs: [
          "Almost every Docker session follows the same loop: get an image, create a container from it, check it is running, and remove it when you are done. In this lesson you will do exactly that in a **simulated** terminal. No real containers run; the browser imitates Docker's behaviour so you can practise safely.",
        ],
      },
      { type: "diagram", diagram: "registry-flow", caption: "pull downloads an image from a registry; run creates and starts a container from it." },
      {
        type: "code",
        language: "bash",
        caption: "The five commands of the basic workflow.",
        code: `docker pull nginx                         # download the image
docker run -d --name web -p 8080:80 nginx # create + start a container
docker ps                                 # list running containers
docker stop web                           # stop it gracefully
docker rm web                             # remove the stopped container`,
      },
      {
        type: "list",
        heading: "What the run flags mean",
        items: [
          "`-d` (detached): run in the background and print the container ID.",
          "`--name web`: give the container a memorable name instead of a random one.",
          "`-p 8080:80`: publish container port 80 on host port 8080 (HOST:CONTAINER).",
        ],
      },
      {
        type: "callout",
        tone: "tip",
        title: "docker run pulls for you",
        body: "If the image is not available locally, `docker run` pulls it first. Running `docker pull` separately is still useful when you want to download ahead of time or update a tag.",
      },
    ],
    keyTakeaways: [
      "pull downloads an image; run creates and starts a container from it.",
      "docker ps lists running containers; add -a to include stopped ones.",
      "stop ends the process gracefully; rm deletes the stopped container.",
    ],
    quizQuestions: [
      {
        id: "q1",
        prompt: "What does `-p 8080:80` mean in `docker run -p 8080:80 nginx`?",
        kind: "single",
        options: [
          { id: "a", text: "Container port 8080 is mapped to host port 80" },
          { id: "b", text: "Host port 8080 is mapped to container port 80" },
          { id: "c", text: "Use 8080 MB of memory and 80% CPU" },
          { id: "d", text: "Start 80 containers on port 8080" },
        ],
        correct: ["b"],
        explanation: "The format is HOST:CONTAINER. Requests to port 8080 on the host are forwarded to port 80 inside the container.",
      },
      {
        id: "q2",
        prompt: "After `docker stop web`, the container no longer appears in `docker ps`. Where is it?",
        kind: "single",
        options: [
          { id: "a", text: "It was deleted automatically" },
          { id: "b", text: "It still exists in a stopped state; `docker ps -a` shows it" },
          { id: "c", text: "It was pushed back to the registry" },
          { id: "d", text: "It became a new image" },
        ],
        correct: ["b"],
        explanation: "`docker ps` shows only running containers. Stopped containers remain until you `docker rm` them.",
      },
      {
        id: "q3",
        prompt: "Which flag runs a container in the background?",
        kind: "single",
        options: [
          { id: "a", text: "-b" },
          { id: "b", text: "--background" },
          { id: "c", text: "-d" },
          { id: "d", text: "-p" },
        ],
        correct: ["c"],
        explanation: "`-d` (or `--detach`) runs the container in the background and prints its ID.",
      },
    ],
    activity: {
      type: "terminal",
      title: "Your first container",
      instructions: "Work through the checklist in the simulated terminal. Click a hint if you get stuck.",
      mode: "docker",
      scenario: "docker-empty",
      steps: [
        { id: "pull", instruction: "Pull the nginx image.", hint: "docker pull nginx", goal: { kind: "docker-image-present", image: "nginx:latest" } },
        { id: "images", instruction: "List your local images.", hint: "docker images", goal: { kind: "command", pattern: "^docker (images|image ls)\\b" } },
        { id: "run", instruction: "Run nginx in the background as \"web\" on host port 8080.", hint: "docker run -d --name web -p 8080:80 nginx", goal: { kind: "docker-container", state: "running", name: "web", hostPort: 8080, containerPort: 80 } },
        { id: "ps", instruction: "List running containers.", hint: "docker ps", goal: { kind: "command", pattern: "^docker (ps|container ls)\\b" } },
        { id: "stop", instruction: "Stop the web container.", hint: "docker stop web", goal: { kind: "command", pattern: "^docker stop web$" } },
        { id: "rm", instruction: "Remove it.", hint: "docker rm web", goal: { kind: "docker-container", state: "removed", name: "web" } },
      ],
      explanation: "You completed the full lifecycle: image downloaded, container created and run, inspected, stopped, and removed. The image is still there for next time.",
    },
  },
};
