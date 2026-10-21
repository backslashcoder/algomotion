# AlgoMotion architecture

AlgoMotion separates **what an algorithm does** from **how it is played and drawn**.

```
 algorithms/*.js ──run(input, tracer)──▶ engine/trace-generator ──▶ trace (plain data)
                                                                      │
                  ┌───────────────────────────────────────────────────┤
                  ▼                                                   ▼
        stores/workspace-store                              engine/playback-controller
        (which algorithm, input, trace)                     (state machine + one timer)
                  │                                                   │
                  └──────────────▶ hooks/use-current-frame ◀──────────┘
                                          │  frame = { state, step }
        ┌────────────┬───────────────┬────┴──────────┬───────────────┐
        ▼            ▼               ▼               ▼               ▼
  visualizations  pseudocode      explanation     variables /     player
  (renderer)      panel           panel           metrics         controls
```

Algorithms never import React, Zustand or playback code. Renderers never run algorithm logic.

## Layers

| Layer | Location | Responsibility |
|---|---|---|
| Algorithm definitions | `algorithms/` | Metadata, input contract, and `run(input, tracer)` which emits steps. |
| Registry | `algorithms/registry.js` | Internal list of definitions; lookup by slug; categories & difficulties. |
| Trace engine | `engine/tracer.js`, `trace-generator.js`, `trace-validator.js`, `trace-schema.js` | Collect steps, enforce limits, validate the trace contract. |
| State reconstruction | `engine/state-reconstruction.js` | Derive the visual state at any step. |
| Playback | `engine/playback-controller.js` | Pure reducer + controller owning the single timer. |
| Stores | `stores/` | Zustand: workspace (algorithm/input/trace), playback (mirror of controller), preferences (persisted speed/loop). |
| Visualization adapters | `visualizations/` | `registry.js` maps `visualization.type` → renderer. |
| Input editors | `components/inputs/` | `registry.js` maps `inputEditor` → editor component. |
| UI | `components/`, `app/` | Workspace, player, panels, library, landing. |

## The trace contract (`engine/trace-schema.js`)

A trace is JSON-like data generated once per `(algorithm, input)`:

```
{ algorithmId, input, initialState, steps[], states[], result, metrics }
```

Each **step**:

| field | meaning |
|---|---|
| `id` | stable id (`s0`, `s1`, …), unique in the trace |
| `type` | event type, e.g. `compare`, `swap`, `visit`. `init` (automatic first step) and `complete`/`error` (last step) are reserved |
| `line` | pseudocode line id (must exist in `definition.pseudocode`) or `null` |
| `explanation` | plain English, built from real values |
| `patch` | **persistent** state change, shallow-merged into the state |
| `focus` | **transient** highlights for this step only (what is being compared, current node, pointers…) |
| `variables` | name → value, shown in the inspector |
| `metrics` | cumulative metric snapshot after the step |

`state` and `focus` vocabularies belong to the visualization type, not to the engine. The engine only
requires that patches are objects.

### State reconstruction and stepping backwards

`buildTimeline` pre-computes `states[i]` by applying each patch to the previous state with a shallow
merge, so consecutive states **share every untouched value** (structural sharing). Moving forwards,
backwards or seeking is an array lookup; algorithms never implement reverse execution. Tests verify
the timeline equals an independent from-scratch reconstruction at every index.

`tracer.emit` deep-clones `patch`/`focus`/`variables`, so an algorithm can keep mutating its working
arrays without corrupting history.

### Safeguards

* Input is validated by `definition.input.validate` before anything runs.
* `MAX_TRACE_STEPS` (5000) aborts runaway traces with a `TraceLimitError`.
* Each definition's input limits (e.g. 24 array elements) keep visualizations readable.
* `validateTrace` rejects malformed traces (missing explanation, unknown pseudocode line, no
  `complete` step…), so an algorithm bug surfaces as an error, not a corrupt UI.
* `tryGenerateTrace` turns every failure into `{ ok:false, error:{ kind, messages } }`; the workspace
  keeps the previous valid trace when new input is rejected.

## Playback (`engine/playback-controller.js`)

Statuses: `idle`, `error`, `ready`, `paused`, `playing`, `finished`.

* `playbackReducer(state, action)` is pure and fully unit-tested (LOAD, PLAY, PAUSE, TICK, SEEK,
  STEP_FORWARD/BACKWARD, RESET, SET_SPEED, SET_LOOP).
* `createPlaybackController()` owns **one** timer. All changes go through a single `dispatch`, which
  reconciles the clock with the new state: repeated `play()` never creates a second timer; changing
  speed reschedules; pausing/finishing/reset/reload clears it; `dispose()` ends it for good.
* Playing from `finished` restarts at step 0; seeking while playing keeps playing (unless it lands on
  the last step); stepping or resetting pauses.
* `stores/playback-store.js` mirrors controller state into Zustand. `hooks/use-local-playback.js`
  builds an independent controller for the landing-page preview via `useSyncExternalStore`.
* **Animation is separate from logic.** Renderers receive `transitionMs` (derived from speed, `0` with
  reduced motion) and animate toward the current frame; state is always the logical step.

## Visualization adapters

`visualizations/registry.js`:

```js
const RENDERERS = { array: ArrayRenderer, graph: GraphRenderer, "state-panel": StatePanelRenderer };
```

A renderer is `({ frame: { state, step, index }, config, transitionMs }) => JSX` and reads
`frame.state` plus `frame.step.focus` only. Unknown types fall back to the generic state panel.

* **Array** (`visualizations/array/`): `roles.js` is pure and tested (focus beats state; priorities
  are documented there). Bars mode (sorting, with optional merge-buffer row) and cells mode (search).
  Items have stable ids, so React moves them with CSS transforms.
* **Graph** (`visualizations/graph/`): preset positions, otherwise a synchronous `d3-force` layout
  from a fixed start (D3 is used only for layout). Shows node status, tree edges, the edge being
  examined, queue and traversal order.
* Not built yet (extension points): tree, table/matrix, call stack, heap, linked list, hash table,
  trie, geometry, string matching.

### Colour semantics (`app/globals.css`)

`--viz-default` neutral · `--viz-active` primary accent (focus, midpoint, current node) ·
`--viz-compare` information · `--viz-select` chosen/lifted key · `--viz-move` swap/shift/take ·
`--viz-done` finalised/found/visited · `--viz-error` · `--viz-dim` eliminated.
Colour is never the only cue: roles also use text tags (`compare`, `swap`, `key`, `✓`…), dashed vs
solid outlines, lifted elements, check badges, pointers and legends.
Dark is the primary theme; light values already exist on `:root` for a later theme toggle.

## Metrics vs complexity

`definition.metrics` declares counters (`tracer.count`) or gauges (`tracer.setMetric`). The UI shows
them as **observed on this input**, separately from the **theoretical complexity** table.
Metric semantics are documented per algorithm and covered by tests (e.g. Bubble Sort: a swap is two
writes; Merge Sort: writes are copies from the merge buffer back into the array).

## Accessibility

Semantic landmarks and a skip link; all controls are real buttons/inputs with accessible names;
keyboard shortcuts (Space, ←/→, Home/End) that ignore typing and widgets that own those keys;
`prefers-reduced-motion` support; a polite live region that announces the explanation only while
playback is **not** running; legends and text tags beside colour.

## Known limitations / decisions

* Traces are generated synchronously on the main thread (inputs are small by design). Web Workers or
  generator-based incremental traces are the next step if inputs grow.
* The scaffold's Cache Components / partial-prefetching flags were removed from `next.config.mjs`:
  the app is static + client-side, and unknown algorithm slugs now return a real HTTP 404.
* Binary search with duplicates returns the first matching midpoint it lands on, not the leftmost.
* Sorting inputs are limited to 1–24 integers in [−99, 999]; binary search to 1–30; BFS to 12 nodes.
