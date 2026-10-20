import type { LessonContent } from "../types";

export const kubernetesModule6: Record<string, LessonContent> = {
  pods: {
    objectives: [
      "Define a Pod and what its containers share",
      "Create and inspect a Pod from a manifest",
      "Explain why bare Pods are not used for typical production workloads",
    ],
    sections: [
      {
        type: "text",
        heading: "The smallest deployable unit",
        paragraphs: [
          "Kubernetes doesn't run containers directly. It runs **Pods**. A Pod wraps one or more containers that are scheduled together onto the same node and share a network identity (one IP address, so they can talk over `localhost`) and, optionally, storage volumes.",
          "Most Pods hold a single application container. Multiple containers in one Pod are for tightly coupled helpers, sometimes called **sidecars**, such as a log shipper that reads the app's log files.",
        ],
      },
      { type: "diagram", diagram: "pod-anatomy", caption: "Containers in a Pod share an IP and can share volumes. The Pod is scheduled as a single unit." },
      {
        type: "code",
        language: "yaml",
        filename: "pod.yaml",
        code: `apiVersion: v1
kind: Pod
metadata:
  name: hello
  labels:
    app: hello
spec:
  containers:
    - name: hello
      image: nginx:1.27
      ports:
        - containerPort: 80`,
      },
      {
        type: "text",
        heading: "Pods are disposable",
        paragraphs: [
          "Pods are designed to be **replaced, not repaired**. When a node fails, its Pods are gone. A Pod you created by hand (a bare Pod) is not recreated by anything. That's why, for typical stateless apps, you don't create Pods yourself: you create a **Deployment**, and it creates and replaces Pods for you.",
          "Pods also get a new IP address each time they are recreated, which is why Services exist (two lessons from now).",
        ],
      },
      {
        type: "callout",
        tone: "tip",
        title: "When you'll see bare Pods",
        body: "Quick experiments and debugging (e.g. `kubectl run tmp --image=busybox`) are fine as bare Pods. For anything that should keep running, use a controller.",
      },
    ],
    keyTakeaways: [
      "A Pod wraps one or more containers that share network and can share storage.",
      "Pods are disposable: replaced, never repaired.",
      "Bare Pods aren't recreated, so use a Deployment for typical workloads.",
    ],
    quizQuestions: [
      {
        id: "q1",
        prompt: "Two containers run in the same Pod. How can one reach the other's port 9000?",
        kind: "single",
        options: [
          { id: "a", text: "localhost:9000" },
          { id: "b", text: "Only through a Service" },
          { id: "c", text: "They can't communicate" },
          { id: "d", text: "Through the node's public IP" },
        ],
        correct: ["a"],
        explanation: "Containers in a Pod share one network namespace, so they reach each other on localhost.",
      },
      {
        id: "q2",
        prompt: "You delete a bare Pod you created from pod.yaml. What happens?",
        kind: "single",
        options: [
          { id: "a", text: "Kubernetes recreates it automatically" },
          { id: "b", text: "It is gone; nothing recreates it" },
          { id: "c", text: "It moves to another node" },
          { id: "d", text: "It becomes a Deployment" },
        ],
        correct: ["b"],
        explanation: "No controller owns a bare Pod, so nothing restores it. A Deployment would.",
      },
      {
        id: "q3",
        prompt: "Which statements about Pods are true? Select all that apply.",
        kind: "multiple",
        options: [
          { id: "a", text: "A Pod is scheduled onto a single node" },
          { id: "b", text: "A Pod keeps its IP address forever" },
          { id: "c", text: "Most Pods contain one application container" },
          { id: "d", text: "Deployments are preferred for typical stateless apps" },
        ],
        correct: ["a", "c", "d"],
        explanation: "Pods live on one node, usually hold one main container, and are best managed by controllers. Their IPs change when they're replaced.",
      },
    ],
    activity: {
      type: "terminal",
      title: "A Pod's short life",
      instructions: "Create a bare Pod, then delete it and see that nothing brings it back.",
      mode: "kubernetes",
      scenario: "k8s-empty",
      steps: [
        { id: "cat", instruction: "Read pod.yaml.", hint: "cat pod.yaml", goal: { kind: "command", pattern: "^cat pod\\.yaml$" } },
        { id: "apply", instruction: "Create the Pod.", hint: "kubectl apply -f pod.yaml", goal: { kind: "command", pattern: "^kubectl apply -f pod\\.yaml$" } },
        { id: "get", instruction: "List Pods.", hint: "kubectl get pods", goal: { kind: "command", pattern: "^kubectl get (po|pod|pods)\\b" } },
        { id: "delete", instruction: "Delete the hello Pod.", hint: "kubectl delete pod hello", goal: { kind: "command", pattern: "^kubectl delete (po|pod|pods) hello$" } },
        { id: "again", instruction: "List Pods again.", hint: "kubectl get pods", goal: { kind: "command", pattern: "^kubectl get (po|pod|pods)\\b" } },
      ],
      explanation: "The Pod stayed deleted because no controller manages it. In the next lesson, a Deployment will replace deleted Pods automatically.",
    },
  },

  "deployments-and-replicasets": {
    objectives: [
      "Explain how Deployments, ReplicaSets, and Pods relate",
      "Read a Deployment manifest's replicas, selector, and template",
      "Inspect the chain of objects with kubectl",
    ],
    sections: [
      {
        type: "text",
        heading: "Three layers of responsibility",
        paragraphs: [
          "A **Deployment** describes an application: which Pod template to run and how many **replicas** (copies). It doesn't create Pods directly. It creates a **ReplicaSet**, whose only job is to keep exactly N Pods matching its selector running. When you change the Pod template, the Deployment creates a new ReplicaSet and shifts Pods over gradually: a rolling update.",
        ],
      },
      { type: "diagram", diagram: "desired-vs-actual", caption: "The ReplicaSet keeps actual Pods equal to desired replicas. Try deleting one." },
      {
        type: "code",
        language: "yaml",
        filename: "deployment.yaml",
        code: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 2                # how many Pods
  selector:
    matchLabels:
      app: web               # which Pods belong to this Deployment
  template:                  # the Pod template
    metadata:
      labels:
        app: web             # must match the selector
    spec:
      containers:
        - name: web
          image: nginx:1.27`,
      },
      {
        type: "callout",
        tone: "warning",
        title: "Selector and template labels must match",
        body: "The API server rejects a Deployment whose `selector.matchLabels` doesn't match `template.metadata.labels`. That rule keeps the Deployment able to find the Pods it creates.",
      },
      {
        type: "text",
        heading: "Reading the names",
        paragraphs: [
          "Names encode ownership: Deployment `web` → ReplicaSet `web-7d4b9c8f5d` (a hash of the Pod template) → Pods `web-7d4b9c8f5d-x2k9p`. When you see that pattern in `kubectl get pods`, you know a Deployment manages those Pods.",
        ],
      },
    ],
    keyTakeaways: [
      "Deployment → ReplicaSet → Pods.",
      "ReplicaSets keep the desired number of Pods; Deployments manage ReplicaSets across versions.",
      "The selector must match the Pod template's labels.",
    ],
    quizQuestions: [
      {
        id: "q1",
        prompt: "What directly creates the Pods for a Deployment?",
        kind: "single",
        options: [
          { id: "a", text: "The Deployment itself" },
          { id: "b", text: "A ReplicaSet owned by the Deployment" },
          { id: "c", text: "kubectl" },
          { id: "d", text: "The scheduler" },
        ],
        correct: ["b"],
        explanation: "The Deployment manages ReplicaSets; each ReplicaSet creates and maintains Pods. The scheduler only picks nodes.",
      },
      {
        id: "q2",
        prompt: "A Deployment wants 3 replicas. One Pod is deleted. What happens?",
        kind: "single",
        options: [
          { id: "a", text: "The Deployment scales down to 2" },
          { id: "b", text: "The ReplicaSet creates a replacement Pod" },
          { id: "c", text: "Nothing" },
          { id: "d", text: "All Pods restart" },
        ],
        correct: ["b"],
        explanation: "The ReplicaSet notices 2 ≠ 3 and creates a new Pod to restore the desired count.",
      },
      {
        id: "q3",
        prompt: "In `web-7d4b9c8f5d-x2k9p`, what does `7d4b9c8f5d` represent? Select all that apply.",
        kind: "multiple",
        options: [
          { id: "a", text: "A hash identifying the ReplicaSet / Pod template" },
          { id: "b", text: "It changes when the Pod template changes" },
          { id: "c", text: "The node's ID" },
          { id: "d", text: "The image digest" },
        ],
        correct: ["a", "b"],
        explanation: "The pod-template-hash names the ReplicaSet. A new template means a new ReplicaSet with a new hash.",
      },
    ],
    activity: {
      type: "terminal",
      title: "Follow the chain",
      instructions: "Apply a Deployment and inspect each layer it creates.",
      mode: "kubernetes",
      scenario: "k8s-empty",
      steps: [
        { id: "apply", instruction: "Apply deployment.yaml.", hint: "kubectl apply -f deployment.yaml", goal: { kind: "k8s-deployment", name: "web" } },
        { id: "deploy", instruction: "List Deployments.", hint: "kubectl get deployments", goal: { kind: "command", pattern: "^kubectl get (deploy|deployment|deployments)\\b" } },
        { id: "rs", instruction: "List ReplicaSets.", hint: "kubectl get rs", goal: { kind: "command", pattern: "^kubectl get (rs|replicaset|replicasets)\\b" } },
        { id: "pods", instruction: "List Pods and notice their names.", hint: "kubectl get pods", goal: { kind: "command", pattern: "^kubectl get (po|pod|pods)\\b" } },
      ],
      explanation: "Deployment web created ReplicaSet web-<hash>, which created two Pods named web-<hash>-<random>.",
    },
  },

  services: {
    objectives: [
      "Explain why Pods need a stable address",
      "Describe how a Service selects Pods and forwards traffic",
      "Compare ClusterIP, NodePort, and LoadBalancer at an introductory level",
    ],
    sections: [
      {
        type: "text",
        heading: "Pods come and go; addresses must not",
        paragraphs: [
          "Every Pod gets its own IP, but Pods are replaced all the time: during scaling, rollouts, and failures. A client that remembered a Pod's IP would soon be talking to nothing. A **Service** gives a changing set of Pods one stable virtual IP and DNS name, and load-balances traffic across them.",
        ],
      },
      { type: "diagram", diagram: "service-selector", caption: "A Service routes to every ready Pod whose labels match its selector. Try changing the selector." },
      {
        type: "code",
        language: "yaml",
        filename: "service.yaml",
        code: `apiVersion: v1
kind: Service
metadata:
  name: web
spec:
  type: ClusterIP
  selector:
    app: web          # route to Pods labelled app=web
  ports:
    - port: 80        # the Service's port
      targetPort: 80  # the container port on the Pods`,
      },
      {
        type: "list",
        heading: "Service types",
        items: [
          "**ClusterIP** (default): a virtual IP reachable only inside the cluster. Other apps use the DNS name `web` (or `web.default.svc.cluster.local`).",
          "**NodePort**: also opens the same port (30000–32767) on every node, so traffic to any node's IP on that port reaches the Service.",
          "**LoadBalancer**: on supported cloud providers, also provisions an external load balancer with a public address.",
        ],
      },
      {
        type: "callout",
        tone: "info",
        title: "Endpoints show the real targets",
        body: "`kubectl get endpoints web` lists the Pod IPs the Service currently routes to. Only Pods that are Ready appear there. If it's empty, check the selector and the Pods' readiness.",
      },
    ],
    keyTakeaways: [
      "A Service gives a changing set of Pods a stable name and IP.",
      "It selects Pods by label and only routes to ready ones.",
      "ClusterIP is internal; NodePort and LoadBalancer expose the Service further.",
    ],
    quizQuestions: [
      {
        id: "q1",
        prompt: "Why not just call a Pod by its IP address?",
        kind: "single",
        options: [
          { id: "a", text: "Pod IPs are secret" },
          { id: "b", text: "Pods are replaced often and get new IPs" },
          { id: "c", text: "Pods have no IP" },
          { id: "d", text: "IPs are slower than names" },
        ],
        correct: ["b"],
        explanation: "Pod IPs are ephemeral. A Service provides a stable address in front of them.",
      },
      {
        id: "q2",
        prompt: "Which Service type is reachable only from inside the cluster?",
        kind: "single",
        options: [
          { id: "a", text: "ClusterIP" },
          { id: "b", text: "NodePort" },
          { id: "c", text: "LoadBalancer" },
          { id: "d", text: "ExternalIP" },
        ],
        correct: ["a"],
        explanation: "ClusterIP is internal. NodePort and LoadBalancer add ways in from outside.",
      },
      {
        id: "q3",
        prompt: "A Service has no endpoints. What should you check? Select all that apply.",
        kind: "multiple",
        options: [
          { id: "a", text: "Whether the selector matches the Pods' labels" },
          { id: "b", text: "Whether the Pods are Ready" },
          { id: "c", text: "Whether the Service name is uppercase" },
          { id: "d", text: "Whether the Pods are in the same namespace" },
        ],
        correct: ["a", "b", "d"],
        explanation: "Endpoints are ready Pods in the same namespace whose labels match the selector.",
      },
    ],
    activity: {
      type: "terminal",
      title: "Inspect and create Services",
      instructions: "Look at the existing web Service, then expose the api Deployment.",
      mode: "kubernetes",
      scenario: "k8s-running-app",
      steps: [
        { id: "svc", instruction: "List Services.", hint: "kubectl get svc", goal: { kind: "command", pattern: "^kubectl get (svc|service|services)\\b" } },
        { id: "describe", instruction: "Describe the web Service.", hint: "kubectl describe svc web", goal: { kind: "command", pattern: "^kubectl describe (svc|service|services) web$" } },
        { id: "ep", instruction: "List web's endpoints.", hint: "kubectl get endpoints web", goal: { kind: "command", pattern: "^kubectl get (ep|endpoints)\\b" } },
        { id: "expose", instruction: "Expose the api Deployment on port 80, targeting container port 3000.", hint: "kubectl expose deployment api --port=80 --target-port=3000", goal: { kind: "k8s-service", name: "api", selectsApp: "api" } },
      ],
      explanation: "The new api Service selects Pods labelled app=api and forwards port 80 to their port 3000.",
    },
  },

  "namespaces-labels-selectors": {
    objectives: [
      "Use namespaces to group and separate objects",
      "Attach labels and filter with selectors",
      "See how labels connect Deployments, Pods, and Services",
    ],
    sections: [
      {
        type: "text",
        heading: "Namespaces: folders for objects",
        paragraphs: [
          "A **namespace** groups related objects within one cluster: per team, per app, or per environment like `staging`. Names must be unique within a namespace, not across the whole cluster. kubectl uses `default` unless you pass `-n NAME` (or `-A` for all namespaces). System components live in `kube-system`.",
        ],
      },
      {
        type: "callout",
        tone: "warning",
        title: "Namespaces are not a security wall by themselves",
        body: "Namespaces organise objects and are where RBAC rules, quotas, and network policies are applied. Without those policies, workloads in different namespaces can still reach each other over the network.",
      },
      {
        type: "text",
        heading: "Labels and selectors",
        paragraphs: [
          "**Labels** are key/value pairs attached to objects, such as `app: web`, `tier: frontend`, or `env: prod`. A **selector** is a query over labels. Selectors are how Kubernetes objects find each other: a Deployment's selector finds its Pods, and a Service's selector finds the Pods to route to.",
        ],
      },
      { type: "diagram", diagram: "service-selector", caption: "Labels on Pods + a selector on the Service = routing." },
      {
        type: "code",
        language: "bash",
        caption: "Working with labels and namespaces",
        code: `kubectl get pods --show-labels        # see every Pod's labels
kubectl get pods -l app=web           # filter by label
kubectl get pods -n kube-system       # look in another namespace
kubectl create namespace staging      # make a new namespace`,
      },
    ],
    keyTakeaways: [
      "Namespaces group objects; names are unique per namespace.",
      "Labels describe objects; selectors query them.",
      "Selectors connect Deployments and Services to Pods.",
    ],
    quizQuestions: [
      {
        id: "q1",
        prompt: "Two teams both want a Deployment named web in the same cluster. What lets them do that?",
        kind: "single",
        options: [
          { id: "a", text: "Different labels" },
          { id: "b", text: "Different namespaces" },
          { id: "c", text: "Different images" },
          { id: "d", text: "It's impossible" },
        ],
        correct: ["b"],
        explanation: "Object names must be unique within a namespace, so separate namespaces allow the same name.",
      },
      {
        id: "q2",
        prompt: "What does `kubectl get pods -l tier=frontend` return?",
        kind: "single",
        options: [
          { id: "a", text: "Pods whose name contains frontend" },
          { id: "b", text: "Pods with the label tier=frontend in the current namespace" },
          { id: "c", text: "All Pods in a namespace called frontend" },
          { id: "d", text: "Services labelled frontend" },
        ],
        correct: ["b"],
        explanation: "-l applies a label selector, in the current namespace unless you add -n or -A.",
      },
      {
        id: "q3",
        prompt: "Which objects use label selectors to find Pods? Select all that apply.",
        kind: "multiple",
        options: [
          { id: "a", text: "Deployments (via ReplicaSets)" },
          { id: "b", text: "Services" },
          { id: "c", text: "Namespaces" },
          { id: "d", text: "kubectl get -l" },
        ],
        correct: ["a", "b", "d"],
        explanation: "Controllers, Services, and your own queries all rely on selectors. Namespaces contain objects; they don't select them.",
      },
    ],
    activity: {
      type: "terminal",
      title: "Slice the cluster",
      instructions: "Explore labels and namespaces in a running cluster.",
      mode: "kubernetes",
      scenario: "k8s-running-app",
      steps: [
        { id: "labels", instruction: "Show every Pod's labels.", hint: "kubectl get pods --show-labels", goal: { kind: "command", pattern: "^kubectl get (po|pod|pods)\\b.*--show-labels" } },
        { id: "filter", instruction: "List only the api Pods.", hint: "kubectl get pods -l app=api", goal: { kind: "command", pattern: "^kubectl get (po|pod|pods)\\b.*(-l|--selector)[ =]app=api" } },
        { id: "ns", instruction: "List namespaces.", hint: "kubectl get namespaces", goal: { kind: "command", pattern: "^kubectl get (ns|namespace|namespaces)\\b" } },
        { id: "create", instruction: "Create a namespace called staging.", hint: "kubectl create namespace staging", goal: { kind: "command", pattern: "^kubectl create (namespace|ns) staging$" } },
      ],
      explanation: "Labels let you slice workloads any way you like; namespaces give you separate spaces for names and policies.",
    },
  },

  "configmaps-and-secrets": {
    objectives: [
      "Keep configuration out of images with ConfigMaps",
      "Explain what Kubernetes Secrets do and do not protect",
      "Choose the right object for each kind of setting",
    ],
    sections: [
      {
        type: "text",
        heading: "ConfigMaps",
        paragraphs: [
          "A **ConfigMap** stores non-secret configuration as key/value pairs or whole files. Pods consume it as environment variables or as files mounted into the container. Exactly as with Docker, this lets one image run in every environment with different settings.",
        ],
      },
      {
        type: "code",
        language: "yaml",
        caption: "A ConfigMap and a container that reads it",
        code: `apiVersion: v1
kind: ConfigMap
metadata:
  name: web-config
data:
  LOG_LEVEL: info
  WELCOME_MESSAGE: "Hello from a ConfigMap"
---
# in the Pod template:
containers:
  - name: web
    image: nginx:1.27
    envFrom:
      - configMapRef:
          name: web-config`,
      },
      { type: "diagram", diagram: "config-secrets", caption: "ConfigMaps and Secrets are injected into Pods as environment variables or files." },
      {
        type: "text",
        heading: "Secrets",
        paragraphs: [
          "A **Secret** is similar, but intended for sensitive values such as passwords, tokens, and keys. Kubernetes treats Secrets a little more carefully (for example, they can be mounted in memory and are kept separate from ConfigMaps), but understand the limits.",
        ],
      },
      {
        type: "callout",
        tone: "warning",
        title: "base64 is not encryption",
        body: "Secret values are stored base64-encoded, which anyone can decode. They are not automatically encrypted in every setup. Protect them with RBAC (limit who can read Secrets), enable encryption at rest for etcd, and consider an external secret manager for production.",
      },
      {
        type: "code",
        language: "bash",
        simulated: true,
        caption: "Anyone who can read the Secret can decode it",
        code: `$ kubectl get secret db-credentials -o jsonpath='{.data.password}'
c3VwZXItc2VjcmV0
$ echo c3VwZXItc2VjcmV0 | base64 --decode
super-secret`,
      },
    ],
    keyTakeaways: [
      "ConfigMaps hold non-secret configuration; Secrets hold sensitive values.",
      "Both are consumed as environment variables or mounted files.",
      "Secrets are base64-encoded, not inherently secure. Use RBAC and encryption at rest.",
    ],
    quizQuestions: [
      {
        id: "q1",
        prompt: "Where should a log level setting like LOG_LEVEL=info usually go?",
        kind: "single",
        options: [
          { id: "a", text: "Hard-coded in the image" },
          { id: "b", text: "A ConfigMap" },
          { id: "c", text: "A Secret" },
          { id: "d", text: "The Pod's name" },
        ],
        correct: ["b"],
        explanation: "It's non-sensitive configuration that varies by environment, the classic ConfigMap use.",
      },
      {
        id: "q2",
        prompt: "A teammate says “our database password is safe because it's in a Secret and base64-encoded.” What's the best response?",
        kind: "single",
        options: [
          { id: "a", text: "Agreed, base64 is strong encryption" },
          { id: "b", text: "base64 is only an encoding. Access control and encryption at rest are what protect it." },
          { id: "c", text: "Secrets can't be read by anyone" },
          { id: "d", text: "Move it into a ConfigMap instead" },
        ],
        correct: ["b"],
        explanation: "Anyone allowed to read the Secret can decode it. Restrict access with RBAC and enable encryption at rest.",
      },
      {
        id: "q3",
        prompt: "How can a Pod consume a ConfigMap or Secret? Select all that apply.",
        kind: "multiple",
        options: [
          { id: "a", text: "As environment variables" },
          { id: "b", text: "As files mounted into the container" },
          { id: "c", text: "By rebuilding the image" },
          { id: "d", text: "Through envFrom to load all keys" },
        ],
        correct: ["a", "b", "d"],
        explanation: "Both objects are injected at run time: no rebuild needed.",
      },
    ],
    activity: {
      type: "classify",
      title: "ConfigMap or Secret?",
      instructions: "Decide where each setting belongs.",
      buckets: [
        { id: "cm", label: "ConfigMap" },
        { id: "secret", label: "Secret" },
      ],
      items: [
        { id: "log", label: "LOG_LEVEL=info", bucket: "cm" },
        { id: "dbpass", label: "Database password", bucket: "secret" },
        { id: "token", label: "Third-party API token", bucket: "secret" },
        { id: "flag", label: "Feature flag ENABLE_BETA=true", bucket: "cm" },
        { id: "tls", label: "TLS private key", bucket: "secret" },
        { id: "url", label: "Public URL of the website", bucket: "cm" },
      ],
      explanation: "If leaking it would cause harm, it's a Secret (and still needs access controls). Otherwise use a ConfigMap.",
    },
  },
};
