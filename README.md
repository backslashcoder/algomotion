# AlgoMotion

An interactive algorithm learning and visualization platform. Algorithms run for real in the browser,
produce deterministic execution traces, and a shared engine lets you play, pause, step forwards **and
backwards**, scrub, change speed, follow pseudocode, read plain-English explanations, inspect
variables and compare observed metrics with theoretical complexity.

**Algorithms (13):**
- Sorting: Bubble, Insertion, Merge, Quick
- Searching: Binary Search, Lower Bound
- Array patterns: Two Sum (sorted), Remove Duplicates, Dutch National Flag, Sliding Window (fixed and variable), Kadane's Maximum Subarray
- Graphs: Breadth-First Search

The explorer filters by category, difficulty and **technique** (two pointers, sliding window, …).

**Stack:** Next.js (App Router) · React · JavaScript (JSX) · Tailwind CSS v4 · shadcn/ui (Base UI) ·
Zustand · SVG (+ d3 for graph layout) · Lucide · Vitest + React Testing Library · Playwright.

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000
```

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit + component tests |
| `npm run test:e2e` | Playwright journeys (builds and serves the app on port 3100; first run: `npx playwright install chromium`) |

## Routes

`/` landing with a live preview · `/algorithms` searchable library · `/algorithms/[slug]` workspace ·
`/about`.

## Keyboard shortcuts (workspace)

`Space` play/pause · `←` `→` step · `Home` `End` first/last step. Ignored while typing.

## Documentation

* [Architecture](docs/architecture.md): trace contract, playback state machine, adapters, design tokens.
* [How to add a new algorithm](docs/adding-an-algorithm.md).

## Project layout

```
app/            routes (/, /algorithms, /algorithms/[slug], /about)
algorithms/     definitions + registry (no React, no stores)
engine/         tracer, trace generator/validator, state reconstruction, playback controller
stores/         zustand: workspace, playback, preferences
visualizations/ renderer registry + array, graph, state-panel renderers
components/     workspace, player, panels, inputs, library, layout, ui (shadcn)
hooks/          current frame, shortcuts, reduced motion, local playback
tests/ e2e/     Vitest suites / Playwright journeys
docs/           architecture + contributor guide
```
