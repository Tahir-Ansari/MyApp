import type { LessonContent } from "../types";

export const kubernetesModule7: Record<string, LessonContent> = {
  "deploy-with-a-manifest": {
    objectives: [
      "Deploy an application declaratively with kubectl apply",
      "Read where Pods landed with -o wide",
      "Read the Events of a healthy Pod",
    ],
    sections: [
      {
        type: "text",
        heading: "From YAML to running Pods",
        paragraphs: [
          "Deploying is one command: `kubectl apply -f deployment.yaml`. kubectl sends the manifest to the API server, which stores it. The Deployment controller creates a ReplicaSet, the ReplicaSet creates Pods, the scheduler assigns each Pod to a node, and that node's kubelet pulls the image and starts the container.",
        ],
      },
      { type: "diagram", diagram: "yaml-anatomy", caption: "apply sends the whole object; Kubernetes fills in status as it works." },
      {
        type: "code",
        language: "yaml",
        filename: "deployment.yaml",
        caption: "The sample app's manifest, with resources and a readiness probe",
        code: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
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
            requests: { cpu: 100m, memory: 64Mi }
            limits: { cpu: 250m, memory: 128Mi }
          readinessProbe:
            httpGet: { path: /, port: 80 }`,
      },
      {
        type: "text",
        heading: "apply is idempotent",
        paragraphs: [
          "Running `kubectl apply` again with the same file reports `unchanged`. Change the file (say, `replicas: 3`) and apply reports `configured` and updates only what changed. That makes manifests in git a reliable record: apply the file and the cluster converges to it.",
        ],
      },
      {
        type: "callout",
        tone: "tip",
        title: "Read the Events",
        body: "`kubectl describe pod NAME` ends with Events. For a healthy Pod you'll see Scheduled → Pulled → Created → Started. Learning the normal sequence makes problems stand out later.",
      },
    ],
    keyTakeaways: [
      "kubectl apply -f declares desired state; controllers make it real.",
      "apply is safe to repeat: unchanged, configured, or created.",
      "Healthy Pod events: Scheduled, Pulled, Created, Started.",
    ],
    quizQuestions: [
      {
        id: "q1",
        prompt: "Which component decides which node each new Pod from your Deployment runs on?",
        kind: "single",
        options: [
          { id: "a", text: "kubectl" },
          { id: "b", text: "The scheduler" },
          { id: "c", text: "The ReplicaSet" },
          { id: "d", text: "The container image" },
        ],
        correct: ["b"],
        explanation: "The ReplicaSet creates Pod objects; the scheduler assigns them to nodes; the kubelet runs them.",
      },
      {
        id: "q2",
        prompt: "You run `kubectl apply -f deployment.yaml` twice without changing the file. The second time it says…",
        kind: "single",
        options: [
          { id: "a", text: "created, and a second Deployment appears" },
          { id: "b", text: "unchanged" },
          { id: "c", text: "error: already exists" },
          { id: "d", text: "deleted" },
        ],
        correct: ["b"],
        explanation: "apply is declarative and idempotent. Re-applying the same desired state changes nothing.",
      },
      {
        id: "q3",
        prompt: "Which events appear for a normally starting Pod? Select all that apply.",
        kind: "multiple",
        options: [
          { id: "a", text: "Scheduled" },
          { id: "b", text: "Pulled" },
          { id: "c", text: "Started" },
          { id: "d", text: "BackOff" },
        ],
        correct: ["a", "b", "c"],
        explanation: "BackOff appears when something keeps failing, such as image pulls or crashing containers.",
      },
    ],
    activity: {
      type: "terminal",
      title: "Deploy the sample app",
      instructions: "Apply the manifest and look at where the Pods ended up.",
      mode: "kubernetes",
      scenario: "k8s-empty",
      steps: [
        { id: "cat", instruction: "Read deployment.yaml.", hint: "cat deployment.yaml", goal: { kind: "command", pattern: "^cat deployment\\.yaml$" } },
        { id: "apply", instruction: "Apply it.", hint: "kubectl apply -f deployment.yaml", goal: { kind: "k8s-deployment", name: "web" } },
        { id: "wide", instruction: "List Pods with their nodes and IPs.", hint: "kubectl get pods -o wide", goal: { kind: "command", pattern: "^kubectl get (po|pod|pods)\\b.*-o wide" } },
        { id: "describe", instruction: "Describe one web Pod and read its Events.", hint: "kubectl describe pod web-", goal: { kind: "command", pattern: "^kubectl describe (po|pod|pods) web-" } },
      ],
      explanation: "The two Pods were spread across the worker nodes, and their Events show the normal startup sequence.",
    },
  },

  "expose-with-a-service": {
    objectives: [
      "Expose a Deployment with kubectl expose",
      "Read a NodePort Service's ports",
      "Confirm a Service's endpoints",
    ],
    sections: [
      {
        type: "text",
        heading: "Giving the app an address",
        paragraphs: [
          "Your Pods are running, but nothing can reliably reach them yet. `kubectl expose deployment web --port=80` creates a Service whose selector copies the Deployment's labels (`app=web`). For a quick way in from outside the cluster in a local setup, add `--type=NodePort`.",
        ],
      },
      { type: "diagram", diagram: "service-selector", caption: "The Service forwards its port to targetPort on every selected, ready Pod." },
      {
        type: "code",
        language: "bash",
        simulated: true,
        caption: "Reading a NodePort Service",
        code: `$ kubectl get svc web
NAME   TYPE       CLUSTER-IP     EXTERNAL-IP   PORT(S)        AGE
web    NodePort   10.96.42.17    <none>        80:31380/TCP   5s`,
      },
      {
        type: "list",
        heading: "Reading PORT(S)",
        items: [
          "`80` is the Service port: clients inside the cluster use `web:80`.",
          "`31380` is the node port: traffic to any node's IP on 31380 reaches the Service.",
          "The container port (`targetPort`) isn't shown here. Check it with `kubectl describe svc web`.",
        ],
      },
      {
        type: "callout",
        tone: "info",
        title: "Production traffic",
        body: "In production you'd typically use a LoadBalancer Service or an Ingress/Gateway in front of ClusterIP Services, rather than exposing node ports directly.",
      },
    ],
    keyTakeaways: [
      "kubectl expose creates a Service selecting the Deployment's Pods.",
      "NodePort adds a port on every node; ClusterIP stays internal.",
      "Endpoints confirm which Pods actually receive traffic.",
    ],
    quizQuestions: [
      {
        id: "q1",
        prompt: "In `80:31380/TCP`, what is 31380?",
        kind: "single",
        options: [
          { id: "a", text: "The container port" },
          { id: "b", text: "The node port opened on every node" },
          { id: "c", text: "The Service's cluster IP" },
          { id: "d", text: "The number of requests served" },
        ],
        correct: ["b"],
        explanation: "For NodePort Services, PORT(S) shows service-port:node-port.",
      },
      {
        id: "q2",
        prompt: "Which selector does `kubectl expose deployment web` give the new Service?",
        kind: "single",
        options: [
          { id: "a", text: "None" },
          { id: "b", text: "The Deployment's Pod labels, e.g. app=web" },
          { id: "c", text: "name=web" },
          { id: "d", text: "All Pods in the namespace" },
        ],
        correct: ["b"],
        explanation: "expose reuses the Deployment's selector, so the Service finds the same Pods.",
      },
      {
        id: "q3",
        prompt: "Which checks confirm a Service will route to your Pods? Select all that apply.",
        kind: "multiple",
        options: [
          { id: "a", text: "kubectl get endpoints web shows Pod IPs" },
          { id: "b", text: "kubectl describe svc web shows Endpoints" },
          { id: "c", text: "The Service has an uppercase name" },
          { id: "d", text: "The Pods are Ready" },
        ],
        correct: ["a", "b", "d"],
        explanation: "Endpoints list ready, selected Pods; describe shows the same data.",
      },
    ],
    activity: {
      type: "terminal",
      title: "Expose the app",
      instructions: "Deploy, expose with a NodePort, and verify.",
      mode: "kubernetes",
      scenario: "k8s-empty",
      steps: [
        { id: "apply", instruction: "Apply deployment.yaml.", hint: "kubectl apply -f deployment.yaml", goal: { kind: "k8s-deployment", name: "web" } },
        { id: "expose", instruction: "Expose web on port 80 as a NodePort Service.", hint: "kubectl expose deployment web --port=80 --type=NodePort", goal: { kind: "k8s-service", selectsApp: "web", type: "NodePort" } },
        { id: "svc", instruction: "List Services.", hint: "kubectl get svc", goal: { kind: "command", pattern: "^kubectl get (svc|service|services)\\b" } },
        { id: "ep", instruction: "Check the endpoints.", hint: "kubectl get endpoints web", goal: { kind: "command", pattern: "^kubectl get (ep|endpoints)\\b" } },
      ],
      explanation: "The Service selects both web Pods and is reachable on a node port as well as its cluster IP.",
    },
  },

  "scaling-and-self-healing": {
    objectives: [
      "Scale a Deployment up and down",
      "Watch a controller replace a deleted Pod",
      "Know the difference between imperative scaling and updating the manifest",
    ],
    sections: [
      {
        type: "text",
        heading: "Scaling is changing one number",
        paragraphs: [
          "`kubectl scale deployment web --replicas=5` sets the desired replica count. The ReplicaSet creates (or removes) Pods until there are exactly five. The Service automatically includes new Pods once they are ready, with no reconfiguration needed.",
        ],
      },
      { type: "diagram", diagram: "desired-vs-actual", caption: "Scale up, scale down, delete a Pod: the controller always converges on the desired count." },
      {
        type: "text",
        heading: "Self-healing",
        paragraphs: [
          "Delete a Pod managed by a Deployment and a replacement appears within moments, with a new name and a new IP. The same happens if a node dies: its Pods are recreated on healthy nodes. Kubernetes doesn't “fix” the old Pod; it replaces it.",
        ],
      },
      {
        type: "callout",
        tone: "warning",
        title: "Keep the manifest in sync",
        body: "`kubectl scale` changes the live object only. If deployment.yaml in git still says `replicas: 2`, the next apply scales back to 2. Update the manifest too, or use an autoscaler (HorizontalPodAutoscaler) to manage replicas.",
      },
    ],
    keyTakeaways: [
      "kubectl scale changes desired replicas; the ReplicaSet does the rest.",
      "Deleted or lost Pods are replaced automatically, with new names and IPs.",
      "Record scaling decisions in the manifest or an autoscaler.",
    ],
    quizQuestions: [
      {
        id: "q1",
        prompt: "After `kubectl scale deployment web --replicas=5`, what must you do so the Service sends traffic to the new Pods?",
        kind: "single",
        options: [
          { id: "a", text: "Recreate the Service" },
          { id: "b", text: "Nothing; ready Pods matching the selector are added automatically" },
          { id: "c", text: "Restart every Pod" },
          { id: "d", text: "Edit the endpoints by hand" },
        ],
        correct: ["b"],
        explanation: "Services select by label, so new ready Pods join the endpoints automatically.",
      },
      {
        id: "q2",
        prompt: "You delete Pod web-abc12 from a 3-replica Deployment. What does `kubectl get pods` show moments later?",
        kind: "single",
        options: [
          { id: "a", text: "2 Pods" },
          { id: "b", text: "3 Pods, one with a new name" },
          { id: "c", text: "3 Pods including web-abc12" },
          { id: "d", text: "0 Pods" },
        ],
        correct: ["b"],
        explanation: "The ReplicaSet creates a replacement Pod with a new generated name.",
      },
      {
        id: "q3",
        prompt: "deployment.yaml says replicas: 2. You ran kubectl scale to 6, then someone runs kubectl apply -f deployment.yaml. Which statements are true? Select all that apply.",
        kind: "multiple",
        options: [
          { id: "a", text: "Replicas go back to 2" },
          { id: "b", text: "The manifest is treated as the desired state" },
          { id: "c", text: "Replicas stay at 6 forever" },
          { id: "d", text: "Updating the manifest would have avoided the surprise" },
        ],
        correct: ["a", "b", "d"],
        explanation: "apply makes the cluster match the file. Keep the manifest as your source of truth.",
      },
    ],
    activity: {
      type: "terminal",
      title: "Scale and heal",
      instructions: "Scale the web Deployment, then delete a Pod and watch it come back. Copy a Pod name from the get output.",
      mode: "kubernetes",
      scenario: "k8s-running-app",
      steps: [
        { id: "scale", instruction: "Scale web to 5 replicas.", hint: "kubectl scale deployment web --replicas=5", goal: { kind: "k8s-deployment", name: "web", replicas: 5 } },
        { id: "get", instruction: "List the Pods.", hint: "kubectl get pods -l app=web", goal: { kind: "command", pattern: "^kubectl get (po|pod|pods)\\b" } },
        { id: "delete", instruction: "Delete any one web Pod by its full name.", hint: "kubectl delete pod <copy a web-… name from the list>", goal: { kind: "command", pattern: "^kubectl delete (po|pod|pods) web-\\S+$" } },
        { id: "heal", instruction: "List Pods again: still 5 Running?", hint: "kubectl get pods -l app=web", goal: { kind: "k8s-pod-count", app: "web", running: 5 } },
      ],
      explanation: "The ReplicaSet replaced the deleted Pod immediately, keeping 5 replicas: self-healing in action.",
    },
  },

  "readiness-and-liveness-probes": {
    objectives: [
      "Explain the difference between readiness and liveness probes",
      "Predict what happens when each probe fails",
      "Avoid probe settings that cause restart loops",
    ],
    sections: [
      {
        type: "text",
        heading: "Running is not the same as ready",
        paragraphs: [
          "A container can be running but not yet able to serve requests, because it is still loading data, warming caches, or waiting for a database. Or it can be running but stuck. **Probes** let Kubernetes check health from the outside, using an HTTP request, a TCP connection, or a command.",
        ],
      },
      { type: "diagram", diagram: "probes", caption: "Readiness controls traffic; liveness controls restarts." },
      {
        type: "list",
        items: [
          "**Readiness probe**: “Should this Pod receive traffic?” When it fails, the Pod is removed from Service endpoints, but it is not restarted.",
          "**Liveness probe**: “Is this container still healthy?” When it fails repeatedly, the kubelet restarts the container.",
          "**Startup probe**: “Has the app finished starting?” It holds off the other probes until a slow-starting app is up.",
        ],
      },
      {
        type: "code",
        language: "yaml",
        code: `readinessProbe:
  httpGet: { path: /ready, port: 8080 }
  periodSeconds: 5
livenessProbe:
  httpGet: { path: /healthz, port: 8080 }
  initialDelaySeconds: 15
  periodSeconds: 10
  failureThreshold: 3`,
      },
      {
        type: "callout",
        tone: "warning",
        title: "An aggressive liveness probe can cause the outage",
        body: "If a liveness probe fires before the app has finished starting, or during a brief slowdown, Kubernetes restarts healthy containers, possibly in a loop. Use a startup probe or sensible delays, and keep liveness checks simple (don't check dependencies like the database).",
      },
    ],
    keyTakeaways: [
      "Readiness failing = no traffic, no restart.",
      "Liveness failing = container restart.",
      "Startup probes protect slow starters from premature liveness failures.",
    ],
    quizQuestions: [
      {
        id: "q1",
        prompt: "A Pod's readiness probe starts failing. What happens?",
        kind: "single",
        options: [
          { id: "a", text: "The container is restarted" },
          { id: "b", text: "The Pod is removed from Service endpoints until it passes again" },
          { id: "c", text: "The Pod is deleted" },
          { id: "d", text: "The node is drained" },
        ],
        correct: ["b"],
        explanation: "Readiness only gates traffic. Liveness triggers restarts.",
      },
      {
        id: "q2",
        prompt: "An app needs 60 seconds to start. Its liveness probe begins after 5 seconds and fails 3 times 10 seconds apart. What's the likely result?",
        kind: "single",
        options: [
          { id: "a", text: "It starts normally" },
          { id: "b", text: "It gets restarted before it ever finishes starting, possibly repeatedly" },
          { id: "c", text: "It is marked Ready immediately" },
          { id: "d", text: "The Service type changes" },
        ],
        correct: ["b"],
        explanation: "Liveness fails before startup completes, so the kubelet restarts it. Add a startup probe or a longer delay.",
      },
      {
        id: "q3",
        prompt: "Which are good probe practices? Select all that apply.",
        kind: "multiple",
        options: [
          { id: "a", text: "Use readiness to stop traffic during warm-up" },
          { id: "b", text: "Make liveness depend on every downstream service" },
          { id: "c", text: "Use a startup probe for slow-starting apps" },
          { id: "d", text: "Keep liveness checks cheap and local" },
        ],
        correct: ["a", "c", "d"],
        explanation: "If liveness depends on a shared database, one database blip restarts every Pod at once.",
      },
    ],
    activity: {
      type: "classify",
      title: "Readiness or liveness?",
      instructions: "Match each behaviour to the probe responsible for it.",
      buckets: [
        { id: "ready", label: "Readiness" },
        { id: "live", label: "Liveness" },
      ],
      items: [
        { id: "endpoints", label: "Failing removes the Pod from Service endpoints", bucket: "ready" },
        { id: "restart", label: "Failing restarts the container", bucket: "live" },
        { id: "warm", label: "Keeps traffic away while a cache warms up", bucket: "ready" },
        { id: "deadlock", label: "Recovers a deadlocked process", bucket: "live" },
        { id: "norestart", label: "Never restarts anything", bucket: "ready" },
        { id: "loops", label: "Too-aggressive settings can cause restart loops", bucket: "live" },
      ],
      explanation: "Ask: should this failure stop traffic (readiness) or restart the container (liveness)?",
    },
  },

  "requests-and-limits": {
    objectives: [
      "Explain how resource requests affect scheduling",
      "Explain what limits enforce at run time",
      "Recognise CPU throttling and OOMKilled",
    ],
    sections: [
      {
        type: "text",
        heading: "Two numbers per resource",
        paragraphs: [
          "Each container can declare **requests** and **limits** for CPU and memory. CPU is measured in cores or millicores (`250m` = a quarter of a core); memory in bytes (`128Mi`, `1Gi`).",
        ],
      },
      { type: "diagram", diagram: "resources", caption: "The scheduler adds up requests, not live usage, to decide what fits on a node." },
      {
        type: "list",
        items: [
          "**Request**: the amount reserved for the container. The scheduler only places a Pod on a node with enough unrequested capacity. Too-large requests mean Pods stay **Pending**.",
          "**Limit**: the maximum at run time. A container using more CPU than its limit is **throttled** (slowed down). A container exceeding its memory limit is **killed** (`OOMKilled`) and restarted.",
        ],
      },
      {
        type: "code",
        language: "yaml",
        code: `resources:
  requests:
    cpu: 250m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 256Mi`,
      },
      {
        type: "callout",
        tone: "tip",
        title: "Start from measurements",
        body: "Set requests close to typical usage and memory limits with headroom above peaks. Guessing very high wastes cluster capacity; guessing very low causes throttling or OOM kills.",
      },
    ],
    keyTakeaways: [
      "Requests drive scheduling; oversized requests cause Pending Pods.",
      "Over the CPU limit → throttled; over the memory limit → OOMKilled.",
      "Base values on real usage.",
    ],
    quizQuestions: [
      {
        id: "q1",
        prompt: "What does the scheduler use to decide whether a Pod fits on a node?",
        kind: "single",
        options: [
          { id: "a", text: "The container's current CPU usage" },
          { id: "b", text: "The Pod's resource requests versus the node's unrequested capacity" },
          { id: "c", text: "The image size" },
          { id: "d", text: "The number of labels" },
        ],
        correct: ["b"],
        explanation: "Scheduling is based on requests, which makes placement predictable.",
      },
      {
        id: "q2",
        prompt: "A container repeatedly exceeds its memory limit. What happens?",
        kind: "single",
        options: [
          { id: "a", text: "It is throttled" },
          { id: "b", text: "It is killed (OOMKilled) and restarted" },
          { id: "c", text: "Its limit is raised automatically" },
          { id: "d", text: "Nothing" },
        ],
        correct: ["b"],
        explanation: "Memory can't be throttled like CPU. The kernel kills the process, and Kubernetes restarts the container.",
      },
      {
        id: "q3",
        prompt: "Which statements are true? Select all that apply.",
        kind: "multiple",
        options: [
          { id: "a", text: "250m CPU means a quarter of a core" },
          { id: "b", text: "Exceeding the CPU limit slows the container down" },
          { id: "c", text: "A huge request can leave a Pod Pending" },
          { id: "d", text: "Limits are used for scheduling decisions" },
        ],
        correct: ["a", "b", "c"],
        explanation: "Requests, not limits, are used for scheduling.",
      },
    ],
    activity: {
      type: "scenario",
      title: "The restarting report job",
      symptom: "The report Pod restarts every few minutes. RESTARTS keeps climbing, and the app logs end abruptly without an error.",
      context: {
        label: "kubectl describe pod report-7f9c… (excerpt, simulated)",
        language: "text",
        code: `    Last State:     Terminated
      Reason:       OOMKilled
      Exit Code:    137
    Limits:
      memory:  128Mi
    Requests:
      memory:  128Mi`,
      },
      question: "What's the most sensible fix?",
      options: [
        { id: "a", text: "Measure its real memory use and raise the memory limit (and request) accordingly", correct: true, feedback: "Yes. OOMKilled means the container exceeded its memory limit. Give it enough memory, or reduce what the app uses." },
        { id: "b", text: "Add more CPU", correct: false, feedback: "CPU isn't the problem. The reason is OOMKilled, which is about memory." },
        { id: "c", text: "Delete the Pod so it restarts", correct: false, feedback: "It already restarts. It will be killed again at the same point." },
        { id: "d", text: "Add a readiness probe", correct: false, feedback: "Readiness controls traffic. It won't stop the kernel killing an over-limit process." },
      ],
      explanation: "Exit code 137 with reason OOMKilled is the classic signature of a memory limit that's too low.",
    },
  },

  "rolling-updates-and-rollbacks": {
    objectives: [
      "Describe how a rolling update replaces Pods gradually",
      "Trigger, watch, and inspect a rollout",
      "Roll back to a previous revision",
    ],
    sections: [
      {
        type: "text",
        heading: "Shipping without downtime",
        paragraphs: [
          "Change a Deployment's Pod template, typically the image tag, and Kubernetes performs a **rolling update**: it creates a new ReplicaSet and gradually scales it up while scaling the old one down. By default, at most 25% extra Pods are created (maxSurge) and at most 25% may be unavailable (maxUnavailable), so capacity stays high throughout.",
        ],
      },
      { type: "diagram", diagram: "rolling-update", caption: "Step through a rollout from v1 to v2." },
      {
        type: "code",
        language: "bash",
        caption: "The rollout toolkit",
        code: `kubectl set image deployment/web web=nginx:1.28   # change the template
kubectl rollout status deployment/web             # wait for it to finish
kubectl rollout history deployment/web            # list revisions
kubectl rollout undo deployment/web               # go back one revision`,
      },
      {
        type: "text",
        heading: "Bad releases get stuck, not shipped",
        paragraphs: [
          "If the new Pods never become ready (a broken image, a crash, a failing readiness probe), the rollout stalls: old Pods keep serving, and `rollout status` keeps waiting. That's your signal to investigate or roll back. Old ReplicaSets are kept at zero replicas precisely so that `rollout undo` can scale them back up quickly.",
        ],
      },
      {
        type: "callout",
        tone: "tip",
        title: "Prefer changing the manifest",
        body: "`kubectl set image` is handy for practice. In real projects, update the image tag in the manifest (via your CI/CD pipeline) and apply it, so git shows exactly what is deployed.",
      },
    ],
    keyTakeaways: [
      "Template changes trigger rolling updates via a new ReplicaSet.",
      "Readiness gates the rollout; broken versions stall instead of taking over.",
      "rollout undo returns to the previous revision quickly.",
    ],
    quizQuestions: [
      {
        id: "q1",
        prompt: "What triggers a rolling update of a Deployment?",
        kind: "single",
        options: [
          { id: "a", text: "Any change to the Pod template, such as the image" },
          { id: "b", text: "Running kubectl get pods" },
          { id: "c", text: "Changing the Deployment's labels on metadata only" },
          { id: "d", text: "Scaling replicas" },
        ],
        correct: ["a"],
        explanation: "A new template means a new ReplicaSet. Scaling only changes the count within the current ReplicaSet.",
      },
      {
        id: "q2",
        prompt: "You deploy an image tag that doesn't exist. What happens to the old Pods?",
        kind: "single",
        options: [
          { id: "a", text: "They're all deleted immediately" },
          { id: "b", text: "Most keep running and serving while the rollout is stuck" },
          { id: "c", text: "They're upgraded in place" },
          { id: "d", text: "The cluster shuts down" },
        ],
        correct: ["b"],
        explanation: "New Pods never become ready, so the controller doesn't remove old ones beyond the maxUnavailable budget.",
      },
      {
        id: "q3",
        prompt: "Why are old ReplicaSets kept (at 0 replicas)? Select all that apply.",
        kind: "multiple",
        options: [
          { id: "a", text: "To enable fast rollbacks" },
          { id: "b", text: "To keep revision history" },
          { id: "c", text: "To run old Pods in the background" },
          { id: "d", text: "Because Kubernetes can't delete them" },
        ],
        correct: ["a", "b"],
        explanation: "They hold previous Pod templates for history and rollback. At 0 replicas they run nothing.",
      },
    ],
    activity: {
      type: "terminal",
      title: "Release and roll back",
      instructions: "Ship nginx:1.28, inspect the rollout, then roll back.",
      mode: "kubernetes",
      scenario: "k8s-running-app",
      steps: [
        { id: "update", instruction: "Update web to nginx:1.28.", hint: "kubectl set image deployment/web web=nginx:1.28", goal: { kind: "k8s-deployment", name: "web", image: "nginx:1.28" } },
        { id: "status", instruction: "Check the rollout status.", hint: "kubectl rollout status deployment/web", goal: { kind: "command", pattern: "^kubectl rollout status (deploy(ment)?/web|deploy(ment)? web)" } },
        { id: "history", instruction: "View the rollout history.", hint: "kubectl rollout history deployment/web", goal: { kind: "command", pattern: "^kubectl rollout history (deploy(ment)?/web|deploy(ment)? web)" } },
        { id: "undo", instruction: "Roll back to the previous version.", hint: "kubectl rollout undo deployment/web", goal: { kind: "k8s-deployment", name: "web", image: "nginx:1.27" } },
      ],
      explanation: "You rolled forward and back between ReplicaSets with no moment where the app had zero ready Pods.",
    },
  },
};
