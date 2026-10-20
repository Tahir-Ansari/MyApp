# Design System — Premium Green & Black

**Owner:** session `myapp-9c` (design). Every session building UI follows this file.
**To change it:** message `myapp-9c` with the proposed change. Don't fork the rules in a component.
**Tokens live in** `app/globals.css` (file owner: `myapp-a0`). **Primitives live in** `components/ui/*` (owner: `myapp-a0`).

Black is the foundation, green is the signature accent, restraint is the rule.
The test for any screen: if you squint, it should look almost entirely black and charcoal, with green on only 1–3 things: the primary action, the active/current item, and progress.

---

## 1. Color tokens

Use the Tailwind names, never hex values or Tailwind palette colors (`zinc-*`, `emerald-*`, `amber-*`, `indigo-*`, `green-*`, `foreground/70` …) in components.

| Role | Tailwind name | Value | Use for |
|---|---|---|---|
| Canvas | `bg-background` | `#080B08` | Page background |
| Sunken / chrome | `bg-background-2` | `#0D120E` | Sidebar, top/bottom bars, dialogs, drawers |
| Card | `bg-surface` | `#111813` | Cards, panels, lesson reading surface |
| Elevated | `bg-surface-2` | `#172019` | Inputs, hover fills, popovers, code blocks inside cards |
| Track / pressed | `bg-surface-3` | `#1D2820` | Progress tracks, skeletons, pressed states |
| Border | `border-border` | `#253329` | Default 1px borders (applied globally to `*`) |
| Strong border | `border-border-strong` | `#34463A` | Inputs, outline buttons, dividers that must be seen |
| Text | `text-foreground` | `#F0FDF4` | Headings, body copy |
| Secondary text | `text-muted` | `#A1ADA3` | Descriptions, labels, general terminal output |
| Muted text | `text-subtle` | `#6B776D` | Meta, timestamps, placeholders, locked items. **Never body copy** (≈4.2:1). |
| Primary green | `accent` | `#22C55E` | Primary buttons, progress fills, active icons |
| Bright green | `accent-strong` | `#4ADE80` | Hover of primary, active nav text, terminal prompt, eyebrows, key numbers |
| Deep green | `accent-deep` | `#15803D` | Pressed primary, start of XP gradient |
| Green wash | `bg-accent-soft` | 10% green | Active nav item, selected row/option, completed-mission tile |
| Green border | `border-accent-border` | 28% bright green | Hover border on interactive cards, selected option, "up next" |
| On-green text | `text-accent-foreground` | `#04160A` | Text/icons on solid `bg-accent` |
| Success | `success` / `success-soft` | `#4ADE80` | Correct answers, completed states, "Online" |
| Warning | `warning` / `warning-soft` | `#FBBF24` | Offline banner, terminal warnings, hints |
| Error | `danger` / `danger-soft` | `#F87171` | Wrong answers, terminal errors, destructive actions |
| Terminal | `bg-terminal` / `text-terminal-fg` | `#050705` / `#D4DDD6` | Terminal surface and default output |
| Focus | `ring` | `#4ADE80` | Focus outlines (global `:focus-visible` already set) |

**Green budget per view:** one solid-green element (the primary CTA) per screen region. Everything else green is text, a thin fill, a 2px indicator, or a 10% wash. Never use green for large backgrounds, body text, or decorative borders.

## 2. Typography

- **Sans:** Geist (`font-sans`, default). **Mono:** Geist Mono (`font-mono`) for terminal, code, commands, numbers in stats, lesson/module numbers and eyebrows.
- Scale (mobile → `sm:`):

| Element | Classes |
|---|---|
| Page title (h1) | `text-2xl sm:text-3xl font-semibold tracking-tight text-foreground` |
| Section title (h2) | `text-base sm:text-lg font-semibold tracking-tight` |
| Card title (h3) | `text-sm sm:text-base font-semibold` |
| Eyebrow | `font-mono text-xs uppercase tracking-[0.14em] text-accent-strong` |
| Body | `text-sm sm:text-base leading-7 text-foreground` (lesson prose: `text-[15px] sm:text-base leading-7`) |
| Secondary | `text-sm leading-6 text-muted` |
| Meta | `text-xs text-subtle` |
| Stat number | `font-mono text-xl sm:text-2xl font-semibold tabular-nums` |

- Reading width: prose `max-w-prose` (~65ch). Never let paragraphs run full-width on desktop.
- Weights: 400 body, 500 labels/buttons, 600 headings. Don't use 700+.

## 3. Space, radius, elevation

- Spacing scale: 4px base. Card padding `p-4 sm:p-5` (hero `p-5 sm:p-8`). Gap between cards `gap-3 sm:gap-4`. Between page sections `space-y-8 sm:space-y-10`.
- Radius: cards/panels/dialogs `rounded-xl`; buttons, inputs, list rows, code blocks `rounded-lg`; badges `rounded-md`; avatars/dots `rounded-full`. **No pill buttons.**
- Elevation is made with **surface steps and borders, not shadows.** `shadow-card` only for floating things (dialogs, toasts, popovers). `shadow-glow` only on the single "up next" mission or a level-up moment.
- No glassmorphism, no `backdrop-blur` except the sticky mobile top bar (`bg-background-2/90 backdrop-blur`). No nested cards: inside a card, use dividers (`divide-y divide-border`) or `bg-surface-2` rows.
- Background depth: `.bg-hero-glow` (subtle green radial) on **at most one** element per page, e.g. the dashboard hero. `.bg-grid` is optional on the hero and empty states only.

## 4. Components (use `components/ui/*`)

### Buttons (`Button`)
| Variant | Use | Look |
|---|---|---|
| `primary` | The one main action (Continue learning, Check answer, Run) | Solid emerald, dark text, semibold; hover bright green; pressed deep green |
| `secondary` | Supporting actions | `bg-surface-2` + border, hover green border |
| `ghost` | Tertiary actions, toolbar icons | Transparent, muted text |
| `outline` | Alternative secondary on busy surfaces | Transparent + strong border |
| `success` | "Completed" / confirm states | Green wash + green border |
| `danger` | Reset progress, clear history | Red wash + red text. Never a solid red slab. |

Sizes: `sm` (h-8) for toolbars, `md` (h-10) default, `lg` (h-11) only for the hero CTA. On mobile every tappable thing is ≥ 44px (`min-h-11`), so use `md`/`lg` or add `min-h-11`. Links styled as buttons: `<Button asChild><Link …/></Button>`. Disabled: `disabled` or `aria-disabled`.

### Cards (`Card`)
`<Card>` = surface + 1px border + `rounded-xl`. Clickable cards: `<Card interactive>` (hover → green border, nothing else; no lift, no shadow). One card = one idea; don't wrap a whole page in a card.

### Badges (`Badge`)
`neutral` (default meta), `accent` (Up next, New, selected), `success` (Completed), `warning` (Hint, Offline), `danger` (Failed), `outline` (Soon, difficulty). Always text in the badge, not just a dot.

### Progress (`ProgressBar`)
Thin: `md` = 6px, `sm` = 4px. `tone="accent"` for lesson/track progress, `tone="gradient"` (deep→bright green) **only for XP**. Always pass a descriptive `label`. Pair with a visible numeric value (`text-xs font-mono text-muted`, e.g. `120 / 300 XP`).

### Inputs and forms
`h-10 rounded-lg border border-border-strong bg-surface-2 px-3 text-sm text-foreground placeholder:text-subtle`, focus `focus-visible:border-accent-border` + global ring. Labels `text-sm font-medium`, help text `text-xs text-muted`, errors `text-xs text-danger` with an icon. Search fields get a lucide `Search` icon in `text-subtle`.

### Dialogs and drawers (`Dialog`)
`bg-background-2`, border, `shadow-card`, overlay `bg-black/70`. Mobile nav drawer = `side="left"` (safe-area padding built in). Must trap focus and close on Esc (Radix handles it).

### Icons
lucide-react only. `size-4` inline, `size-5` nav, `size-6` feature tiles. Active/selected → `text-accent-strong`; default → `text-subtle` or `text-muted`; status icons use the status color. Decorative icons get `aria-hidden`.

## 5. Navigation

**Desktop (lg+):** fixed sidebar `w-64 bg-background-2 border-r`.
- Header: logo mark (lucide `Container` in a `size-8 rounded-lg bg-accent-soft text-accent-strong border border-accent-border` square) + "DevOps Quest" `font-semibold` + `text-xs text-subtle` "Docker & Kubernetes".
- Item: `relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm`.
  - Inactive: `text-muted hover:bg-surface-2 hover:text-foreground`, icon `text-subtle`.
  - **Active:** `bg-accent-soft text-foreground font-medium`, icon `text-accent-strong`, plus a 2px indicator `before:absolute before:left-0 before:inset-y-2 before:w-0.5 before:rounded-full before:bg-accent-strong`. Set `aria-current="page"`.
  - Not yet built: non-link `<span aria-disabled>` in `text-subtle` with an `outline` Badge "Soon". **No dead links.**
- Group labels: `px-3 pt-4 pb-1 font-mono text-[11px] uppercase tracking-[0.14em] text-subtle` (Learn / Practice / You).
- Footer: `text-xs text-subtle` "Progress saved on this device" with lucide `HardDrive`.

**Mobile (< lg):** sticky top bar (`h-14 bg-background-2/90 backdrop-blur border-b pt-safe`: logo + menu button → drawer with the full nav) **and** a bottom nav (`h-16 bg-background-2 border-t pb-safe`, 4–5 items, icon + label `text-[11px]`, active `text-accent-strong` with a 2px top indicator). Content gets `pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0`. Toasts/banners sit above the bottom nav: `bottom-[calc(4.5rem+env(safe-area-inset-bottom))] lg:bottom-4`.

**Main area:** `mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-10 py-6 sm:py-10`, `id="main"` for the skip link.

## 6. Surface recipes

### Dashboard (the centerpiece)
1. **Hero:** `Card` + `.bg-hero-glow` (+ optional `.bg-grid` overlay at low opacity). Mono eyebrow → h1 → one muted line. Right/below: level block (`Level 2 · Container Cadet`, XP gradient bar, `x / y XP` mono). One `primary size="lg"` **Continue learning** button with "Up next: <lesson>" in `text-xs text-muted` beneath.
2. **Stats row:** 4 compact items in one bordered strip (`grid grid-cols-2 sm:grid-cols-4 divide-border`), not 4 big cards. Label `text-xs text-subtle`, value mono stat number.
3. **Learning paths:** 2 `Card interactive`. Icon tile, title, tagline, `modules · lessons · ~min` meta, `ProgressBar sm`.
4. **Mission track:** vertical on mobile, horizontal stepper on lg. Node states:
   - Completed: `bg-accent-soft border-accent-border`, `CheckCircle2 text-accent-strong`, label "Completed".
   - **Up next:** `border-accent-border shadow-glow`, `accent` Badge "Up next", title in `text-foreground`.
   - Available: `bg-surface border-border`, `Circle text-muted`.
   - Locked: `bg-background-2 border-border text-subtle`, `Lock` icon, label "Locked".
   Connectors: 1px `bg-border`, or `bg-accent/40` between completed nodes.
5. **Daily practice, achievements, stats:** compact cards; honest empty states (see §8).

### Lesson player
- Reading column `max-w-prose`, `bg-surface` card or directly on canvas; sticky slim progress bar at the top (`ProgressBar sm`, accent).
- **Objectives:** checklist rows with `CheckCircle2` (done, `text-accent-strong`) / `Circle` (`text-subtle`).
- **Callouts:** `rounded-lg border-l-2 bg-surface-2 p-4`. info → `border-l-accent` + `Info` icon; tip → `border-l-accent-strong` + `Lightbulb`; warning → `border-l-warning` + `AlertTriangle`; analogy → `border-l-border-strong` + `Sparkles` in `text-muted`. Title `text-sm font-semibold`, body `text-sm text-muted leading-6`.
- **Inline code:** wrap prose in `.prose-code` (green-tinted mono on `surface-2`). Key terms: `font-medium text-foreground`, not green.
- **Code blocks:** `rounded-lg border bg-terminal`, header bar `bg-background-2 border-b px-3 h-9` with filename/language in `font-mono text-xs text-subtle` and a ghost copy button. Code `font-mono text-[13px] leading-6 text-terminal-fg`. Simulated output blocks get an `outline` Badge "Simulated output".
- **Syntax colors (restrained):** keywords/instructions `text-accent-strong`, strings `text-foreground`, comments `text-subtle italic`, numbers/flags `text-warning/90`, YAML keys `text-muted`. Max 3 colors besides default.
- **Section done:** green check + `text-accent-strong` step label in the lesson progress list.
- **Continue / Complete lesson:** one `primary size="lg"` at the end, full-width on mobile.

### Quizzes (never color alone)
| State | Style | Required non-color cue |
|---|---|---|
| Default | `bg-surface-2 border border-border rounded-lg p-3 sm:p-4 text-sm`, hover `border-border-strong` | — |
| Selected | `border-accent-border bg-accent-soft` | filled radio/checkbox indicator |
| Correct | `border-success/50 bg-success-soft` | `CheckCircle2` + "Correct" text |
| Incorrect (chosen) | `border-danger/50 bg-danger-soft` | `XCircle` + "Incorrect" text |
| Correct but missed | `border-dashed border-success/50` | `CheckCircle2` + "Correct answer" |
| Explanation | `mt-3 rounded-lg bg-surface-2 border-l-2 border-l-accent p-3 text-sm text-muted` | heading "Why" |
Options are real `<button>`/`<input>` elements, keyboard operable, with `aria-pressed`/`checked`; results announced via `role="status"`.

### Simulated terminal
- Shell: `rounded-xl border bg-terminal overflow-hidden`.
- Toolbar: `h-10 bg-background-2 border-b px-3 flex items-center justify-between`. Left: three `size-2.5 rounded-full bg-surface-3` dots (no traffic-light colors) + `font-mono text-xs text-subtle` title, e.g. `docker — simulated`. Right: `outline` Badge **"Simulated"** (always visible), ghost icon buttons for History (`History`), Reset (`RotateCcw`), Clear (`Eraser`), each with `aria-label` + tooltip text.
- Body: `font-mono text-[13px] sm:text-sm leading-6 p-4 min-h-[16rem] max-h-[60vh] overflow-y-auto scrollbar-thin`, `role="log" aria-live="polite"`.
- Output tones (map `OutputTone` from `lib/simulator/types.ts`): `default` → `text-terminal-fg`; `muted` → `text-subtle`; `success` → `text-accent-strong`; `info` → `text-muted`; `warning` → `text-warning`; `error` → `text-danger`. Prefix errors with `error:` / warnings with `warning:` text so meaning isn't color-only.
- Prompt: `text-accent-strong` `$` (or `kubectl ›`) + input `bg-transparent text-foreground caret-accent-strong outline-none`, with a visible focus ring on the input row (`focus-within:ring-1 ring-accent-border`). Command echo lines: prompt green, command `text-foreground`.
- Separators between command blocks: `border-t border-border/60 my-2`.
- Suggested commands: chips `rounded-md border border-border bg-surface-2 px-2 h-8 font-mono text-xs text-muted hover:border-accent-border hover:text-foreground`.
- "What did this command do?" panel: `Card` beside (lg) / below (mobile) the terminal, `Info` icon, text-muted body.
- Copy always says *simulated*. Never "running on your cluster", "connected", or "executing".

### Gamification
- XP bar: `ProgressBar tone="gradient"`. XP gain toast: small `bg-surface-2 border-accent-border` toast, `+50 XP` in `font-mono text-accent-strong`, auto-dismiss ~2.5s, `role="status"`.
- Level up: an inline banner (no blocking modal) with `.animate-accent-pulse` once on the level badge. No confetti, particles, or loops.
- Achievement tile (collectible): `Card` `p-4`, icon in a `size-10 rounded-lg` tile.
  - Unlocked: tile `bg-accent-soft border border-accent-border text-accent-strong`, title `text-foreground`, `success` Badge "Unlocked" + local date `text-xs text-subtle`.
  - Locked: tile `bg-surface-2 text-subtle` + small `Lock` overlay, title `text-muted`, description shows how to earn it.
- Motion: ≤ 300ms, ease-out, opacity/transform only. With `motion`, gate on `useReducedMotion()`. CSS is already neutralized by `prefers-reduced-motion` and `html[data-motion="reduce"]`.

### PWA, offline, errors
- `theme_color` / `background_color` / `viewport.themeColor`: **`#080B08`**. Status bar: `black-translucent`, with `.pt-safe` on the top bar.
- Offline banner: `bg-surface-2 border border-warning/30 text-foreground`, `WifiOff` in `text-warning`, text "Offline. Saved lessons still work…". Online-again: `Wifi` in `text-success`. Never color-only.
- Offline page and 404/error: on-canvas (no hero glow), mono eyebrow (`Offline` in `text-warning`, `404` in `text-accent-strong`, `Error` in `text-danger`), h1, muted copy, `primary` + `secondary` actions, and saved pages in one `Card` with `divide-y` rows.
- Icons/splash: green-on-black mark that matches the sidebar logo.

## 7. Accessibility (non-negotiable)

- Contrast: body copy is `foreground` or `muted` only. `subtle` only for meta ≥ 12px that's non-essential. Green text on black: use `accent-strong` (≈ 11:1); `accent` text is fine at ≥ 14px.
- Status is never color-only: always pair with an icon **and** a word.
- Visible focus on everything (global ring). Don't remove outlines; use `focus-visible:` not `focus:`.
- Touch targets ≥ 44px on mobile. No horizontal scroll at 320px (`min-w-0` on flex children, `overflow-x-auto` only inside code/terminal).
- Respect reduced motion (see §6 Gamification).
- Semantic landmarks: one `<h1>` per page, `<nav aria-label>`, `<main id="main">`, skip link.

## 8. Voice and empty states

Short, direct, honest. Local-only: "saved on this device", never "synced" or "your account". New learners see zero, never sample progress. Empty-state pattern: `Card` with `.bg-grid`, `size-10` icon tile in `bg-surface-2 text-subtle`, one-line title, one muted line, at most one action, e.g. "Complete your first lesson to earn First Steps."

## 9. Don'ts

- No raw Tailwind palette colors or hex in components; no `dark:` variants (the app is dark-only).
- No gradients except `.bg-hero-glow` and the XP bar. No neon text glows. No glassmorphism.
- No more than one solid-green button per region. No green body text. No green-on-green.
- No pill-shaped or oversized buttons. No nested cards. No heavy drop shadows.
- No flashing, looping, or particle animations.
- No dead links. Unbuilt features show a "Soon" state.
