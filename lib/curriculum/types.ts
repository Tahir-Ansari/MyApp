export type TrackId = "docker" | "kubernetes";
export type Difficulty = "beginner" | "intermediate";

export type DiagramId =
  | "works-on-my-machine"
  | "container-vs-vm"
  | "image-container-lifecycle"
  | "registry-flow"
  | "dockerfile-pipeline"
  | "image-layers"
  | "port-mapping"
  | "volume-persistence"
  | "compose-stack"
  | "cluster-hierarchy"
  | "reconciliation"
  | "desired-vs-actual"
  | "service-selector"
  | "rolling-update"
  | "probes"
  | "resources"
  | "pod-states";

/** Inline text supports `code` and **bold** markers. */
export type LessonSection =
  | { type: "text"; heading?: string; paragraphs: string[] }
  | { type: "list"; heading?: string; items: string[]; ordered?: boolean }
  | {
      type: "code";
      language: "bash" | "dockerfile" | "yaml" | "text" | "json";
      code: string;
      caption?: string;
      /** True when the block shows command output that is simulated, not real. */
      simulated?: boolean;
      filename?: string;
    }
  | { type: "callout"; tone: "info" | "tip" | "warning"; title: string; body: string }
  | { type: "diagram"; diagram: DiagramId; caption: string }
  | { type: "analogy"; title: string; body: string };

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  kind: "single" | "multiple";
  options: QuizOption[];
  correct: string[];
  explanation: string;
  /** Optional code shown with the prompt. */
  code?: string;
}

export interface OrderingActivity {
  type: "ordering";
  title: string;
  instructions: string;
  /** Items listed in the correct order. They are shuffled for display. */
  items: { id: string; label: string; detail?: string }[];
  explanation: string;
}

export interface MatchingActivity {
  type: "matching";
  title: string;
  instructions: string;
  pairs: { id: string; term: string; definition: string }[];
  explanation: string;
}

export interface ClassifyActivity {
  type: "classify";
  title: string;
  instructions: string;
  buckets: { id: string; label: string }[];
  items: { id: string; label: string; bucket: string }[];
  explanation: string;
}

export interface ScenarioActivity {
  type: "scenario";
  title: string;
  symptom: string;
  context?: { label: string; code: string; language?: "bash" | "yaml" | "text" | "dockerfile" };
  question: string;
  options: { id: string; text: string; correct: boolean; feedback: string }[];
  explanation: string;
}

/** Goals are plain data so lessons can be passed from server to client components. */
export type TerminalGoal =
  | { kind: "command"; pattern: string }
  | { kind: "docker-image-present"; image: string }
  | {
      kind: "docker-container";
      state: "running" | "exists" | "removed";
      name?: string;
      image?: string;
      hostPort?: number;
      containerPort?: number;
      volume?: string;
      env?: string;
    }
  | { kind: "docker-volume-exists"; name: string }
  | { kind: "k8s-deployment"; name: string; replicas?: number; image?: string }
  | { kind: "k8s-service"; name?: string; selectsApp?: string; type?: string }
  | { kind: "k8s-pod-count"; app: string; running: number };

export type DockerScenarioId =
  | "docker-empty"
  | "docker-with-images"
  | "docker-mixed"
  | "docker-build"
  | "docker-compose";
export type KubernetesScenarioId =
  | "k8s-empty"
  | "k8s-running-app"
  | "k8s-crashloop"
  | "k8s-imagepull"
  | "k8s-pending";
export type ScenarioId = DockerScenarioId | KubernetesScenarioId;

export interface TerminalActivity {
  type: "terminal";
  title: string;
  instructions: string;
  mode: TrackId;
  scenario: ScenarioId;
  steps: { id: string; instruction: string; hint: string; goal: TerminalGoal }[];
  explanation: string;
}

export type Activity =
  | OrderingActivity
  | MatchingActivity
  | ClassifyActivity
  | ScenarioActivity
  | TerminalActivity;

export type ActivityType = Activity["type"];

/** Lesson metadata lives in the catalog so client code can use it without loading full content. */
export interface LessonMeta {
  slug: string;
  title: string;
  summary: string;
  difficulty: Difficulty;
  estimatedMinutes: number;
}

export interface LessonContent {
  objectives: string[];
  sections: LessonSection[];
  keyTakeaways: string[];
  quizQuestions: QuizQuestion[];
  activity: Activity;
}

export interface ModuleMeta {
  id: string;
  number: number;
  track: TrackId;
  title: string;
  description: string;
  lessons: LessonMeta[];
}

/** A lesson entry with position information derived from the catalog. */
export interface LessonEntry extends LessonMeta {
  id: string;
  number: number;
  track: TrackId;
  module: { id: string; number: number; title: string };
  prerequisites: string[];
  previousSlug: string | null;
  nextSlug: string | null;
}

export type Lesson = LessonEntry & LessonContent;

export interface TrackMeta {
  id: TrackId;
  title: string;
  tagline: string;
  description: string;
  href: string;
}
