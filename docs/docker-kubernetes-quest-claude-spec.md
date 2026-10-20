# Docker & Kubernetes Quest — Claude Code Build Specification

> **Goal:** Build a polished, game-like learning website that teaches Docker and Kubernetes from absolute beginner to practical confidence.
>
> **Implementation constraint:** Use Next.js only for the application. **No backend, database, authentication service, API server, or paid external service.** The experience must work with local lesson data and browser-local progress storage.

## 1. Product vision

Create an interactive learning experience that feels like a modern coding game rather than a documentation site. Learners progress through short missions, earn XP, unlock levels, complete quizzes, solve simulated terminal challenges, and build a mental model of containers and orchestration.

The site teaches concepts safely through **simulations**. It does not claim to run real Docker containers or Kubernetes clusters in the browser.

### Target audience
- Complete beginners who have never used Docker or Kubernetes.
- Developers who know basic programming but are new to containers.
- Learners who prefer visual explanations, short lessons, quizzes, and hands-on challenges.

### Learning outcomes
By the end, a learner should be able to:
- Explain images, containers, registries, volumes, networks, and Dockerfiles.
- Read and write basic Docker commands and a Dockerfile.
- Understand why Kubernetes exists and how a cluster is organized.
- Explain Pods, Deployments, Services, ConfigMaps, Secrets, and Namespaces.
- Read basic YAML manifests and reason about common failure states.
- Understand the relationship between building an image with Docker and running workloads with Kubernetes.

## 2. Required technology stack

Use:
- **Next.js App Router** with the current stable version available in the project.
- **TypeScript** with strict typing.
- **Tailwind CSS** for styling.
- **shadcn/ui** for accessible UI primitives where appropriate.
- **Lucide React** for icons.
- **Framer Motion** (or the current Motion package compatible with the project) for restrained transitions and game feedback.
- **Recharts** only if a meaningful progress visualization needs it; do not add it by default.
- Browser `localStorage` for persistence of progress, XP, streak, settings, and achievements.

Use the package manager already present in the repository. If starting from an empty directory, use npm.

### Explicitly do not add
- Backend or database of any kind.
- Supabase, Firebase, Clerk, Auth.js, or any authentication.
- API routes, server actions, or external APIs.
- Docker-in-Docker, a real terminal, or a real Kubernetes connection.
- A payment system, analytics SDK, or required third-party account.
- Fake login screens or backend-dependent features.

The app should be usable immediately without signup. Store progress on the current device/browser. Include a clear “Reset progress” option with confirmation.

## 3. Design direction

Create a high-quality, cohesive interface that feels like a premium developer-learning product.

### Visual style
- Dark-first interface with a deep navy/charcoal base, subtle blue-violet accents, and a restrained green success color.
- Strong contrast and readable typography.
- Spacious layout, carefully aligned cards, subtle borders, soft shadows, and consistent spacing.
- Use gradients sparingly for the hero and important progress moments.
- Use real interface hierarchy rather than putting every item inside a card.
- Avoid generic AI landing-page styling, excessive glassmorphism, excessive gradients, emoji-heavy UI, and giant empty hero sections.
- Include a light/dark theme toggle only if it can be implemented cleanly; dark theme is the default.
- Make the app feel like a product, not a static template.

### Responsive behavior
- Desktop: persistent left navigation/sidebar and a content area with a comfortable maximum width.
- Tablet: compact/collapsible sidebar.
- Mobile: compact top bar and bottom navigation or a clean mobile drawer.
- All lessons, quizzes, and challenge controls must be usable on touchscreens.
- No horizontal overflow at common viewport sizes.

### Accessibility
- Use semantic HTML and accessible labels.
- Ensure keyboard navigation and visible focus states.
- Do not communicate success/failure with color alone.
- Respect reduced-motion preferences.
- Maintain readable contrast and sensible text sizes.

## 4. Information architecture and routes

Implement these routes using the Next.js App Router:

- `/` — Welcome / learning dashboard.
- `/learn` — Learning path and module map.
- `/learn/docker` — Docker learning path.
- `/learn/kubernetes` — Kubernetes learning path.
- `/lesson/[slug]` — Lesson player and interactive activity.
- `/playground` — Simulated command-line playground.
- `/challenges` — Daily-style practice and challenge catalog.
- `/achievements` — XP, badges, milestones, and completion status.
- `/glossary` — Searchable Docker/Kubernetes glossary.
- `/settings` — Preferences, progress reset, and local-data explanation.

Do not create dead links. Every visible navigation item must lead to a working page or a clearly implemented interaction.

## 5. Main dashboard (`/`)

The dashboard should quickly answer: “What should I learn next?”

Include:
- Welcome header with learner title such as “Your DevOps journey starts here.”
- Current level, XP, progress to next level, and lessons completed.
- A prominent **Continue learning** card that opens the next incomplete lesson.
- Two learning-path cards: **Docker Foundations** and **Kubernetes Adventures**.
- A visual journey map or milestone track showing locked, available, and completed missions.
- “Quick practice” section with a small challenge that can be completed in under 3 minutes.
- Recent achievements and a compact activity/progress summary.
- Helpful empty state for a brand-new learner; never show misleading completed progress.

Use meaningful local sample content, but progress must begin at zero for a new user. The dashboard should derive its values from saved progress.

## 6. Gamification system

Implement a simple, transparent progression system.

### XP
- Complete a lesson: 50 XP.
- Pass a lesson quiz: 20 bonus XP.
- Complete a challenge: 30 XP.
- Perfect quiz score: 10 bonus XP.
- Prevent duplicate XP awards when a completed lesson or challenge is revisited.

### Levels
Use a simple level progression such as:
- Level 1: Curious Explorer
- Level 2: Container Cadet
- Level 3: Image Architect
- Level 4: Cluster Navigator
- Level 5: DevOps Pathfinder

Define XP thresholds in one typed configuration file so they can be changed easily.

### Achievements
Create unlockable badges, for example:
- First Steps — complete your first lesson.
- Image Builder — complete the Dockerfile module.
- Network Navigator — complete Docker networking.
- YAML Apprentice — pass a Kubernetes YAML challenge.
- Cluster Thinker — complete the Kubernetes fundamentals module.
- Perfect Run — get 100% on a quiz.
- Consistent Learner — complete lessons on 3 separate calendar days.

Since there is no backend, describe streaks as **local-device activity**, not a synced account-wide streak. Handle dates using the user's local date.

### Feedback
- Show small, polished XP gain feedback.
- Animate completion states subtly.
- Include a progress bar and next milestone.
- Avoid loud, distracting animations or blocking modals after every action.

## 7. Learning content and curriculum

Create structured lesson data in local TypeScript files. Do not hardcode the full curriculum into page components.

Each lesson should include:
- `id`, `slug`, `title`, `module`, `difficulty`, `estimatedMinutes`
- `objectives`
- `explanation` sections
- `keyTakeaways`
- `quizQuestions`
- `activity` or challenge configuration
- `prerequisites` where relevant

Write original, beginner-friendly content. Define technical terms before using them. Use examples and analogies, then introduce accurate terminology. Do not oversimplify in a way that creates false mental models.

### Track A: Docker Foundations

Build at least these modules and lessons:

**Module 1 — Containers from Zero**
1. Why “it works on my machine” happens.
2. What a container is.
3. Containers vs. virtual machines.
4. Images vs. containers.
5. Your first Docker workflow (simulated).

**Module 2 — Docker Commands**
6. `docker pull`, `docker images`, and image registries.
7. `docker run`, container names, and port mapping.
8. `docker ps`, `docker logs`, `docker exec`, and `docker stop`.
9. Container lifecycle and common mistakes.

**Module 3 — Build Your Own Image**
10. What a Dockerfile does.
11. `FROM`, `WORKDIR`, `COPY`, and `RUN`.
12. `CMD` vs. `ENTRYPOINT` at a beginner level.
13. Build context, `.dockerignore`, and image layers.
14. Build and inspect a sample web app image.

**Module 4 — Real-World Container Concepts**
15. Port mapping and container networking.
16. Persisting data with volumes and bind mounts.
17. Environment variables and configuration.
18. Multi-container development with Docker Compose.
19. Debugging common Docker errors.
20. Docker review mission.

### Track B: Kubernetes Adventures

**Module 5 — Why Kubernetes?**
21. Why running one container is not enough at scale.
22. What a cluster is: control plane and worker nodes.
23. Desired state and reconciliation.
24. Kubernetes YAML basics.

**Module 6 — Core Objects**
25. Pods: the smallest deployable unit.
26. Deployments and ReplicaSets.
27. Services: stable networking for workloads.
28. Namespaces and labels/selectors.
29. ConfigMaps and Secrets (explain that Kubernetes Secrets require appropriate access controls and are not automatically encrypted in every setup).

**Module 7 — Operate an Application**
30. Deploy a sample app with a Deployment manifest.
31. Expose it with a Service.
32. Scale replicas and understand self-healing.
33. Readiness and liveness probes.
34. Resource requests and limits.
35. Rolling updates and rollbacks.

**Module 8 — Troubleshooting and Review**
36. Why a Pod may be Pending.
37. CrashLoopBackOff: what it means and how to investigate.
38. ImagePullBackOff and image pull problems.
39. Read simulated `kubectl get`, `kubectl describe`, and `kubectl logs` output.
40. Final mission: deploy, inspect, scale, and troubleshoot a sample app.

The lessons may be split into smaller sub-lessons where that improves pacing. Keep the content accurate and coherent.

## 8. Lesson player experience

The lesson player is the core of the product.

Layout:
- Top row: breadcrumb, module/lesson title, estimated time, and progress.
- Main column: short lesson sections with diagrams or visual explanations.
- Side panel on desktop: lesson outline and completion state; on mobile this becomes a collapsible section.
- Bottom controls: Previous lesson, Check understanding, and Continue.
- Clearly distinguish reading content, interactive activity, and quiz.

Each lesson should follow a short loop:
1. **Learn:** one concept explained in plain language.
2. **Visualize:** a diagram, flow, or state change.
3. **Try:** an interactive task.
4. **Check:** a short quiz or knowledge check.
5. **Reflect:** key takeaways and next step.

Avoid walls of text. Use short sections, code examples, callouts, diagrams, and knowledge checks.

### Visual learning elements
Create reusable, custom React components for concepts such as:
- Image → Container lifecycle.
- Dockerfile → Image → Container pipeline.
- Port mapping from host to container.
- Volume persistence after a container is removed.
- Kubernetes control plane → worker node → Pod hierarchy.
- Deployment desired replicas vs. actual replicas.
- Service selecting Pods by labels.
- Rolling update progression.

Use SVG or CSS-based diagrams/components so they remain crisp and responsive. Diagrams should be labeled and should teach a concept, not merely decorate the page.

## 9. Interactive activities and simulated playground

The website must include genuine interactions, not just text and multiple-choice questions.

### A. Simulated terminal (`/playground`)
Build a terminal-like interface with:
- Monospace typography and readable command/output contrast.
- A command input with Enter-to-run support.
- Command history using arrow keys if practical.
- Clear/reset terminal button.
- A short list of suggested commands.
- A “What did this command do?” explanation after supported commands.
- A mode switch between Docker and Kubernetes commands.

Implement a **safe, deterministic command simulator**. Parse supported commands and return predefined simulated outputs. Never run shell commands on the host or pretend to connect to an actual Docker daemon/cluster.

Support useful beginner commands, such as:
- Docker: `docker images`, `docker ps`, `docker ps -a`, `docker pull nginx`, `docker run -d --name web -p 8080:80 nginx`, `docker logs web`, `docker stop web`, `docker start web`, `docker rm web`, `docker build -t demo-app .`
- Kubernetes: `kubectl get pods`, `kubectl get deployments`, `kubectl get services`, `kubectl describe pod <name>`, `kubectl logs <pod-name>`, `kubectl scale deployment web --replicas=3`, `kubectl get nodes`, `kubectl apply -f deployment.yaml`

Maintain an in-memory simulated environment during the session, so commands like `docker run` then `docker ps` reflect the simulated state. Add friendly errors for unsupported commands. Provide starter scenarios and a “Reset scenario” action. Kubernetes simulation should be deliberately small and deterministic; it does not need to implement all of Kubernetes.

### B. Quiz engine
- Support single-choice and multi-choice questions where appropriate.
- Show feedback after submission, explaining why the correct answer is right.
- Allow retrying without awarding duplicate XP.
- Track scores and completion locally.
- Provide keyboard-accessible controls.

### C. Drag/drop or ordering activities
Create at least three practical activities, using accessible buttons as an alternative to drag-and-drop:
- Arrange Docker build steps in the correct order.
- Match Docker concepts to their definitions.
- Arrange Kubernetes objects/steps to deploy a simple app.

### D. Troubleshooting scenarios
Provide scenarios with a symptom and several possible next steps. The learner should choose a sensible investigation step and receive an explanation.

## 10. Local data and architecture

Keep the project modular and maintainable.

Suggested structure (adapt to the existing repository when needed):

```text
app/
  page.tsx
  learn/page.tsx
  learn/docker/page.tsx
  learn/kubernetes/page.tsx
  lesson/[slug]/page.tsx
  playground/page.tsx
  challenges/page.tsx
  achievements/page.tsx
  glossary/page.tsx
  settings/page.tsx
components/
  layout/
  dashboard/
  learning/
  diagrams/
  playground/
  quiz/
  gamification/
  ui/
lib/
  curriculum/
    docker.ts
    kubernetes.ts
    types.ts
  simulator/
    docker-simulator.ts
    kubernetes-simulator.ts
    command-parser.ts
  progress/
    types.ts
    storage.ts
    calculations.ts
  achievements/
    definitions.ts
  utils.ts
```

### Local persistence requirements
- Use a versioned local-storage schema, e.g. `learning-app-progress-v1`.
- Keep storage access inside a dedicated utility/hook; do not scatter `localStorage` calls across components.
- Handle missing, malformed, or older saved data safely.
- Avoid hydration mismatch: initialize client-only progress safely and render a stable loading/skeleton state until it is loaded.
- Keep all curriculum content as static local data.
- Add a “Reset all progress” action with a confirmation step.
- The app must still work if localStorage is unavailable; use an in-memory fallback and show a small non-blocking notice if persistence cannot be saved.
- Never store secrets or personal information.

### TypeScript quality
- Define typed models for lessons, quizzes, challenges, progress, achievements, simulator state, and command results.
- Avoid `any` unless there is a documented reason.
- Keep components focused and reusable.
- Avoid giant page components and duplicate curriculum logic.
- Add error and empty states.
- Use server components by default and client components only where interactivity or browser APIs require them.

## 11. Glossary

Build a searchable glossary with short beginner-friendly definitions for at least:
Container, Image, Registry, Dockerfile, Build Context, Layer, Volume, Bind Mount, Port Mapping, Network, Docker Compose, Orchestration, Cluster, Node, Control Plane, Pod, Deployment, ReplicaSet, Service, Namespace, Label, Selector, ConfigMap, Secret, Probe, Resource Request, Resource Limit, Rollout, Rollback, Reconciliation, `kubectl`, and YAML.

Each term should link to a relevant lesson where possible.

## 12. Content accuracy rules

- Explain that a Docker image is a template and a container is a running (or stopped) instance created from an image.
- Explain that containers share the host kernel, unlike traditional full virtual machines.
- Explain that `EXPOSE` documents a port in an image; it does not itself publish the port to the host.
- Explain that `-p HOST:CONTAINER` publishes/maps a container port to a host port.
- Explain that a volume is not the same thing as a container's writable layer.
- Explain that Kubernetes Deployments manage ReplicaSets and desired Pod replicas.
- Explain that a Service gives a stable way to reach a changing set of Pods; clarify ClusterIP, NodePort, and LoadBalancer at an introductory level.
- Explain that Pods are not normally managed manually in production; controllers such as Deployments are preferred for typical stateless workloads.
- Explain that `CrashLoopBackOff` is a status/backoff behavior indicating repeated container crashes, not the root cause itself.
- Explain that Kubernetes Secret objects are not inherently safe just because their values are encoded in base64.
- Use accurate examples and clearly mark simulated command output as simulated.

## 13. Challenges and missions

Create a challenge catalog with filters for:
- Docker / Kubernetes.
- Beginner / Intermediate.
- Not started / In progress / Completed.

Include at least:
- “Find the running container.”
- “Publish the web server on port 8080.”
- “Build a simple image.”
- “Keep data after container removal.”
- “Find the Pods managed by a Deployment.”
- “Scale a Deployment to three replicas.”
- “Investigate a crashing Pod.”
- “Deploy and expose a sample web app.”

Every challenge should state the goal, provide optional hints, validate the learner's choices, explain the solution, and award XP once on first completion.

## 14. Settings and privacy

The settings page should clearly state:
- No account is required.
- Progress is stored locally in this browser.
- Progress does not sync across devices.
- Clearing browser data may remove progress.
- The app does not run real Docker or Kubernetes commands.

Include theme preference if implemented, reduced-motion support, and a confirmation flow for resetting progress.

## 15. SEO and polish

- Add useful page titles and descriptions.
- Set app metadata and favicon/app icon placeholders.
- Add a clean 404 page.
- Add loading, empty, and error states where appropriate.
- Use consistent button labels, spacing, and typography.
- Ensure no console errors, broken imports, dead navigation, or placeholder copy such as “Lorem ipsum.”
- Avoid fake testimonials, fake user counts, or fabricated claims.

## 16. Implementation plan

Work in this order:

### Phase 1 — Inspect and establish the foundation
1. Inspect the repository and existing package scripts before changing anything.
2. Preserve existing working configuration where possible.
3. Set up or verify Next.js, TypeScript, Tailwind, shadcn/ui, and Lucide.
4. Establish global design tokens, typography, responsive app shell, and navigation.
5. Build the dashboard using realistic static curriculum data.

### Phase 2 — Curriculum and lesson player
1. Create typed curriculum models and the Docker/Kubernetes lesson data.
2. Build the lesson route and reusable lesson sections.
3. Build visual diagrams and the quiz engine.
4. Add previous/next navigation and prerequisite/unlock rules.

### Phase 3 — Progression and persistence
1. Implement XP, levels, achievements, and completion rules.
2. Add versioned localStorage persistence and safe hydration.
3. Connect dashboard metrics to real local progress.
4. Add reset and storage fallback behavior.

### Phase 4 — Simulated playground and challenges
1. Build deterministic Docker and Kubernetes simulators.
2. Add command history, supported commands, simulated state, and useful error messages.
3. Implement interactive challenges, ordering activities, and troubleshooting scenarios.
4. Connect challenge completion to progress and XP.

### Phase 5 — Finish and verify
1. Complete glossary, settings, responsive/mobile states, and accessibility.
2. Run lint, type checking, and production build using available scripts.
3. Fix all errors introduced by the implementation.
4. Manually verify the critical user journey listed below.
5. Summarize the completed features and any known limitations.

Do not stop after generating a plan or static mockup. Implement the working website in the repository.

## 17. Acceptance criteria

The build is complete only when:
- [ ] The app runs locally using the documented command.
- [ ] A new learner can start without signing in.
- [ ] Dashboard and learning paths render correctly on desktop and mobile.
- [ ] At least 40 lessons are represented in the curriculum, with substantive content and activities.
- [ ] Lessons have functioning quizzes and next/previous navigation.
- [ ] Progress, XP, levels, and achievements update correctly.
- [ ] Reopening or refreshing the browser restores locally saved progress.
- [ ] Re-completing a lesson or challenge does not award XP twice.
- [ ] The simulator responds to supported commands and maintains simulated state.
- [ ] The UI clearly labels terminal output as simulated.
- [ ] Challenge filters and validation work.
- [ ] Glossary search works and glossary terms link to relevant lessons where possible.
- [ ] Progress reset requires confirmation and works.
- [ ] No backend, database, authentication, or external API is required.
- [ ] No major console errors, TypeScript errors, lint errors, or build errors remain.
- [ ] No important navigation item is broken.
- [ ] The app does not claim to execute real Docker or Kubernetes workloads.

## 18. Critical user journey to test

1. Open the dashboard as a new learner.
2. Start the first Docker lesson.
3. Read a section and complete the interactive activity.
4. Answer the quiz incorrectly and see a helpful explanation.
5. Retry and pass the quiz.
6. Complete the lesson and confirm XP/progress updates.
7. Refresh the page and confirm progress persists.
8. Open the playground and run `docker images`.
9. Run a simulated container command, then inspect it with `docker ps`.
10. Complete a challenge and confirm XP is awarded only once.
11. Open Kubernetes lessons and complete a basic Pod/Deployment activity.
12. Search for “Deployment” in the glossary.
13. Reset progress and confirm the dashboard returns to the new-learner state.

## 19. Final instructions to Claude Code

- First inspect the current repository. Do not overwrite working files blindly.
- Make reasonable product decisions without repeatedly asking for approval.
- Build a complete, coherent learning experience, not just a landing page.
- Prioritize correctness, pedagogy, responsiveness, accessibility, and UI polish over adding unnecessary dependencies.
- Use local typed data and simulated interactions to honor the no-backend requirement.
- Keep the project easy to extend with new lessons later.
- After implementation, report:
  1. What was built.
  2. Main routes and features.
  3. Commands to install/run/check the project.
  4. Any limitations or incomplete items.
