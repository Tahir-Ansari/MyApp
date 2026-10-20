import type { LessonContent } from "../types";

export const dockerModule3: Record<string, LessonContent> = {
  "what-a-dockerfile-does": {
    objectives: [
      "Describe a Dockerfile as a build recipe",
      "Follow the path from Dockerfile to image to container",
      "Know which commands belong to build time and which to run time",
    ],
    sections: [
      {
        type: "text",
        heading: "From recipe to running app",
        paragraphs: [
          "So far you have used images other people built. To package your own app, you write a **Dockerfile**: a plain text file with one instruction per line, describing how to assemble an image step by step.",
          "`docker build` reads the Dockerfile, executes its instructions in order, and produces an image. `docker run` then creates containers from that image.",
        ],
      },
      { type: "diagram", diagram: "dockerfile-pipeline", caption: "Dockerfile → docker build → image → docker run → container." },
      {
        type: "code",
        language: "dockerfile",
        filename: "Dockerfile",
        caption: "A minimal Dockerfile for a static website",
        code: `# Start from an existing image that already has nginx
FROM nginx:1.27

# Copy our site into the folder nginx serves
COPY ./site /usr/share/nginx/html`,
      },
      {
        type: "text",
        heading: "Build time vs. run time",
        paragraphs: [
          "Instructions such as `RUN npm install` execute **once, at build time**, and their results are saved in the image. Instructions such as `CMD` only **record** what should happen later, when a container starts.",
          "Keeping this distinction clear avoids a classic confusion: a `RUN` command does not run again every time a container starts.",
        ],
      },
      {
        type: "callout",
        tone: "tip",
        title: "Dockerfiles are code",
        body: "Commit your Dockerfile to version control next to your app. Anyone, including CI servers, can then rebuild the exact same image.",
      },
    ],
    keyTakeaways: [
      "A Dockerfile is a recipe of instructions for building an image.",
      "docker build turns a Dockerfile into an image; docker run makes containers from it.",
      "RUN executes at build time; CMD records the default command for run time.",
    ],
    quizQuestions: [
      {
        id: "q1",
        prompt: "What does `docker build` produce?",
        kind: "single",
        options: [
          { id: "a", text: "A running container" },
          { id: "b", text: "An image" },
          { id: "c", text: "A virtual machine" },
          { id: "d", text: "A Dockerfile" },
        ],
        correct: ["b"],
        explanation: "docker build executes the Dockerfile's instructions and saves the result as an image.",
      },
      {
        id: "q2",
        prompt: "A Dockerfile contains `RUN npm install`. When does that command execute?",
        kind: "single",
        options: [
          { id: "a", text: "Every time a container starts" },
          { id: "b", text: "Once, during docker build" },
          { id: "c", text: "Only when you run docker exec" },
          { id: "d", text: "Never; RUN is a comment" },
        ],
        correct: ["b"],
        explanation: "RUN executes during the build, and its results become part of the image.",
      },
      {
        id: "q3",
        prompt: "Which are good reasons to keep a Dockerfile in version control? Select all that apply.",
        kind: "multiple",
        options: [
          { id: "a", text: "Teammates and CI can rebuild the same image" },
          { id: "b", text: "Changes to the environment are reviewed like code" },
          { id: "c", text: "It makes images smaller automatically" },
          { id: "d", text: "History shows when dependencies changed" },
        ],
        correct: ["a", "b", "d"],
        explanation: "A versioned Dockerfile makes the environment reproducible and reviewable. It does not shrink images by itself.",
      },
    ],
    activity: {
      type: "matching",
      title: "Name the stage",
      instructions: "Match each term to its role in the build pipeline.",
      pairs: [
        { id: "df", term: "Dockerfile", definition: "Text file listing the build instructions" },
        { id: "build", term: "docker build", definition: "Executes the instructions and produces an image" },
        { id: "img", term: "Image", definition: "Read-only result that can be shared and run" },
        { id: "run", term: "docker run", definition: "Creates and starts a container from an image" },
        { id: "ctx", term: "Build context", definition: "The set of files sent to the builder" },
      ],
      explanation: "Recipe → builder → artifact → runtime. The build context supplies the files that COPY can use.",
    },
  },

  "dockerfile-core-instructions": {
    objectives: [
      "Use FROM to choose a base image",
      "Use WORKDIR, COPY, and RUN correctly",
      "Read a complete small Dockerfile line by line",
    ],
    sections: [
      {
        type: "text",
        heading: "Four instructions do most of the work",
        paragraphs: [
          "Most Dockerfiles you read will be built from a handful of instructions. Learn these four first.",
        ],
      },
      {
        type: "list",
        items: [
          "`FROM image:tag`: the starting point. Every Dockerfile begins with a base image, such as `node:20-alpine` or `python:3.12-slim`, that already contains a runtime.",
          "`WORKDIR /app`: sets the working directory for later instructions and for the container. It creates the folder if needed. Prefer it over `RUN cd ...`, which does not persist between instructions.",
          "`COPY src dest`: copies files from the build context into the image.",
          "`RUN command`: runs a shell command at build time, such as installing dependencies, and saves the result as a new layer.",
        ],
      },
      {
        type: "code",
        language: "dockerfile",
        filename: "Dockerfile",
        caption: "A typical Node.js Dockerfile",
        code: `FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]`,
      },
      { type: "diagram", diagram: "dockerfile-pipeline", caption: "Each instruction runs in order; filesystem changes become layers in the image." },
      {
        type: "text",
        heading: "Two more you will see often",
        paragraphs: [
          "`ENV KEY=value` sets an environment variable in the image (and in containers made from it). `EXPOSE 3000` documents the port the app listens on. As you know, it does not publish it.",
        ],
      },
      {
        type: "callout",
        tone: "warning",
        title: "Each RUN is its own step",
        body: "`RUN cd /app` followed by `RUN npm install` does not run npm in /app: each RUN starts fresh from the WORKDIR. Use WORKDIR, or chain commands with && in a single RUN.",
      },
    ],
    keyTakeaways: [
      "FROM picks the base image and must come first.",
      "WORKDIR sets the working folder; COPY brings files in from the build context.",
      "RUN executes commands at build time and creates layers.",
    ],
    quizQuestions: [
      {
        id: "q1",
        prompt: "Which instruction must appear first (aside from comments and build arguments)?",
        kind: "single",
        options: [
          { id: "a", text: "RUN" },
          { id: "b", text: "COPY" },
          { id: "c", text: "FROM" },
          { id: "d", text: "CMD" },
        ],
        correct: ["c"],
        explanation: "FROM sets the base image that every later instruction builds on.",
      },
      {
        id: "q2",
        prompt: "Where does COPY take its source files from?",
        kind: "single",
        options: [
          { id: "a", text: "Anywhere on your hard drive" },
          { id: "b", text: "The build context sent to docker build" },
          { id: "c", text: "Docker Hub" },
          { id: "d", text: "The running container" },
        ],
        correct: ["b"],
        explanation: "COPY can only see files inside the build context, usually the folder you pass as `.`.",
      },
      {
        id: "q3",
        prompt: "Which statements are correct? Select all that apply.",
        kind: "multiple",
        options: [
          { id: "a", text: "WORKDIR creates the directory if it doesn't exist" },
          { id: "b", text: "`RUN cd /app` changes the directory for later RUN instructions" },
          { id: "c", text: "ENV sets environment variables available in the container" },
          { id: "d", text: "EXPOSE publishes the port to the host" },
        ],
        correct: ["a", "c"],
        explanation: "WORKDIR persists and creates the folder; ENV values carry into containers. `RUN cd` doesn't persist, and EXPOSE only documents.",
      },
    ],
    activity: {
      type: "matching",
      title: "Instruction cheat sheet",
      instructions: "Match each instruction to what it does.",
      pairs: [
        { id: "from", term: "FROM", definition: "Choose the base image to build on" },
        { id: "workdir", term: "WORKDIR", definition: "Set the working directory for later steps" },
        { id: "copy", term: "COPY", definition: "Bring files from the build context into the image" },
        { id: "run", term: "RUN", definition: "Execute a command at build time" },
        { id: "env", term: "ENV", definition: "Set an environment variable" },
        { id: "expose", term: "EXPOSE", definition: "Document the port the app listens on" },
      ],
      explanation: "With these six you can read most real-world Dockerfiles.",
    },
  },

  "cmd-vs-entrypoint": {
    objectives: [
      "Explain what CMD and ENTRYPOINT each contribute",
      "Predict what runs when you pass arguments to docker run",
      "Prefer the exec (JSON array) form",
    ],
    sections: [
      {
        type: "text",
        heading: "Who decides what runs?",
        paragraphs: [
          "When a container starts, Docker runs one main command. Two instructions shape it. **CMD** provides the default command or default arguments, and it is easy to override: anything you type after the image name in `docker run` replaces it. **ENTRYPOINT** fixes the executable, and arguments from `docker run` are appended to it.",
        ],
      },
      { type: "diagram", diagram: "cmd-entrypoint", caption: "Final command = ENTRYPOINT + (docker run arguments, or CMD if none are given)." },
      {
        type: "code",
        language: "dockerfile",
        caption: "CMD only: easy to override",
        code: `FROM alpine:3.20
CMD ["echo", "hello"]

# docker run img             -> echo hello
# docker run img ls /        -> ls /         (CMD replaced)`,
      },
      {
        type: "code",
        language: "dockerfile",
        caption: "ENTRYPOINT + CMD: fixed program, default arguments",
        code: `FROM alpine:3.20
ENTRYPOINT ["ping", "-c", "3"]
CMD ["localhost"]

# docker run img             -> ping -c 3 localhost
# docker run img example.com -> ping -c 3 example.com   (CMD replaced, ENTRYPOINT kept)`,
      },
      {
        type: "callout",
        tone: "tip",
        title: "Use the exec form",
        body: "Write `CMD [\"node\", \"server.js\"]` (JSON array) rather than `CMD node server.js` (shell form). The exec form makes your app PID 1, so it receives stop signals directly and shuts down cleanly.",
      },
      {
        type: "text",
        heading: "A practical rule of thumb",
        paragraphs: [
          "For most application images, a single `CMD` is enough. Reach for `ENTRYPOINT` when the image is a wrapper around one tool and users should only supply its arguments. You can still override an ENTRYPOINT with `docker run --entrypoint`, but that is a deliberate escape hatch.",
        ],
      },
    ],
    keyTakeaways: [
      "CMD sets defaults that docker run arguments replace.",
      "ENTRYPOINT sets the executable; docker run arguments are appended.",
      "Prefer the exec (JSON array) form so your app receives signals.",
    ],
    quizQuestions: [
      {
        id: "q1",
        prompt: "An image has `CMD [\"npm\", \"start\"]`. What runs with `docker run img npm test`?",
        kind: "single",
        options: [
          { id: "a", text: "npm start npm test" },
          { id: "b", text: "npm test" },
          { id: "c", text: "npm start" },
          { id: "d", text: "Nothing; it errors" },
        ],
        correct: ["b"],
        explanation: "Arguments after the image name replace CMD entirely.",
      },
      {
        id: "q2",
        prompt: "An image has `ENTRYPOINT [\"curl\"]` and `CMD [\"--help\"]`. What runs with `docker run img https://example.com`?",
        kind: "single",
        options: [
          { id: "a", text: "curl --help" },
          { id: "b", text: "curl https://example.com" },
          { id: "c", text: "https://example.com" },
          { id: "d", text: "curl --help https://example.com" },
        ],
        correct: ["b"],
        explanation: "The run argument replaces CMD and is appended to the ENTRYPOINT.",
      },
      {
        id: "q3",
        prompt: "Why is `CMD [\"node\", \"server.js\"]` preferred over `CMD node server.js`? Select all that apply.",
        kind: "multiple",
        options: [
          { id: "a", text: "The app runs as PID 1 and receives stop signals directly" },
          { id: "b", text: "Graceful shutdown with docker stop works reliably" },
          { id: "c", text: "It makes the image smaller" },
          { id: "d", text: "It avoids wrapping the process in an extra shell" },
        ],
        correct: ["a", "b", "d"],
        explanation: "The exec form skips the shell wrapper, so signals reach your app. It doesn't change the image size meaningfully.",
      },
    ],
    activity: {
      type: "scenario",
      title: "Predict the command",
      symptom: "You maintain a small image that wraps a ping tool.",
      context: {
        label: "Dockerfile",
        language: "dockerfile",
        code: `FROM alpine:3.20
ENTRYPOINT ["ping", "-c", "3"]
CMD ["localhost"]`,
      },
      question: "What does `docker run pinger example.com` execute?",
      options: [
        { id: "a", text: "ping -c 3 localhost", correct: false, feedback: "That runs when you give no arguments. Your argument replaces CMD." },
        { id: "b", text: "ping -c 3 example.com", correct: true, feedback: "Correct: ENTRYPOINT stays, and your argument replaces the default CMD." },
        { id: "c", text: "example.com", correct: false, feedback: "That would only happen if there were no ENTRYPOINT." },
        { id: "d", text: "ping -c 3 localhost example.com", correct: false, feedback: "CMD is replaced, not combined, when you pass arguments." },
      ],
      explanation: "ENTRYPOINT is the fixed part; CMD is the overridable default.",
    },
  },

  "build-context-and-layers": {
    objectives: [
      "Explain what the build context is and why its size matters",
      "Use .dockerignore to keep junk and secrets out",
      "Order instructions to get the most from the layer cache",
    ],
    sections: [
      {
        type: "text",
        heading: "The build context",
        paragraphs: [
          "The `.` at the end of `docker build -t app .` is the **build context**: the folder whose files Docker sends to the builder. COPY can only see files inside it. If the folder contains `node_modules`, `.git`, or large data files, they are all sent too, which slows builds and risks leaking secrets into images.",
        ],
      },
      {
        type: "code",
        language: "text",
        filename: ".dockerignore",
        caption: "Patterns listed here are excluded from the build context",
        code: `node_modules
.git
*.log
.env`,
      },
      {
        type: "callout",
        tone: "warning",
        title: "Keep secrets out of images",
        body: "Anything copied into an image can be extracted by anyone who has the image, even if a later step deletes it. Never COPY `.env` files or keys. Supply secrets at run time instead.",
      },
      { type: "diagram", diagram: "image-layers", caption: "Each instruction that changes files adds a layer. Unchanged layers are reused from cache." },
      {
        type: "text",
        heading: "Layers and the cache",
        paragraphs: [
          "Each filesystem-changing instruction (RUN, COPY, ADD) creates a **layer**. On the next build, Docker reuses a cached layer if the instruction and its inputs are unchanged. Once one step changes, **every step after it must be rebuilt**.",
          "So put things that change rarely (base image, dependency installation) first, and things that change often (your source code) last. Copying `package.json` and installing dependencies before `COPY . .` means editing code doesn't trigger a slow reinstall.",
        ],
      },
      {
        type: "code",
        language: "dockerfile",
        caption: "Cache-friendly ordering",
        code: `FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./   # changes rarely
RUN npm ci --omit=dev                    # cached unless dependencies change
COPY . .                                 # changes on every commit`,
      },
    ],
    keyTakeaways: [
      "The build context is everything sent to the builder; keep it small.",
      ".dockerignore excludes files such as node_modules, .git, and .env.",
      "A changed layer invalidates every layer after it, so order from stable to volatile.",
    ],
    quizQuestions: [
      {
        id: "q1",
        prompt: "You edit one line in server.js and rebuild the cache-friendly Dockerfile above. Which steps re-run?",
        kind: "single",
        options: [
          { id: "a", text: "All of them" },
          { id: "b", text: "Only COPY . . (and anything after it)" },
          { id: "c", text: "Only RUN npm ci" },
          { id: "d", text: "None; Docker ignores source changes" },
        ],
        correct: ["b"],
        explanation: "The dependency layers are unchanged and come from cache. Only the final COPY and later steps rebuild.",
      },
      {
        id: "q2",
        prompt: "A Dockerfile does `COPY . .` and then `RUN rm .env`. Is the secret safe?",
        kind: "single",
        options: [
          { id: "a", text: "Yes, it was deleted" },
          { id: "b", text: "No, the earlier layer still contains .env and can be extracted" },
          { id: "c", text: "Yes, layers are encrypted" },
          { id: "d", text: "Only if the image is private" },
        ],
        correct: ["b"],
        explanation: "Layers are additive. Deleting a file in a later layer hides it but doesn't remove it from the earlier layer. Exclude it with .dockerignore instead.",
      },
      {
        id: "q3",
        prompt: "What usually belongs in .dockerignore? Select all that apply.",
        kind: "multiple",
        options: [
          { id: "a", text: "node_modules" },
          { id: "b", text: ".git" },
          { id: "c", text: ".env with credentials" },
          { id: "d", text: "package.json" },
        ],
        correct: ["a", "b", "c"],
        explanation: "Dependencies are reinstalled in the image, git history isn't needed, and secrets must stay out. package.json is needed to install dependencies.",
      },
    ],
    activity: {
      type: "classify",
      title: "Ship it or skip it?",
      instructions: "For a Node.js app, decide whether each path should be sent in the build context or excluded with .dockerignore.",
      buckets: [
        { id: "keep", label: "Keep in context" },
        { id: "ignore", label: "Add to .dockerignore" },
      ],
      items: [
        { id: "nm", label: "node_modules/", bucket: "ignore" },
        { id: "git", label: ".git/", bucket: "ignore" },
        { id: "env", label: ".env (contains API keys)", bucket: "ignore" },
        { id: "server", label: "server.js", bucket: "keep" },
        { id: "pkg", label: "package.json", bucket: "keep" },
        { id: "log", label: "debug.log", bucket: "ignore" },
      ],
      explanation: "Send only what the build needs. Smaller contexts build faster and can't leak what was never sent.",
    },
  },

  "build-a-web-app-image": {
    objectives: [
      "Build and tag an image from a real Dockerfile",
      "Run the image and reach the app through a published port",
      "Notice the layer cache on a rebuild",
    ],
    sections: [
      {
        type: "text",
        heading: "The project",
        paragraphs: [
          "The simulated project folder contains a tiny Node.js web server (`server.js`), a `package.json`, a `.dockerignore`, and the Dockerfile from the previous lessons. You will build it into an image named `demo-app`, run it, and check it responds.",
        ],
      },
      {
        type: "code",
        language: "bash",
        caption: "The plan",
        code: `cat Dockerfile                                  # read the recipe
docker build -t demo-app .                      # build and tag
docker images                                   # see the new image
docker run -d --name demo -p 3000:3000 demo-app # run it
curl localhost:3000                             # talk to it`,
      },
      { type: "diagram", diagram: "dockerfile-pipeline", caption: "You will walk the whole pipeline yourself." },
      {
        type: "list",
        heading: "What to look for",
        items: [
          "In the build output, each numbered step matches a filesystem instruction in the Dockerfile.",
          "Build a second time: steps after FROM show `CACHED` because nothing changed.",
          "`docker images` lists `demo-app` with tag `latest` because you passed no tag after the name.",
        ],
      },
      {
        type: "callout",
        tone: "tip",
        title: "Tag versions",
        body: "In real projects tag builds with a version or commit, e.g. `docker build -t demo-app:1.0 .`, and keep `latest` only as a convenience.",
      },
    ],
    keyTakeaways: [
      "docker build -t NAME . builds the current folder and tags the result.",
      "Rebuilding without changes reuses every cached layer.",
      "Publish the port your app listens on to reach it from the host.",
    ],
    quizQuestions: [
      {
        id: "q1",
        prompt: "You run `docker build .` with no -t. How is the image listed?",
        kind: "single",
        options: [
          { id: "a", text: "As the folder name" },
          { id: "b", text: "With repository and tag <none>" },
          { id: "c", text: "As latest:latest" },
          { id: "d", text: "It isn't saved" },
        ],
        correct: ["b"],
        explanation: "Without a tag the image exists but has no name, shown as <none>:<none>. Use -t to name it.",
      },
      {
        id: "q2",
        prompt: "The demo app listens on port 3000. Which run command lets you open http://localhost:3000?",
        kind: "single",
        options: [
          { id: "a", text: "docker run -d demo-app" },
          { id: "b", text: "docker run -d -p 3000:3000 demo-app" },
          { id: "c", text: "docker run -d --expose 3000 demo-app" },
          { id: "d", text: "docker build -p 3000 ." },
        ],
        correct: ["b"],
        explanation: "You must publish the container port to the host with -p.",
      },
      {
        id: "q3",
        prompt: "A rebuild shows `CACHED` for most steps. What does that tell you? Select all that apply.",
        kind: "multiple",
        options: [
          { id: "a", text: "Those layers were reused from a previous build" },
          { id: "b", text: "The instructions and their inputs didn't change" },
          { id: "c", text: "The build failed" },
          { id: "d", text: "The build finished faster" },
        ],
        correct: ["a", "b", "d"],
        explanation: "CACHED means Docker reused a stored layer, which makes builds much faster.",
      },
    ],
    activity: {
      type: "terminal",
      title: "Build, run, verify",
      instructions: "Build the demo app and prove it serves requests.",
      mode: "docker",
      scenario: "docker-build",
      steps: [
        { id: "cat", instruction: "Read the Dockerfile.", hint: "cat Dockerfile", goal: { kind: "command", pattern: "^cat Dockerfile$" } },
        { id: "build", instruction: "Build the image, tagged demo-app.", hint: "docker build -t demo-app .", goal: { kind: "docker-image-present", image: "demo-app:latest" } },
        { id: "run", instruction: "Run it as demo, publishing port 3000.", hint: "docker run -d --name demo -p 3000:3000 demo-app", goal: { kind: "docker-container", state: "running", image: "demo-app", hostPort: 3000, containerPort: 3000 } },
        { id: "curl", instruction: "Request the app from the host.", hint: "curl localhost:3000", goal: { kind: "command", pattern: "^curl (https?://)?(localhost|127\\.0\\.0\\.1):3000" } },
      ],
      explanation: "You built an image from source, ran it, and reached it through a published port, which is the core loop of containerising an app.",
    },
  },
};
