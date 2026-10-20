import type { LessonContent } from "../types";

export const kubernetesModule5: Record<string, LessonContent> = {
  "why-kubernetes": {
    objectives: [
      "Identify the operational problems that appear when running containers at scale",
      "Define orchestration",
      "Map each problem to the Kubernetes feature that addresses it",
    ],
    sections: [
      {
        type: "text",
        heading: "One container is easy. A fleet is not.",
        paragraphs: [
          "With Docker you can run a container on one machine. Now imagine a real product: dozens of services, each needing several copies for reliability, spread over many machines, updated several times a day. Questions pile up quickly.",
        ],
      },
      {
        type: "list",
        items: [
          "A container crashes at 3 a.m. Who restarts it?",
          "A whole machine dies. Who moves its containers to healthy machines?",
          "Traffic triples. How do you add copies, and how does traffic find them?",
          "You ship version 2. How do you replace copies gradually without downtime, and undo it if it is broken?",
          "Containers keep getting new IP addresses. How do other services find them?",
        ],
      },
      {
        type: "text",
        heading: "Orchestration",
        paragraphs: [
          "**Orchestration** means automating the deployment, scaling, networking, and healing of containers across a group of machines. **Kubernetes** is the most widely used open-source orchestrator. You tell it what you want running, and it continuously works to keep that true.",
        ],
      },
      { type: "diagram", diagram: "desired-vs-actual", caption: "You declare 3 replicas. If one disappears, Kubernetes notices and creates a replacement." },
      {
        type: "callout",
        tone: "info",
        title: "Kubernetes runs images; it doesn't build them",
        body: "You still build images with Docker (or another builder) and push them to a registry. Kubernetes pulls those images and runs them as containers on its machines.",
      },
      {
        type: "callout",
        tone: "warning",
        title: "Not every project needs it",
        body: "Kubernetes adds real complexity. A single small app may be perfectly served by Docker Compose or a managed platform. Kubernetes earns its keep when you have many services, many machines, or strict availability needs.",
      },
    ],
    keyTakeaways: [
      "At scale you need automatic restarts, rescheduling, scaling, rollouts, and service discovery.",
      "Orchestration automates running containers across many machines.",
      "Kubernetes runs images built elsewhere; it doesn't replace Docker builds.",
    ],
    quizQuestions: [
      {
        id: "q1",
        prompt: "What is container orchestration?",
        kind: "single",
        options: [
          { id: "a", text: "Writing Dockerfiles faster" },
          { id: "b", text: "Automating deployment, scaling, networking, and healing of containers across machines" },
          { id: "c", text: "Compressing images" },
          { id: "d", text: "A GUI for docker run" },
        ],
        correct: ["b"],
        explanation: "Orchestrators manage fleets of containers on clusters of machines.",
      },
      {
        id: "q2",
        prompt: "Which of these does Kubernetes do? Select all that apply.",
        kind: "multiple",
        options: [
          { id: "a", text: "Restart failed containers" },
          { id: "b", text: "Reschedule workloads when a node fails" },
          { id: "c", text: "Build images from Dockerfiles" },
          { id: "d", text: "Roll out new versions gradually" },
        ],
        correct: ["a", "b", "d"],
        explanation: "Kubernetes runs, heals, scales, and updates workloads. Building images is done before deployment.",
      },
      {
        id: "q3",
        prompt: "A team runs one small internal tool on a single server. What is a fair assessment?",
        kind: "single",
        options: [
          { id: "a", text: "They must use Kubernetes" },
          { id: "b", text: "Kubernetes may be more complexity than they need; simpler options can be enough" },
          { id: "c", text: "Containers are useless for them" },
          { id: "d", text: "They need at least 100 nodes" },
        ],
        correct: ["b"],
        explanation: "Kubernetes is powerful but adds operational overhead. Pick tools to match the problem.",
      },
    ],
    activity: {
      type: "matching",
      title: "Problem → feature",
      instructions: "Match each operational problem to the Kubernetes capability that solves it.",
      pairs: [
        { id: "crash", term: "A container crashes overnight", definition: "Automatic restarts and self-healing" },
        { id: "traffic", term: "Traffic suddenly triples", definition: "Scaling the number of replicas" },
        { id: "node", term: "A machine dies", definition: "Rescheduling Pods onto healthy nodes" },
        { id: "release", term: "Shipping v2 without downtime", definition: "Rolling updates and rollbacks" },
        { id: "ips", term: "Pods keep changing IP addresses", definition: "Services with stable names and IPs" },
      ],
      explanation: "Each of these is a lesson later in this track.",
    },
  },

  "cluster-architecture": {
    objectives: [
      "Describe a cluster as a control plane plus worker nodes",
      "Name the main control-plane components and their jobs",
      "Explain what runs on every worker node",
    ],
    sections: [
      {
        type: "text",
        heading: "A cluster is a team of machines",
        paragraphs: [
          "A Kubernetes **cluster** is a set of machines, called **nodes**, working together. The **control plane** makes decisions about the cluster; **worker nodes** run your applications. In production the control plane is usually spread across several machines for reliability, and managed services (EKS, GKE, AKS) run it for you.",
        ],
      },
      { type: "diagram", diagram: "cluster-hierarchy", caption: "Control plane → worker nodes → Pods → containers." },
      {
        type: "list",
        heading: "Control plane components",
        items: [
          "**kube-apiserver**: the front door. Every request, from kubectl or from other components, goes through its API.",
          "**etcd**: a consistent key-value store holding the cluster's state. It is the source of truth.",
          "**kube-scheduler**: picks a node for each new Pod based on resources and constraints.",
          "**kube-controller-manager**: runs controllers that keep actual state matching desired state (for example, keeping the right number of replicas).",
        ],
      },
      {
        type: "list",
        heading: "On every worker node",
        items: [
          "**kubelet**: the node's agent. It makes sure the containers for Pods assigned to the node are running and reports their status.",
          "**Container runtime**: e.g. containerd, which actually pulls images and runs containers.",
          "**kube-proxy** (or an equivalent network plugin): implements Service networking on the node.",
        ],
      },
      {
        type: "callout",
        tone: "info",
        title: "kubectl talks only to the API server",
        body: "When you run `kubectl get pods`, kubectl sends an HTTP request to the API server, which reads the state from etcd. kubectl never logs into nodes directly.",
      },
    ],
    keyTakeaways: [
      "Cluster = control plane (decisions) + worker nodes (running workloads).",
      "API server, etcd, scheduler, and controller manager form the control plane.",
      "Each node runs a kubelet and a container runtime.",
    ],
    quizQuestions: [
      {
        id: "q1",
        prompt: "Which component decides which node a new Pod runs on?",
        kind: "single",
        options: [
          { id: "a", text: "etcd" },
          { id: "b", text: "kube-scheduler" },
          { id: "c", text: "kubelet" },
          { id: "d", text: "kubectl" },
        ],
        correct: ["b"],
        explanation: "The scheduler assigns Pods to nodes. The kubelet on that node then runs them.",
      },
      {
        id: "q2",
        prompt: "Where is the cluster's desired and current state stored?",
        kind: "single",
        options: [
          { id: "a", text: "In etcd" },
          { id: "b", text: "In each container's writable layer" },
          { id: "c", text: "On your laptop" },
          { id: "d", text: "In the Docker image" },
        ],
        correct: ["a"],
        explanation: "etcd is the cluster's database, accessed through the API server.",
      },
      {
        id: "q3",
        prompt: "What runs on each worker node? Select all that apply.",
        kind: "multiple",
        options: [
          { id: "a", text: "kubelet" },
          { id: "b", text: "A container runtime such as containerd" },
          { id: "c", text: "Your application Pods" },
          { id: "d", text: "The only copy of etcd" },
        ],
        correct: ["a", "b", "c"],
        explanation: "Workers run the kubelet, a runtime, networking components, and your Pods. etcd belongs to the control plane.",
      },
    ],
    activity: {
      type: "classify",
      title: "Where does it live?",
      instructions: "Sort each component into the control plane or a worker node.",
      buckets: [
        { id: "cp", label: "Control plane" },
        { id: "worker", label: "Worker node" },
      ],
      items: [
        { id: "api", label: "kube-apiserver", bucket: "cp" },
        { id: "etcd", label: "etcd", bucket: "cp" },
        { id: "sched", label: "kube-scheduler", bucket: "cp" },
        { id: "cm", label: "kube-controller-manager", bucket: "cp" },
        { id: "kubelet", label: "kubelet", bucket: "worker" },
        { id: "runtime", label: "Container runtime (containerd)", bucket: "worker" },
        { id: "pods", label: "Your application's Pods", bucket: "worker" },
      ],
      explanation: "The control plane decides and records; workers run and report.",
    },
  },

  "desired-state-reconciliation": {
    objectives: [
      "Contrast imperative commands with declarative desired state",
      "Explain the reconciliation loop",
      "Predict how the cluster reacts when actual state drifts",
    ],
    sections: [
      {
        type: "text",
        heading: "Say what, not how",
        paragraphs: [
          "With Docker you mostly give **imperative** instructions: run this, stop that. Kubernetes is built around **declarative** configuration: you describe the **desired state** (“three replicas of web, image nginx:1.27”) and Kubernetes figures out the steps.",
        ],
      },
      { type: "diagram", diagram: "reconciliation", caption: "Observe → compare → act, repeated continuously." },
      {
        type: "text",
        heading: "The reconciliation loop",
        paragraphs: [
          "**Controllers** are loops that run forever. Each one watches certain objects, compares the desired state stored in the API with the actual state of the world, and takes actions to close the gap. If a Pod disappears, the controller sees 2 where 3 are desired and creates one. If you lower the count to 2, it removes one.",
          "This is why Kubernetes is called **self-healing**: you never have to notice and fix drift yourself.",
        ],
      },
      { type: "diagram", diagram: "desired-vs-actual", caption: "Try it: remove a Pod and watch the controller restore the desired count." },
      {
        type: "callout",
        tone: "tip",
        title: "Keep manifests as the source of truth",
        body: "If you change things imperatively (say, `kubectl scale`) but your YAML in git says something else, the next `kubectl apply` puts the YAML's value back. Treat the manifest as the record of intent.",
      },
    ],
    keyTakeaways: [
      "You declare desired state; Kubernetes works out how to get there.",
      "Controllers continuously observe, compare, and act.",
      "Drift is corrected automatically, which is what self-healing means.",
    ],
    quizQuestions: [
      {
        id: "q1",
        prompt: "Desired replicas are 3, but one Pod's node failed and 2 are running. What happens?",
        kind: "single",
        options: [
          { id: "a", text: "Nothing until an operator notices" },
          { id: "b", text: "The controller sees the gap and creates a new Pod" },
          { id: "c", text: "The Deployment is deleted" },
          { id: "d", text: "The desired count changes to 2" },
        ],
        correct: ["b"],
        explanation: "Reconciliation closes the gap between desired and actual state without human intervention.",
      },
      {
        id: "q2",
        prompt: "Which is a declarative statement?",
        kind: "single",
        options: [
          { id: "a", text: "Start one more container now" },
          { id: "b", text: "There should be 3 replicas of web running nginx:1.27" },
          { id: "c", text: "Stop container abc123" },
          { id: "d", text: "SSH into node 2 and restart Docker" },
        ],
        correct: ["b"],
        explanation: "Declarative configuration describes the end state, not the steps.",
      },
      {
        id: "q3",
        prompt: "What does a controller do? Select all that apply.",
        kind: "multiple",
        options: [
          { id: "a", text: "Watches objects through the API server" },
          { id: "b", text: "Compares desired and actual state" },
          { id: "c", text: "Takes actions to reduce the difference" },
          { id: "d", text: "Runs once at install and then stops" },
        ],
        correct: ["a", "b", "c"],
        explanation: "Controllers are continuous loops: observe, compare, act, repeat.",
      },
    ],
    activity: {
      type: "ordering",
      title: "Order the loop",
      instructions: "Arrange the steps from declaring intent to the cluster correcting drift.",
      items: [
        { id: "declare", label: "You declare desired state", detail: "kubectl apply -f deployment.yaml" },
        { id: "store", label: "The API server stores it in etcd" },
        { id: "observe", label: "A controller observes the actual state", detail: "e.g. only 2 Pods exist" },
        { id: "compare", label: "The controller compares actual with desired", detail: "2 ≠ 3" },
        { id: "act", label: "The controller acts to close the gap", detail: "creates one Pod" },
        { id: "repeat", label: "The loop repeats, forever" },
      ],
      explanation: "This loop is the heart of Kubernetes. Almost every feature is a controller running it for some kind of object.",
    },
  },

  "kubernetes-yaml-basics": {
    objectives: [
      "Read YAML structure: maps, lists, and indentation",
      "Identify apiVersion, kind, metadata, and spec in any manifest",
      "Know that status is written by Kubernetes, not by you",
    ],
    sections: [
      {
        type: "text",
        heading: "YAML in two minutes",
        paragraphs: [
          "Kubernetes objects are usually written in **YAML**, a human-friendly data format. `key: value` pairs form maps; lines starting with `- ` are list items; **indentation (spaces, never tabs)** shows nesting. A misplaced indent changes the meaning, so editors with YAML support help a lot.",
        ],
      },
      {
        type: "code",
        language: "yaml",
        filename: "pod.yaml",
        code: `apiVersion: v1          # which API version defines this kind
kind: Pod               # what type of object
metadata:               # identity: name, namespace, labels
  name: hello
  labels:
    app: hello
spec:                   # desired state
  containers:           # a list...
    - name: hello       # ...of maps
      image: nginx:1.27
      ports:
        - containerPort: 80`,
      },
      { type: "diagram", diagram: "yaml-anatomy", caption: "Every manifest has the same four top-level parts." },
      {
        type: "list",
        heading: "The four top-level fields",
        items: [
          "`apiVersion`: the API group and version, such as `v1` for Pods and Services, or `apps/v1` for Deployments.",
          "`kind`: the object type: Pod, Deployment, Service, ConfigMap…",
          "`metadata`: the name, namespace, labels, and annotations.",
          "`spec`: the desired state, which differs for each kind.",
        ],
      },
      {
        type: "callout",
        tone: "info",
        title: "status is the cluster's answer",
        body: "When you read an object back (`kubectl get pod hello -o yaml`), you'll also see `status`: the actual state observed by Kubernetes. You write spec; the cluster writes status.",
      },
    ],
    keyTakeaways: [
      "YAML uses indentation for nesting and `- ` for list items.",
      "Every manifest has apiVersion, kind, metadata, and spec.",
      "spec is desired state you write; status is actual state Kubernetes writes.",
    ],
    quizQuestions: [
      {
        id: "q1",
        prompt: "Which field states what type of object a manifest describes?",
        kind: "single",
        options: [
          { id: "a", text: "apiVersion" },
          { id: "b", text: "kind" },
          { id: "c", text: "metadata" },
          { id: "d", text: "spec" },
        ],
        correct: ["b"],
        explanation: "kind names the object type, e.g. Pod or Deployment.",
      },
      {
        id: "q2",
        prompt: "In the pod.yaml above, what is `containers`?",
        kind: "single",
        options: [
          { id: "a", text: "A single string" },
          { id: "b", text: "A list of maps, one per container" },
          { id: "c", text: "A label" },
          { id: "d", text: "A comment" },
        ],
        correct: ["b"],
        explanation: "The `- name: hello` line starts a list item that is itself a map of fields.",
      },
      {
        id: "q3",
        prompt: "Which statements are true? Select all that apply.",
        kind: "multiple",
        options: [
          { id: "a", text: "YAML indentation must use spaces" },
          { id: "b", text: "You normally write the status section yourself" },
          { id: "c", text: "Labels live under metadata" },
          { id: "d", text: "Deployments use apiVersion apps/v1" },
        ],
        correct: ["a", "c", "d"],
        explanation: "status is filled in by Kubernetes. The rest are core YAML and manifest rules.",
      },
    ],
    activity: {
      type: "matching",
      title: "Anatomy of a manifest",
      instructions: "Match each top-level field to its purpose.",
      pairs: [
        { id: "api", term: "apiVersion", definition: "Which API group and version defines the object" },
        { id: "kind", term: "kind", definition: "The type of object, such as Pod or Service" },
        { id: "meta", term: "metadata", definition: "The object's name, namespace, and labels" },
        { id: "spec", term: "spec", definition: "The desired state you want" },
        { id: "status", term: "status", definition: "The actual state observed by Kubernetes" },
      ],
      explanation: "Recognising these fields lets you read any manifest, even for object kinds you haven't met yet.",
    },
  },
};
