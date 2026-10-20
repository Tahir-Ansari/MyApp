import type { Activity, Difficulty, TrackId } from "@/lib/curriculum/types";

export interface Challenge {
  id: string;
  title: string;
  track: TrackId;
  difficulty: Difficulty;
  estimatedMinutes: number;
  goal: string;
  description: string;
  tags: string[];
  hints: string[];
  steps: Activity[];
  solution: string;
  relatedLesson: string;
}

export const CHALLENGES: Challenge[] = [
  {
    id: "find-running-container",
    title: "Find the running container",
    track: "docker",
    difficulty: "beginner",
    estimatedMinutes: 2,
    goal: "Work out which container is serving the website on host port 8080.",
    description: "A teammate's machine has several containers, some running and some stopped. Use the terminal to find out what is actually serving traffic.",
    tags: ["docker ps"],
    hints: [
      "`docker ps` lists running containers only. `docker ps -a` includes stopped ones.",
      "Look at the PORTS column for `0.0.0.0:8080->80/tcp`.",
    ],
    steps: [
      {
        type: "terminal",
        title: "Inspect the machine",
        instructions: "List the containers that are currently running.",
        mode: "docker",
        scenario: "docker-mixed",
        steps: [
          { id: "ps", instruction: "List running containers.", hint: "docker ps",goal: { kind: "command", pattern: "^docker (container )?(ps|ls|list)\\b" } },
        ],
        explanation: "`docker ps` shows running containers with their published ports. Stopped containers are hidden unless you add -a.",
      },
      {
        type: "scenario",
        title: "Read the output",
        symptom: "Someone opened http://localhost:8080 and saw a welcome page.",
        question: "Which container served that page?",
        options: [
          { id: "a", text: "shop-frontend", correct: true, feedback: "Right. Its PORTS column shows 0.0.0.0:8080->80/tcp, so host port 8080 forwards to nginx on port 80." },
          { id: "b", text: "cache", correct: false, feedback: "cache is running Redis on 6379/tcp, and that port is not published to the host at all." },
          { id: "c", text: "report-job", correct: false, feedback: "report-job is not running. It exited after finishing its task." },
          { id: "d", text: "legacy-api", correct: false, feedback: "legacy-api exited with code 1. It is not running, so it cannot serve anything." },
        ],
        explanation: "Match the host port in the URL against the HOST side of each container's port mapping.",
      },
    ],
    solution: "Run `docker ps`. Only shop-frontend and cache are running, and only shop-frontend publishes host port 8080 (to container port 80).",
    relatedLesson: "inspect-running-containers",
  },
  {
    id: "match-docker-concepts",
    title: "Match Docker concepts",
    track: "docker",
    difficulty: "beginner",
    estimatedMinutes: 2,
    goal: "Match each Docker term to what it actually is.",
    description: "A quick check of the core vocabulary you will use every day.",
    tags: ["concepts"],
    hints: ["An image is a template; a container is created from it.", "A registry stores images, the way a package registry stores packages."],
    steps: [
      {
        type: "matching",
        title: "Terms and definitions",
        instructions: "Pick a term, then pick the definition that matches it.",
        pairs: [
          { id: "image", term: "Image", definition: "A read-only template containing an app and its filesystem" },
          { id: "container", term: "Container", definition: "An isolated process created from an image" },
          { id: "registry", term: "Registry", definition: "A service that stores and distributes images" },
          { id: "dockerfile", term: "Dockerfile", definition: "A text recipe of instructions to build an image" },
          { id: "volume", term: "Volume", definition: "Docker-managed storage that outlives containers" },
        ],
        explanation: "You build an image from a Dockerfile, push it to a registry, and run containers from it. Data that must last goes in a volume.",
      },
    ],
    solution: "Image → template; Container → running instance; Registry → image storage; Dockerfile → build recipe; Volume → persistent storage.",
    relatedLesson: "images-vs-containers",
  },
  {
    id: "publish-port-8080",
    title: "Publish the web server on port 8080",
    track: "docker",
    difficulty: "beginner",
    estimatedMinutes: 3,
    goal: "Run nginx so that http://localhost:8080 on the host reaches it.",
    description: "nginx listens on port 80 inside its container. Make it reachable from the host on port 8080.",
    tags: ["ports"],
    hints: ["Use -d to run in the background and --name web to name it.", "Port mapping is -p HOST:CONTAINER, so here it is -p 8080:80."],
    steps: [
      {
        type: "terminal",
        title: "Run and verify",
        instructions: "Start the container, then check that it answers.",
        mode: "docker",
        scenario: "docker-with-images",
        steps: [
          {
            id: "run",
            instruction: "Run nginx in the background as \"web\", publishing host port 8080 to container port 80.",
            hint: "docker run -d --name web -p 8080:80 nginx",
            goal: { kind: "docker-container", state: "running", name: "web", image: "nginx", hostPort: 8080, containerPort: 80 },
          },
          { id: "curl", instruction: "Request the page from the host.", hint: "curl localhost:8080", goal: { kind: "command", pattern: "^curl (https?://)?(localhost|127\\.0\\.0\\.1):8080" } },
        ],
        explanation: "-p 8080:80 tells Docker to forward host port 8080 to port 80 inside the container, where nginx listens.",
      },
    ],
    solution: "`docker run -d --name web -p 8080:80 nginx`, then `curl localhost:8080`.",
    relatedLesson: "run-names-and-ports",
  },
  {
    id: "build-simple-image",
    title: "Build a simple image",
    track: "docker",
    difficulty: "intermediate",
    estimatedMinutes: 5,
    goal: "Put a Dockerfile in a sensible order, then build and run the image.",
    description: "A small Node.js app needs an image. First order the Dockerfile instructions, then build and run it in the terminal.",
    tags: ["dockerfile", "build"],
    hints: [
      "FROM always comes first. Copy package.json and install dependencies before copying the rest of the code, so the install layer can be cached.",
      "Build with `docker build -t demo-app .`. The final `.` is the build context.",
      "The app listens on 3000: `docker run -d -p 3000:3000 --name demo demo-app`.",
    ],
    steps: [
      {
        type: "ordering",
        title: "Order the Dockerfile",
        instructions: "Arrange the instructions from first to last.",
        items: [
          { id: "from", label: "FROM node:20-alpine", detail: "Start from a base image" },
          { id: "workdir", label: "WORKDIR /app", detail: "Set the working directory" },
          { id: "copy-pkg", label: "COPY package.json ./", detail: "Copy the dependency list" },
          { id: "install", label: "RUN npm install --omit=dev", detail: "Install dependencies" },
          { id: "copy-src", label: "COPY . .", detail: "Copy the application code" },
          { id: "cmd", label: 'CMD ["node", "server.js"]', detail: "Default command at runtime" },
        ],
        explanation: "Copying package.json and installing before copying the source means editing code does not invalidate the slow npm install layer.",
      },
      {
        type: "terminal",
        title: "Build and run",
        instructions: "The project folder already contains this Dockerfile. Use `ls` and `cat Dockerfile` if you like.",
        mode: "docker",
        scenario: "docker-build",
        steps: [
          { id: "build", instruction: "Build the image and tag it demo-app.", hint: "docker build -t demo-app .", goal: { kind: "docker-image-present", image: "demo-app:latest" } },
          {
            id: "run",
            instruction: "Run it in the background, publishing port 3000.",
            hint: "docker run -d -p 3000:3000 --name demo demo-app",
            goal: { kind: "docker-container", state: "running", image: "demo-app", hostPort: 3000, containerPort: 3000 },
          },
        ],
        explanation: "docker build turns the Dockerfile into an image; docker run creates a container from it.",
      },
    ],
    solution: "Order: FROM, WORKDIR, COPY package.json, RUN npm install, COPY . ., CMD. Then `docker build -t demo-app .` and `docker run -d -p 3000:3000 --name demo demo-app`.",
    relatedLesson: "build-a-web-app-image",
  },
  {
    id: "keep-data-after-removal",
    title: "Keep data after container removal",
    track: "docker",
    difficulty: "intermediate",
    estimatedMinutes: 5,
    goal: "Prove that a file written to a named volume survives deleting the container.",
    description: "Containers are disposable, and their writable layer is deleted with them. Use a volume so data outlives the container.",
    tags: ["volumes"],
    hints: [
      "Create the volume with `docker volume create notes-data`.",
      "Mount it with -v notes-data:/data.",
      "Write a file with `docker exec notes touch /data/todo.txt`.",
    ],
    steps: [
      {
        type: "terminal",
        title: "Volume round trip",
        instructions: "Follow each step. The checklist updates as you go.",
        mode: "docker",
        scenario: "docker-with-images",
        steps: [
          { id: "vol", instruction: "Create a volume named notes-data.", hint: "docker volume create notes-data", goal: { kind: "docker-volume-exists", name: "notes-data" } },
          { id: "run1", instruction: "Run nginx named notes with the volume mounted at /data.", hint: "docker run -d --name notes -v notes-data:/data nginx", goal: { kind: "docker-container", state: "running", name: "notes", volume: "notes-data" } },
          { id: "touch", instruction: "Create a file inside /data.", hint: "docker exec notes touch /data/todo.txt", goal: { kind: "command", pattern: "^docker exec notes touch /data/\\S+" } },
          { id: "rm", instruction: "Force-remove the notes container.", hint: "docker rm -f notes", goal: { kind: "docker-container", state: "removed", name: "notes" } },
          { id: "run2", instruction: "Start a new container named notes2 using the same volume.", hint: "docker run -d --name notes2 -v notes-data:/data nginx", goal: { kind: "docker-container", state: "running", name: "notes2", volume: "notes-data" } },
          { id: "ls", instruction: "List /data in the new container.", hint: "docker exec notes2 ls /data", goal: { kind: "command", pattern: "^docker exec notes2 ls /data/?$" } },
        ],
        explanation: "The file was written to the volume, not to the container's writable layer, so removing the container did not delete it.",
      },
      {
        type: "scenario",
        title: "Explain it",
        symptom: "todo.txt is still there in notes2.",
        question: "Why did the file survive?",
        options: [
          { id: "a", text: "Docker keeps a backup of every removed container.", correct: false, feedback: "No. `docker rm` deletes the container and its writable layer for good." },
          { id: "b", text: "The file lived in the notes-data volume, which exists independently of any container.", correct: true, feedback: "Exactly. Volumes have their own lifecycle. You delete them explicitly with `docker volume rm`." },
          { id: "c", text: "The file was baked into the nginx image.", correct: false, feedback: "Images are read-only templates. Nothing you write in a running container changes the image." },
        ],
        explanation: "Writable layer: deleted with the container. Volume: kept until you remove the volume.",
      },
    ],
    solution: "Create the volume, mount it with -v notes-data:/data, write a file there, remove the container, mount the same volume in a new container, and the file is still there.",
    relatedLesson: "volumes-and-bind-mounts",
  },
  {
    id: "find-deployment-pods",
    title: "Find the Pods managed by a Deployment",
    track: "kubernetes",
    difficulty: "beginner",
    estimatedMinutes: 3,
    goal: "List only the Pods that belong to the web Deployment.",
    description: "The cluster runs a web Deployment and an api Deployment. Filter the Pods using labels.",
    tags: ["labels"],
    hints: ["`kubectl get deployment web` shows the Deployment.", "Filter Pods by label with -l: `kubectl get pods -l app=web`."],
    steps: [
      {
        type: "terminal",
        title: "Use labels",
        instructions: "Inspect the Deployment, then filter its Pods.",
        mode: "kubernetes",
        scenario: "k8s-running-app",
        steps: [
          { id: "deploy", instruction: "Show the web Deployment.", hint: "kubectl get deployment web", goal: { kind: "command", pattern: "^kubectl get (deploy|deployment|deployments)\\b" } },
          { id: "pods", instruction: "List only Pods labelled app=web.", hint: "kubectl get pods -l app=web", goal: { kind: "command", pattern: "^kubectl get (po|pod|pods)\\b.*(-l|--selector)[ =]app=web" } },
        ],
        explanation: "A Deployment finds its Pods with a label selector. You can use the same selector to find them yourself.",
      },
      {
        type: "scenario",
        title: "How does it know?",
        symptom: "Both Deployments run in the same namespace.",
        question: "How does the web Deployment's ReplicaSet know which Pods are its own?",
        options: [
          { id: "a", text: "By matching Pod labels against its selector (app=web).", correct: true, feedback: "Yes. Selectors match labels. Pods also carry an ownerReference to their ReplicaSet." },
          { id: "b", text: "By Pod name prefix only.", correct: false, feedback: "The name prefix is a convenience for humans. Controllers use labels and owner references." },
          { id: "c", text: "By the node the Pods run on.", correct: false, feedback: "Pods from one Deployment can run on any node." },
        ],
        explanation: "Labels and selectors are how Kubernetes objects find each other.",
      },
    ],
    solution: "`kubectl get pods -l app=web` lists exactly the web Pods, because the Deployment's selector is app=web.",
    relatedLesson: "namespaces-labels-selectors",
  },
  {
    id: "order-k8s-deploy",
    title: "Arrange the deploy workflow",
    track: "kubernetes",
    difficulty: "beginner",
    estimatedMinutes: 2,
    goal: "Order the steps from source code to a reachable app on Kubernetes.",
    description: "Docker and Kubernetes work together. Put the end-to-end workflow in order.",
    tags: ["workflow"],
    hints: ["Kubernetes runs images. It does not build them.", "Check the Pods are healthy before you expose them."],
    steps: [
      {
        type: "ordering",
        title: "From code to cluster",
        instructions: "Arrange the steps from first to last.",
        items: [
          { id: "build", label: "Build an image with docker build" },
          { id: "push", label: "Push the image to a registry" },
          { id: "manifest", label: "Write a Deployment manifest that references the image" },
          { id: "apply", label: "kubectl apply -f deployment.yaml" },
          { id: "check", label: "Check the Pods with kubectl get pods" },
          { id: "service", label: "Create a Service to give the Pods a stable address" },
        ],
        explanation: "Docker builds and publishes the image. Kubernetes pulls it from the registry and runs it as Pods managed by the Deployment, and the Service routes traffic to them.",
      },
    ],
    solution: "Build → push → write manifest → apply → check Pods → expose with a Service.",
    relatedLesson: "deploy-with-a-manifest",
  },
  {
    id: "scale-to-three",
    title: "Scale a Deployment to three replicas",
    track: "kubernetes",
    difficulty: "beginner",
    estimatedMinutes: 3,
    goal: "Deploy the web app, then run three replicas of it.",
    description: "Start from an empty cluster. The deployment.yaml in the folder asks for 2 replicas.",
    tags: ["scaling", "yaml"],
    hints: ["Apply with `kubectl apply -f deployment.yaml`.", "Scale with `kubectl scale deployment web --replicas=3`."],
    steps: [
      {
        type: "terminal",
        title: "Deploy and scale",
        instructions: "Apply the manifest, scale, then confirm.",
        mode: "kubernetes",
        scenario: "k8s-empty",
        steps: [
          { id: "apply", instruction: "Apply deployment.yaml.", hint: "kubectl apply -f deployment.yaml", goal: { kind: "k8s-deployment", name: "web" } },
          { id: "scale", instruction: "Scale web to 3 replicas.", hint: "kubectl scale deployment web --replicas=3", goal: { kind: "k8s-deployment", name: "web", replicas: 3 } },
          { id: "verify", instruction: "List the Pods to confirm three are Running.", hint: "kubectl get pods", goal: { kind: "command", pattern: "^kubectl get (po|pod|pods)\\b" } },
        ],
        explanation: "Changing replicas changes the desired state; the ReplicaSet creates Pods until actual state matches.",
      },
    ],
    solution: "`kubectl apply -f deployment.yaml`, `kubectl scale deployment web --replicas=3`, then `kubectl get pods` shows three Running Pods.",
    relatedLesson: "scaling-and-self-healing",
  },
  {
    id: "deploy-and-expose",
    title: "Deploy and expose a sample web app",
    track: "kubernetes",
    difficulty: "beginner",
    estimatedMinutes: 4,
    goal: "Apply the Deployment and Service manifests and confirm the Service has endpoints.",
    description: "Read the manifests, apply them, and prove traffic has somewhere to go.",
    tags: ["yaml", "services"],
    hints: [
      "`cat deployment.yaml` shows the manifest.",
      "Apply both files with kubectl apply -f.",
      "`kubectl get endpoints web` lists the Pod IPs behind the Service.",
    ],
    steps: [
      {
        type: "terminal",
        title: "Ship it",
        instructions: "Work through the checklist in order.",
        mode: "kubernetes",
        scenario: "k8s-empty",
        steps: [
          { id: "read", instruction: "Read the Deployment manifest.", hint: "cat deployment.yaml", goal: { kind: "command", pattern: "^cat deployment\\.yaml$" } },
          { id: "deploy", instruction: "Apply the Deployment.", hint: "kubectl apply -f deployment.yaml", goal: { kind: "k8s-deployment", name: "web" } },
          { id: "svc", instruction: "Apply the Service.", hint: "kubectl apply -f service.yaml", goal: { kind: "k8s-service", name: "web", selectsApp: "web" } },
          { id: "ep", instruction: "Check the Service's endpoints.", hint: "kubectl get endpoints web", goal: { kind: "command", pattern: "^kubectl get (ep|endpoints)\\b" } },
        ],
        explanation: "The Service's selector app=web matches the Pod template's labels, so the ready Pods become its endpoints.",
      },
    ],
    solution: "`kubectl apply -f deployment.yaml`, `kubectl apply -f service.yaml`, then `kubectl get endpoints web` shows two Pod IPs.",
    relatedLesson: "expose-with-a-service",
  },
  {
    id: "fix-selector-yaml",
    title: "Fix the Service that routes nowhere",
    track: "kubernetes",
    difficulty: "intermediate",
    estimatedMinutes: 3,
    goal: "Spot why a Service has no endpoints, and choose the right fix.",
    description: "The Pods are Running, but requests to the Service time out.",
    tags: ["yaml", "services"],
    hints: ["Compare the Service selector with the Pod template labels.", "Labels must match exactly, both key and value."],
    steps: [
      {
        type: "scenario",
        title: "Read the YAML",
        symptom: "`kubectl get endpoints shop` shows <none>, but `kubectl get pods` shows 3 Running shop Pods.",
        context: {
          label: "shop.yaml (excerpt)",
          language: "yaml",
          code: `kind: Deployment
metadata:
  name: shop
spec:
  selector:
    matchLabels:
      app: shop
  template:
    metadata:
      labels:
        app: shop
---
kind: Service
metadata:
  name: shop
spec:
  selector:
    app: storefront
  ports:
    - port: 80
      targetPort: 8080`,
        },
        question: "What is the best fix?",
        options: [
          { id: "a", text: "Change the Service selector to app: shop.", correct: true, feedback: "Correct. The selector app: storefront matches no Pods, so the Service has no endpoints." },
          { id: "b", text: "Scale the Deployment up to 5 replicas.", correct: false, feedback: "More Pods with the same label still would not match app: storefront." },
          { id: "c", text: "Change the Service type to LoadBalancer.", correct: false, feedback: "The type changes how the Service is reached, not which Pods it selects." },
          { id: "d", text: "Delete the Pods so they restart.", correct: false, feedback: "The replacement Pods would get the same labels, so the mismatch stays." },
        ],
        explanation: "A Service with no endpoints almost always means its selector does not match ready Pods' labels.",
      },
    ],
    solution: "Set the Service selector to app: shop to match the Pod template labels.",
    relatedLesson: "services",
  },
  {
    id: "investigate-crash",
    title: "Investigate a crashing Pod",
    track: "kubernetes",
    difficulty: "intermediate",
    estimatedMinutes: 5,
    goal: "Find out why the api Pod is in CrashLoopBackOff, and fix it.",
    description: "CrashLoopBackOff tells you that a container keeps crashing. Find out why.",
    tags: ["troubleshooting"],
    hints: [
      "Start with `kubectl get pods` to find the Pod name.",
      "`kubectl describe pod NAME` shows restarts and the exit code. `kubectl logs NAME` shows the app's own error.",
      "Fix: `kubectl set env deployment/api DATABASE_URL=postgres://db:5432/app`.",
    ],
    steps: [
      {
        type: "terminal",
        title: "Diagnose and fix",
        instructions: "Pod names have random suffixes. You can type the start of a Pod name (e.g. api-) with describe and logs here.",
        mode: "kubernetes",
        scenario: "k8s-crashloop",
        steps: [
          { id: "get", instruction: "List the Pods.", hint: "kubectl get pods", goal: { kind: "command", pattern: "^kubectl get (po|pod|pods)\\b" } },
          { id: "describe", instruction: "Describe the api Pod.", hint: "kubectl describe pod api-", goal: { kind: "command", pattern: "^kubectl describe (po|pod|pods) api-" } },
          { id: "logs", instruction: "Read the api Pod's logs.", hint: "kubectl logs deployment/api", goal: { kind: "command", pattern: "^kubectl logs (api-|deploy(ment)?/api)" } },
          { id: "fix", instruction: "Set the missing environment variable on the Deployment.", hint: "kubectl set env deployment/api DATABASE_URL=postgres://db:5432/app", goal: { kind: "k8s-pod-count", app: "api", running: 1 } },
        ],
        explanation: "describe showed restarts and exit code 1; logs showed the real cause, a missing DATABASE_URL. Fixing the template rolled out a healthy Pod.",
      },
    ],
    solution: "get pods → describe pod (exit code 1, restarts) → logs (DATABASE_URL is not set) → `kubectl set env deployment/api DATABASE_URL=...`.",
    relatedLesson: "crashloopbackoff",
  },
  {
    id: "imagepull-diagnosis",
    title: "Unstick an ImagePullBackOff",
    track: "kubernetes",
    difficulty: "intermediate",
    estimatedMinutes: 4,
    goal: "Get the shop Pods running.",
    description: "The shop Deployment was applied an hour ago, and its Pods have never started.",
    tags: ["troubleshooting"],
    hints: ["Describe one of the shop Pods and read the Failed event.", "Look closely at the image name. Is it spelled right?"],
    steps: [
      {
        type: "terminal",
        title: "Diagnose and fix",
        instructions: "Find the cause in the Events, then correct the image.",
        mode: "kubernetes",
        scenario: "k8s-imagepull",
        steps: [
          { id: "describe", instruction: "Describe a shop Pod.", hint: "kubectl describe pod shop-", goal: { kind: "command", pattern: "^kubectl describe (po|pod|pods) shop-" } },
          { id: "fix", instruction: "Set the correct image (nginx:1.27).", hint: "kubectl set image deployment/shop shop=nginx:1.27", goal: { kind: "k8s-pod-count", app: "shop", running: 2 } },
        ],
        explanation: "The image name had a typo (ngnix). Pull errors are reported in Events, not in logs, because the container never started.",
      },
    ],
    solution: "`kubectl describe pod shop-…` shows `Failed to pull image \"ngnix:1.27\"`. Fix with `kubectl set image deployment/shop shop=nginx:1.27`.",
    relatedLesson: "imagepullbackoff",
  },
  {
    id: "rollback-bad-release",
    title: "Roll back a bad release",
    track: "kubernetes",
    difficulty: "intermediate",
    estimatedMinutes: 4,
    goal: "Ship a broken image, notice the stuck rollout, and roll back.",
    description: "Rolling updates protect you: a bad version does not take down the good Pods. Practise the escape hatch.",
    tags: ["rollouts"],
    hints: ["`kubectl set image deployment/web web=nginx:1.99` (this tag does not exist).", "`kubectl rollout undo deployment/web` returns to the previous revision."],
    steps: [
      {
        type: "terminal",
        title: "Break it, then fix it",
        instructions: "Work through the rollout steps.",
        mode: "kubernetes",
        scenario: "k8s-running-app",
        steps: [
          { id: "bad", instruction: "Update web to the image nginx:1.99.", hint: "kubectl set image deployment/web web=nginx:1.99", goal: { kind: "k8s-deployment", name: "web", image: "nginx:1.99" } },
          { id: "status", instruction: "Check the rollout status.", hint: "kubectl rollout status deployment/web", goal: { kind: "command", pattern: "^kubectl rollout status (deploy(ment)?/web|deploy(ment)? web)" } },
          { id: "undo", instruction: "Roll back.", hint: "kubectl rollout undo deployment/web", goal: { kind: "k8s-deployment", name: "web", image: "nginx:1.27" } },
        ],
        explanation: "The new ReplicaSet's Pods never became ready, so the old ones kept serving. `rollout undo` restored the previous template.",
      },
    ],
    solution: "set image → rollout status shows it waiting → `kubectl rollout undo deployment/web`.",
    relatedLesson: "rolling-updates-and-rollbacks",
  },
  {
    id: "pending-pod",
    title: "Schedule a Pending Pod",
    track: "kubernetes",
    difficulty: "intermediate",
    estimatedMinutes: 4,
    goal: "Find out why the report Pod is Pending and make it schedulable.",
    description: "The report Pod has been Pending for a while. Nothing in the logs. Why?",
    tags: ["troubleshooting", "resources"],
    hints: ["Pending Pods have no logs. Use describe and read the FailedScheduling event.", "The request is 8 CPUs; nodes have 2. Lower it: `kubectl set resources deployment/report --requests=cpu=250m,memory=256Mi`."],
    steps: [
      {
        type: "terminal",
        title: "Diagnose and fix",
        instructions: "Read the scheduler's reason, then right-size the request.",
        mode: "kubernetes",
        scenario: "k8s-pending",
        steps: [
          { id: "describe", instruction: "Describe the report Pod.", hint: "kubectl describe pod report-", goal: { kind: "command", pattern: "^kubectl describe (po|pod|pods) report-" } },
          { id: "fix", instruction: "Lower the CPU request so it fits on a node.", hint: "kubectl set resources deployment/report --requests=cpu=250m,memory=256Mi", goal: { kind: "k8s-pod-count", app: "report", running: 1 } },
        ],
        explanation: "The scheduler places Pods based on requests. 8 CPUs could not fit on any 2-CPU node, so the Pod stayed Pending.",
      },
    ],
    solution: "describe → FailedScheduling: Insufficient cpu → `kubectl set resources deployment/report --requests=cpu=250m,memory=256Mi`.",
    relatedLesson: "pending-pods",
  },
];

const BY_ID = new Map(CHALLENGES.map((c) => [c.id, c]));

export function getChallenge(id: string): Challenge | undefined {
  return BY_ID.get(id);
}

export const QUICK_PRACTICE_IDS = ["match-docker-concepts", "find-running-container", "order-k8s-deploy"];
