# DevOps Quest: Docker & Kubernetes

A gamified, hands-on course that takes beginners from zero to practical confidence with Docker and Kubernetes. There are 40 short lessons, quizzes, interactive activities, challenges, XP, levels, and achievements, plus a **simulated** terminal.

- No backend, database, account, or external API. Progress is saved in this browser's `localStorage` (`learning-app-progress-v1`).
- Nothing executes real Docker or Kubernetes commands. A deterministic simulator in `lib/simulator` interprets them.

## Commands

```bash
npm install          # install dependencies
npm run dev          # start the dev server at http://localhost:3000
npm run typecheck    # TypeScript (tsc --noEmit)
npm run lint         # ESLint
npm run build        # production build (+ postbuild service-worker generation)
npm run start        # serve the production build
```

## Routes

| Route | What it is |
|---|---|
| `/` | Dashboard: level, XP, continue learning, paths, mission track, quick practice, achievements |
| `/learn`, `/learn/docker`, `/learn/kubernetes` | Learning path and per-track module/lesson maps with locked/available/completed states |
| `/lesson/[slug]` | Lesson player: learn → visualize → try → check → reflect |
| `/playground` | Simulated Docker / kubectl terminal with scenarios, history, and explanations |
| `/challenges`, `/challenges/[id]` | Filterable challenge catalog and challenge runner (hints, validation, solutions) |
| `/achievements` | Level ladder, badges, and XP history |
| `/glossary` | Searchable glossary linked to lessons |
| `/settings` | Local-data explanation, motion preference, offline status, and progress reset |

## Project structure

```text
app/                    routes (server components by default)
components/
  layout/               app shell, sidebar, mobile nav, toaster
  dashboard/            dashboard sections and mission track
  learning/             lesson player, track maps, code blocks, callouts
  diagrams/             SVG/CSS concept diagrams (several interactive)
  activities/           ordering, matching, classify, scenario, terminal tasks
  quiz/                 quiz engine
  playground/           terminal view and hook
  challenges/           catalog and runner
  ui/                   shadcn-style primitives
lib/
  curriculum/           catalog.ts (structure) + content/*.ts (lesson data)
  simulator/            command parser, Docker + Kubernetes simulators, goal checks
  progress/             config (XP, levels), storage (localStorage only), store, calculations
  achievements/         badge definitions
  challenges/           challenge definitions
```

## Extending

- **Add a lesson:** add its metadata to a module in `lib/curriculum/catalog.ts` and its content (same slug) to a file in `lib/curriculum/content/`. Prerequisites and previous/next links are derived automatically.
- **Change XP or levels:** edit `lib/progress/config.ts`.
- **Add a simulated command:** extend `lib/simulator/docker-simulator.ts` or `kubernetes-simulator.ts`.

Design rules for the UI live in `docs/design-system.md`.
