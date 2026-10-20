import type { LessonContent } from "../types";

export const kubernetesModule8: Record<string, LessonContent> = {
  "pending-pods": {
    objectives: [
      "Explain what Pending means",
      "Find the scheduler's reason in the Pod's Events",
      "Fix common scheduling problems",
    ],
    sections: [
      {
        type: "text",
        heading: "Pending: accepted, not yet placed",
        paragraphs: [
          "A Pod in **Pending** has been accepted by the API server but isn't running yet. Most often the scheduler can't find a node that satisfies it. Because no container has started, there are **no logs** to read. The explanation lives in the Pod's **Events**, in a `FailedScheduling` message.",
        ],
      },
      { type: "diagram", diagram: "pod-states", caption: "Pending comes before scheduling. Stuck there? Read the FailedScheduling event." },
      {
        type: "code",
        language: "text",
        simulated: true,
        caption: "A typical FailedScheduling event",
        code: `Warning  FailedScheduling  default-scheduler
  0/3 nodes are available: 1 node(s) had untolerated taint
  {node-role.kubernetes.io/control-plane: }, 2 Insufficient cpu.`,
      },
      {
        type: "list",
        heading: "Common causes",
        items: [
          "**Insufficient cpu/memory**: requests are bigger than any node's free capacity. Lower requests or add nodes.",
          "**Taints and node selectors**: the Pod isn't allowed on the available nodes (e.g. control-plane nodes are tainted).",
          "**Unbound PersistentVolumeClaims**: requested storage isn't available.",
          "**Quotas**: the namespace's ResourceQuota is exhausted.",
        ],
      },
      {
        type: "callout",
        tone: "tip",
        title: "Read the numbers literally",
        body: "“0/3 nodes are available … 2 Insufficient cpu” means: of 3 nodes, 2 lack CPU and 1 is excluded for another reason. Compare the Pod's request with `kubectl describe node` allocations.",
      },
    ],
    keyTakeaways: [
      "Pending means not yet scheduled (or not yet started).",
      "No logs exist yet, so use kubectl describe pod and read Events.",
      "Oversized requests are the most common cause.",
    ],
    quizQuestions: [
      {
        id: "q1",
        prompt: "A Pod has been Pending for 10 minutes. Why does `kubectl logs` not help?",
        kind: "single",
        options: [
          { id: "a", text: "Logs are disabled by default" },
          { id: "b", text: "No container has started, so there are no logs" },
          { id: "c", text: "Logs only exist for Services" },
          { id: "d", text: "You must restart the cluster first" },
        ],
        correct: ["b"],
        explanation: "The container never ran. Scheduling problems are reported in Events instead.",
      },
      {
        id: "q2",
        prompt: "Events say `0/3 nodes are available: 3 Insufficient memory`. The Pod requests 16Gi and nodes have 8Gi. Best fix?",
        kind: "single",
        options: [
          { id: "a", text: "Lower the memory request to what the app needs (or add bigger nodes)" },
          { id: "b", text: "Delete the Pod and hope" },
          { id: "c", text: "Add a liveness probe" },
          { id: "d", text: "Change the Service type" },
        ],
        correct: ["a"],
        explanation: "No node can satisfy 16Gi. Right-size the request or add capacity.",
      },
      {
        id: "q3",
        prompt: "Which can cause a Pod to stay Pending? Select all that apply.",
        kind: "multiple",
        options: [
          { id: "a", text: "Requests larger than any node's free capacity" },
          { id: "b", text: "Taints the Pod doesn't tolerate" },
          { id: "c", text: "An unbound PersistentVolumeClaim" },
          { id: "d", text: "A typo in the app's log message" },
        ],
        correct: ["a", "b", "c"],
        explanation: "Scheduling constraints and missing resources keep Pods Pending; log text doesn't.",
      },
    ],
    activity: {
      type: "terminal",
      title: "Get report scheduled",
      instructions: "Find why report is Pending and fix it.",
      mode: "kubernetes",
      scenario: "k8s-pending",
      steps: [
        { id: "get", instruction: "List Pods.", hint: "kubectl get pods", goal: { kind: "command", pattern: "^kubectl get (po|pod|pods)\\b" } },
        { id: "describe", instruction: "Describe the report Pod.", hint: "kubectl describe pod report-", goal: { kind: "command", pattern: "^kubectl describe (po|pod|pods) report-" } },
        { id: "node", instruction: "Check a worker's capacity.", hint: "kubectl describe node worker-1", goal: { kind: "command", pattern: "^kubectl describe (no|node|nodes) worker-" } },
        { id: "fix", instruction: "Lower the CPU request to 250m.", hint: "kubectl set resources deployment/report --requests=cpu=250m,memory=256Mi", goal: { kind: "k8s-pod-count", app: "report", running: 1 } },
      ],
      explanation: "8 CPUs couldn't fit on a 2-CPU node. With a realistic request, the scheduler placed the Pod immediately.",
    },
  },

  crashloopbackoff: {
    objectives: [
      "Explain that CrashLoopBackOff is a symptom and a back-off behaviour",
      "Use describe and logs (including --previous) to find the cause",
      "Fix configuration-driven crashes",
    ],
    sections: [
      {
        type: "text",
        heading: "What the status actually means",
        paragraphs: [
          "**CrashLoopBackOff** means: the container started, exited, was restarted, and exited again, so Kubernetes now waits longer between restarts (the back-off grows up to five minutes). It tells you *that* the container keeps crashing. It does **not** tell you *why*.",
        ],
      },
      { type: "diagram", diagram: "pod-states", caption: "CrashLoopBackOff: start → exit → wait → restart → exit…" },
      {
        type: "list",
        heading: "An investigation routine",
        items: [
          "`kubectl get pods`: note RESTARTS climbing.",
          "`kubectl describe pod NAME`: see `Last State: Terminated`, the exit code, and Events (BackOff).",
          "`kubectl logs NAME`, or `kubectl logs NAME --previous` for the crashed instance: the app's own error message usually names the cause.",
          "Fix the cause (configuration, a missing file, a bad command, a dependency) and roll out a new template.",
        ],
      },
      {
        type: "code",
        language: "text",
        simulated: true,
        caption: "The logs usually say it plainly",
        code: `$ kubectl logs api-6b8f7d9c4f-q2xkp --previous
api: loading configuration
Error: required environment variable DATABASE_URL is not set
Process exited with code 1`,
      },
      {
        type: "callout",
        tone: "info",
        title: "Exit codes are clues",
        body: "Exit code 1 is usually an application error. 137 means the process was killed (often OOMKilled; check the Reason). 127 means a command wasn't found, which often points to a typo in command/args.",
      },
    ],
    keyTakeaways: [
      "CrashLoopBackOff = repeated crashes plus increasing restart delays.",
      "The cause is in logs (use --previous) and describe's Last State.",
      "Restarting won't fix it; change what's wrong.",
    ],
    quizQuestions: [
      {
        id: "q1",
        prompt: "Which statement about CrashLoopBackOff is accurate?",
        kind: "single",
        options: [
          { id: "a", text: "It is the root cause of the failure" },
          { id: "b", text: "It is a status showing repeated crashes with growing restart delays" },
          { id: "c", text: "It means the image couldn't be pulled" },
          { id: "d", text: "It means the Pod is waiting for a node" },
        ],
        correct: ["b"],
        explanation: "It's a symptom and a back-off behaviour. Find the root cause in logs and describe.",
      },
      {
        id: "q2",
        prompt: "The container has already restarted, so current logs are empty. How do you see what the crashed instance printed?",
        kind: "single",
        options: [
          { id: "a", text: "kubectl logs POD --previous" },
          { id: "b", text: "kubectl get events --crash" },
          { id: "c", text: "kubectl describe service" },
          { id: "d", text: "It is impossible" },
        ],
        correct: ["a"],
        explanation: "--previous shows the logs of the last terminated container instance.",
      },
      {
        id: "q3",
        prompt: "Which are common root causes of CrashLoopBackOff? Select all that apply.",
        kind: "multiple",
        options: [
          { id: "a", text: "Missing environment variables or configuration" },
          { id: "b", text: "The app can't reach a required dependency and exits" },
          { id: "c", text: "A wrong command or entrypoint" },
          { id: "d", text: "A typo in the image name" },
        ],
        correct: ["a", "b", "c"],
        explanation: "An image typo prevents starting at all (ImagePullBackOff), so the container never gets to crash.",
      },
    ],
    activity: {
      type: "scenario",
      title: "Read the crash",
      symptom: "api-6b8f7d9c4f-q2xkp shows CrashLoopBackOff with 6 restarts.",
      context: {
        label: "kubectl describe pod api-6b8f7d9c4f-q2xkp (excerpt, simulated)",
        language: "text",
        code: `    State:          Waiting
      Reason:       CrashLoopBackOff
    Last State:     Terminated
      Reason:       Error
      Exit Code:    1
    Restart Count:  6
Events:
  Warning  BackOff  kubelet  Back-off restarting failed container api`,
      },
      question: "What is the best next step?",
      options: [
        { id: "a", text: "kubectl logs api-6b8f7d9c4f-q2xkp --previous", correct: true, feedback: "Yes. Exit code 1 is an application error, and the crashed container's logs will say what it is." },
        { id: "b", text: "kubectl delete pod api-6b8f7d9c4f-q2xkp", correct: false, feedback: "The replacement Pod runs the same template and will crash the same way." },
        { id: "c", text: "Scale the Deployment to 10 replicas", correct: false, feedback: "You'd have 10 crashing Pods instead of one." },
        { id: "d", text: "Change the Service to NodePort", correct: false, feedback: "Services don't affect whether a container starts." },
      ],
      explanation: "Status tells you what's happening; logs tell you why.",
    },
  },

  imagepullbackoff: {
    objectives: [
      "Recognise ErrImagePull and ImagePullBackOff",
      "Diagnose typos, missing tags, and private-registry authentication",
      "Fix the image reference or credentials",
    ],
    sections: [
      {
        type: "text",
        heading: "The container never starts",
        paragraphs: [
          "Before a container can run, the node's kubelet must pull its image. If the pull fails, the Pod shows **ErrImagePull**, then **ImagePullBackOff** as Kubernetes waits longer between retries. There are no app logs because nothing started; the **Events** of `kubectl describe pod` contain the registry's error.",
        ],
      },
      { type: "diagram", diagram: "registry-flow", caption: "Kubernetes pulls images from a registry just like docker pull does." },
      {
        type: "list",
        heading: "Usual suspects",
        items: [
          "**Typo** in the image name: `ngnix:1.27` instead of `nginx:1.27`. The error says not found.",
          "**Tag doesn't exist**: `nginx:1.99`. Also not found / manifest unknown.",
          "**Private registry without credentials**: `401 Unauthorized` or `pull access denied`. Add an `imagePullSecrets` entry referencing a registry Secret.",
          "**Network or rate limits**: timeouts or `429 Too Many Requests` from the registry.",
        ],
      },
      {
        type: "code",
        language: "yaml",
        caption: "Pulling from a private registry",
        code: `spec:
  imagePullSecrets:
    - name: registry-credentials   # a Secret of type kubernetes.io/dockerconfigjson
  containers:
    - name: api
      image: registry.example.com/team/api:2.1`,
      },
      {
        type: "callout",
        tone: "tip",
        title: "Test the reference outside the cluster",
        body: "If `docker pull` of the exact same reference fails on your machine, the problem is the reference or the registry, not Kubernetes.",
      },
    ],
    keyTakeaways: [
      "ImagePullBackOff = image pull failing, with back-off between retries.",
      "Read describe Events; logs are empty because nothing started.",
      "Fix the image name/tag or provide imagePullSecrets.",
    ],
    quizQuestions: [
      {
        id: "q1",
        prompt: "Where do you find the cause of ImagePullBackOff?",
        kind: "single",
        options: [
          { id: "a", text: "kubectl logs" },
          { id: "b", text: "The Events in kubectl describe pod" },
          { id: "c", text: "The Service endpoints" },
          { id: "d", text: "The node's hostname" },
        ],
        correct: ["b"],
        explanation: "The kubelet records pull failures as Events. There are no container logs yet.",
      },
      {
        id: "q2",
        prompt: "Events show `401 Unauthorized` pulling registry.example.com/team/api:2.1. Most likely fix?",
        kind: "single",
        options: [
          { id: "a", text: "Add imagePullSecrets with valid registry credentials" },
          { id: "b", text: "Increase the memory limit" },
          { id: "c", text: "Delete the namespace" },
          { id: "d", text: "Use the latest tag" },
        ],
        correct: ["a"],
        explanation: "401 means the registry refused anonymous access. The node needs credentials.",
      },
      {
        id: "q3",
        prompt: "Which can cause ImagePullBackOff? Select all that apply.",
        kind: "multiple",
        options: [
          { id: "a", text: "A misspelled image name" },
          { id: "b", text: "A tag that doesn't exist" },
          { id: "c", text: "Missing credentials for a private registry" },
          { id: "d", text: "A missing environment variable in the app" },
        ],
        correct: ["a", "b", "c"],
        explanation: "A missing env var would crash a started container (CrashLoopBackOff), not stop the pull.",
      },
    ],
    activity: {
      type: "scenario",
      title: "Pull request denied",
      symptom: "After moving images to the company registry, every new api Pod shows ImagePullBackOff.",
      context: {
        label: "Events (simulated)",
        language: "text",
        code: `Normal   Pulling  kubelet  Pulling image "registry.example.com/team/api:2.1"
Warning  Failed   kubelet  Failed to pull image "registry.example.com/team/api:2.1":
         failed to authorize: 401 Unauthorized
Warning  Failed   kubelet  Error: ErrImagePull
Normal   BackOff  kubelet  Back-off pulling image "registry.example.com/team/api:2.1"`,
      },
      question: "What should you do?",
      options: [
        { id: "a", text: "Create a registry Secret and reference it in imagePullSecrets", correct: true, feedback: "Right. The registry is private and the node has no credentials for it." },
        { id: "b", text: "Fix the spelling of the image", correct: false, feedback: "A typo usually gives not found. 401 means authentication failed." },
        { id: "c", text: "Read kubectl logs", correct: false, feedback: "There are no logs: the container never started." },
        { id: "d", text: "Raise CPU requests", correct: false, feedback: "Resources don't affect image pulls." },
      ],
      explanation: "Match the error text to the cause: not found → name/tag; 401/403 → credentials; timeout → network.",
    },
  },

  "reading-kubectl-output": {
    objectives: [
      "Choose the right kubectl command for each question",
      "Read the key columns of get output",
      "Use describe and logs to go deeper",
    ],
    sections: [
      {
        type: "text",
        heading: "Three commands, three depths",
        paragraphs: [
          "**get** is the overview: one line per object with the most important status fields. **describe** is the detail view: configuration, conditions, and recent Events, which is perfect for “why?”. **logs** shows what the application itself printed. Most investigations go get → describe → logs.",
        ],
      },
      {
        type: "code",
        language: "text",
        simulated: true,
        caption: "Reading kubectl get pods",
        code: `NAME                   READY   STATUS             RESTARTS      AGE
web-7d4b9c8f5d-x2k9p   1/1     Running            0             12m
api-6b8f7d9c4f-q2xkp   0/1     CrashLoopBackOff   6 (40s ago)   12m
shop-5d6c7b8a9-zz4mn   0/1     ImagePullBackOff   0             3m`,
      },
      {
        type: "list",
        heading: "Columns that matter",
        items: [
          "**READY** `1/1`: ready containers out of total. `0/1` means not serving.",
          "**STATUS**: the phase or the reason a container is waiting (Running, Pending, CrashLoopBackOff…).",
          "**RESTARTS**: a climbing number means crashes. The time in brackets is the last restart.",
          "**AGE**: how long the object has existed. A young Pod in an old Deployment was recently replaced.",
        ],
      },
      { type: "diagram", diagram: "pod-states", caption: "Each status points to a different next command." },
      {
        type: "callout",
        tone: "tip",
        title: "Useful flags",
        body: "`-o wide` adds node and IP. `--show-labels` shows labels. `-l app=web` filters. `-A` looks across namespaces. `kubectl get events` shows recent cluster activity.",
      },
    ],
    keyTakeaways: [
      "get for the overview, describe for why, logs for what the app said.",
      "READY, STATUS, and RESTARTS answer most first questions.",
      "Pending/ImagePull → describe; CrashLoop → logs.",
    ],
    quizQuestions: [
      {
        id: "q1",
        prompt: "A Pod shows READY 0/1 and STATUS Running. What does that suggest?",
        kind: "single",
        options: [
          { id: "a", text: "Everything is fine" },
          { id: "b", text: "The container is running but not ready, e.g. its readiness probe is failing" },
          { id: "c", text: "The image is missing" },
          { id: "d", text: "The Pod is Pending" },
        ],
        correct: ["b"],
        explanation: "Running but not ready usually means readiness is failing, so the Pod receives no Service traffic.",
      },
      {
        id: "q2",
        prompt: "Which command best answers “why can't this Pod be scheduled?”",
        kind: "single",
        options: [
          { id: "a", text: "kubectl logs POD" },
          { id: "b", text: "kubectl describe pod POD" },
          { id: "c", text: "kubectl get svc" },
          { id: "d", text: "kubectl rollout history" },
        ],
        correct: ["b"],
        explanation: "describe shows the FailedScheduling event with the scheduler's reason.",
      },
      {
        id: "q3",
        prompt: "Which pieces of information are in `kubectl get pods` by default? Select all that apply.",
        kind: "multiple",
        options: [
          { id: "a", text: "READY" },
          { id: "b", text: "RESTARTS" },
          { id: "c", text: "The node name" },
          { id: "d", text: "STATUS" },
        ],
        correct: ["a", "b", "d"],
        explanation: "The node name needs -o wide.",
      },
    ],
    activity: {
      type: "matching",
      title: "Which command answers it?",
      instructions: "Match each question to the command that answers it best.",
      pairs: [
        { id: "status", term: "Which Pods exist and are they healthy?", definition: "kubectl get pods" },
        { id: "pending", term: "Why is this Pod still Pending?", definition: "kubectl describe pod NAME" },
        { id: "error", term: "What error did the app print before crashing?", definition: "kubectl logs NAME --previous" },
        { id: "routing", term: "Which Pods does this Service send traffic to?", definition: "kubectl get endpoints NAME" },
        { id: "revisions", term: "What versions has this Deployment rolled through?", definition: "kubectl rollout history deployment/NAME" },
      ],
      explanation: "Knowing which command answers which question is most of the skill of debugging Kubernetes.",
    },
  },

  "final-mission": {
    objectives: [
      "Deploy and expose an app from manifests",
      "Scale it, ship a bad release, and diagnose it",
      "Recover with a rollback and verify traffic",
    ],
    sections: [
      {
        type: "text",
        heading: "Mission brief",
        paragraphs: [
          "Your team's web app must go live on an empty cluster, handle more traffic, and survive a bad release. You'll use everything from this track: manifests, Deployments, Services, scaling, rollouts, and troubleshooting. All of it runs in the simulated cluster.",
        ],
      },
      { type: "diagram", diagram: "cluster-hierarchy", caption: "The whole picture: control plane, nodes, Pods, and the objects that manage them." },
      {
        type: "list",
        heading: "The plan",
        ordered: true,
        items: [
          "Apply the Deployment and the Service.",
          "Scale to 3 replicas for the launch.",
          "Ship `nginx:1.99` (it doesn't exist; your teammate made a typo).",
          "Notice the problem with get pods and describe.",
          "Roll back and confirm the Service still has endpoints.",
        ],
      },
      {
        type: "callout",
        tone: "tip",
        title: "Watch the old Pods",
        body: "While the bad release is stuck, look at how many Pods are still Running. The rolling update protects you, which is exactly why rollouts are gradual.",
      },
    ],
    keyTakeaways: [
      "Manifests + apply give a reproducible deployment.",
      "Rolling updates contain bad releases; rollbacks are fast.",
      "get → describe → logs finds the cause.",
    ],
    quizQuestions: [
      {
        id: "q1",
        prompt: "During the stuck rollout to nginx:1.99, why does the app keep serving traffic?",
        kind: "single",
        options: [
          { id: "a", text: "Old Pods remain Ready and in the Service's endpoints" },
          { id: "b", text: "The new Pods serve traffic without an image" },
          { id: "c", text: "Services cache responses" },
          { id: "d", text: "It doesn't; the app is down" },
        ],
        correct: ["a"],
        explanation: "The new Pods never become ready, so the controller keeps old Pods running within its availability budget.",
      },
      {
        id: "q2",
        prompt: "The new Pod shows ImagePullBackOff. Which command shows the exact registry error?",
        kind: "single",
        options: [
          { id: "a", text: "kubectl logs POD" },
          { id: "b", text: "kubectl describe pod POD" },
          { id: "c", text: "kubectl get svc" },
          { id: "d", text: "kubectl scale" },
        ],
        correct: ["b"],
        explanation: "Image pull errors appear in Events.",
      },
      {
        id: "q3",
        prompt: "After rolling back, which checks confirm recovery? Select all that apply.",
        kind: "multiple",
        options: [
          { id: "a", text: "kubectl get pods shows 3/3 Running on the old image" },
          { id: "b", text: "kubectl rollout status reports success" },
          { id: "c", text: "kubectl get endpoints web lists 3 Pod IPs" },
          { id: "d", text: "kubectl get nodes shows a new node" },
        ],
        correct: ["a", "b", "c"],
        explanation: "Healthy Pods, a finished rollout, and populated endpoints mean traffic flows again. Nodes don't change.",
      },
    ],
    activity: {
      type: "terminal",
      title: "Final mission",
      instructions: "Complete the whole operational loop. Hints are there if you need them.",
      mode: "kubernetes",
      scenario: "k8s-empty",
      steps: [
        { id: "deploy", instruction: "Apply deployment.yaml.", hint: "kubectl apply -f deployment.yaml", goal: { kind: "k8s-deployment", name: "web" } },
        { id: "svc", instruction: "Apply service.yaml.", hint: "kubectl apply -f service.yaml", goal: { kind: "k8s-service", name: "web", selectsApp: "web" } },
        { id: "scale", instruction: "Scale web to 3 replicas.", hint: "kubectl scale deployment web --replicas=3", goal: { kind: "k8s-deployment", name: "web", replicas: 3 } },
        { id: "bad", instruction: "Ship the broken image nginx:1.99.", hint: "kubectl set image deployment/web web=nginx:1.99", goal: { kind: "k8s-deployment", name: "web", image: "nginx:1.99" } },
        { id: "get", instruction: "Spot the problem.", hint: "kubectl get pods", goal: { kind: "command", pattern: "^kubectl get (po|pod|pods)\\b" } },
        { id: "describe", instruction: "Describe a failing web Pod (the one with ImagePullBackOff).", hint: "kubectl describe pod web-", goal: { kind: "command", pattern: "^kubectl describe (po|pod|pods) web-" } },
        { id: "undo", instruction: "Roll back.", hint: "kubectl rollout undo deployment/web", goal: { kind: "k8s-deployment", name: "web", image: "nginx:1.27" } },
        { id: "ep", instruction: "Confirm the Service has endpoints.", hint: "kubectl get endpoints web", goal: { kind: "command", pattern: "^kubectl get (ep|endpoints)\\b" } },
      ],
      explanation: "Mission complete: you deployed, exposed, scaled, diagnosed a bad release, and recovered, the core loop of operating apps on Kubernetes.",
    },
  },
};
