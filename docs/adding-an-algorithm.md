# How to add a new algorithm

Adding an algorithm never requires touching the playback engine, stores or workspace. You write one
definition module, register it, and (only if needed) add a renderer or input editor.

Worked example: **Selection Sort** (reuses the array renderer and the number-array editor).

## 1. Define metadata

Create `algorithms/sorting/selection-sort.js`:

```js
export const selectionSort = {
  id: "selection-sort",            // unique, stable
  slug: "selection-sort",          // URL: /algorithms/selection-sort
  name: "Selection Sort",
  category: "sorting",             // key of CATEGORIES in algorithms/registry.js
  difficulty: "beginner",          // beginner | intermediate | advanced
  keywords: ["sort", "minimum", "in-place"],   // used by explorer search
  shortDescription: "…",           // card + page subtitle
  problem: "…",                    // "The problem" panel
  whenToUse: "…",                  // "When to use it" panel
  complexity: { time: { best: "O(n²)", average: "O(n²)", worst: "O(n²)" }, space: "O(1)" },
  visualization: { type: "array", config: { mode: "bars", sortedLabel: "Sorted" } },
  inputEditor: "number-array",
  pseudocode: [ /* see step 4 */ ],
  metrics: [ /* see step 5 */ ],
  input: { /* see step 2 */ },
  describeInput, createInitialState, run,  // see steps 2–3
};
```

Required fields are checked by `tests/engine/trace.test.js` ("registry contract"), which runs over
every registered definition automatically.

## 2. Input contract, default example and initial state

```js
input: {
  defaultValue: { array: [6, 3, 8, 2, 9, 1, 5] },
  limits: ARRAY_LIMITS,                      // shown by editors, enforced by validate
  validate(raw) {                            // never throw; return { ok, value | errors }
    const errors = validateIntegerArray(raw?.array);
    return errors.length ? { ok: false, errors } : { ok: true, value: { array: [...raw.array] } };
  },
},
describeInput: ({ array }) => `Starting with [${array.join(", ")}].`,   // text of the automatic init step
createInitialState: ({ array }) => ({ items: makeItems(array), sorted: [] }),  // state before step 1
```

`validate` must say **exactly** what is allowed — empty input, size limits and ordering requirements
are part of the contract and should be tested (see `binary-search.js`: it requires sorted input).
Optional: `initialMetrics(input)` when a gauge should start non-zero (binary search's `remaining`).

Optional input fields that the shared editors understand:

* `input.examples: [{ label, build() }]` — example buttons; `build()` returns a raw input and is
  validated like user input (a test checks every example of every definition).
* `input.param: { key, label, help }` with `inputEditor: "array-param"` — an extra numeric parameter
  next to the array (`k`, `target`…). `input.requiresSorted: true` adds a "Sort array" button.
* `input.note` — a sentence appended to the number-array editor's help text.
* `technique` on the definition (a key of `TECHNIQUES` in `algorithms/registry.js`) powers the
  explorer's technique filter and card label.

The state shape must match what your visualization type expects (see
`visualizations/array/roles.js` and `visualizations/graph/graph-renderer.jsx`).

## 3. Implement the algorithm and generate the trace

`run(input, tracer)` is a normal implementation that **narrates** itself through the tracer. It must be
deterministic and must not touch React, Zustand or timers.

```js
run({ array }, tracer) {
  const a = makeItems(array);
  const sorted = new Set();
  for (let i = 0; i < a.length - 1; i += 1) {
    let min = i;
    for (let j = i + 1; j < a.length; j += 1) {
      tracer.count("comparisons");
      tracer.emit({
        type: "compare",
        line: "compare",                                     // pseudocode line id
        explanation: `Compare ${a[j].value} with the current minimum ${a[min].value}.`,
        focus: { comparing: [j, min], pointers: { i, j, min } },   // transient highlights
        variables: { i, j, min },
      });
      if (a[j].value < a[min].value) min = j;
    }
    if (min !== i) {
      [a[i], a[min]] = [a[min], a[i]];
      tracer.count("swaps");
      tracer.emit({ type: "swap", line: "swap", explanation: "…", patch: { items: a }, focus: { swapping: [i, min] } });
    }
    sorted.add(i);
    tracer.emit({ type: "mark-sorted", line: "mark", explanation: "…", patch: { sorted: [...sorted] } });
  }
  tracer.emit({ type: "complete", line: "done", explanation: `Sorted: […]`, patch: { items: a, sorted: range(0, a.length - 1) } });
  return a.map((e) => e.value);          // stored as trace.result (handy for tests)
}
```

Rules:

* Emit a final step of type `complete` (the engine rejects traces without it).
* `patch` = state that **persists** from this step on (merged shallowly into the state; replace the
  whole `items` array, don't try to patch inside it). `focus` = highlights for **this step only**.
* Every step needs a non-empty `explanation` built from actual values. Never write explanations that
  could contradict the state.
* Use stable ids for movable entities (`makeItems` gives `e0, e1…`) so renderers can animate them.
* The engine deep-clones `patch`/`focus`/`variables`, so keep mutating your own arrays freely.
* Stepping backwards is free: the engine reconstructs earlier states from the trace.
* Exceeding `MAX_TRACE_STEPS` (5000) throws `TraceLimitError`; choose input limits to stay far below it.

## 4. Associate events with pseudocode

```js
pseudocode: [
  { id: "proc", text: "procedure selectionSort(A)", indent: 0 },
  { id: "compare", text: "if A[j] < A[min]: min ← j", indent: 3 },
  …
],
```

Line `id`s are stable identifiers; a step's `line` must be one of them (validated at generation time).
The pseudocode panel highlights the line whose id equals the current step's `line`.
A future code panel can map the same ids to real source lines.

## 5. Explanations and metrics

```js
metrics: [
  { key: "comparisons", label: "Comparisons", description: "Times two elements were compared." },
],
```

* `tracer.count(key, n)` for counters, `tracer.setMetric(key, value)` for current-value gauges.
* The description must define the unit precisely (e.g. "a swap counts as two writes"); tests should
  pin those semantics. Do not compare counts between unrelated algorithms.
* Theoretical complexity goes in `complexity` and is displayed separately from observed metrics.

## 6. Choose or create a visualization adapter and input editor

* Reuse an existing one: set `visualization.type` to `"array"`, `"graph"` or `"state-panel"` and
  `inputEditor` to `"number-array"`, `"sorted-array-target"` or `"graph"`. `visualization.config` is
  passed to the renderer (array: `mode`, `sortedLabel`, `rangeLabel`, `auxRow`, `legend`).
* Create a new renderer: add `visualizations/<type>/<type>-renderer.jsx` with the contract
  `({ frame, config, transitionMs })`, then add one line to `RENDERERS` in
  `visualizations/registry.js`. It reads `frame.state` and `frame.step.focus` only.
* Create a new editor: add a component with props `{ definition, input, onApply(raw) → {ok, error?},
  onReset() }` and register it in `components/inputs/registry.js`. Parse text to a structured input and
  let `onApply` (which runs the definition's `validate`) report errors inline.

If a visualization does not exist yet, `type: "state-panel"` works immediately: it lists the state.

## 7. Write tests

Add `tests/algorithms/<name>.test.js`. At minimum:

* correct results on the default example, single element, duplicates, sorted, reversed (or the
  family's equivalent edge cases such as missing target / disconnected graph);
* property check against a reference (sorted + permutation of input; compare with a naive reference);
* metric semantics (exact counts for tiny inputs);
* input validation (empty, too large, wrong type, ordering requirement);
* determinism and `reconstructState(trace, i)` equals `trace.states[i]`.

The generic "registry contract" test already checks that every definition has the required fields,
a valid default input, unique pseudocode ids and a valid trace. See `tests/algorithms/sorting.test.js`
for `describe.each` suites you can extend by adding your definition to `SORTS`.

## 8. Register it and make it discoverable

In `algorithms/registry.js`:

```js
import { selectionSort } from "./sorting/selection-sort";
const DEFINITIONS = [bubbleSort, insertionSort, mergeSort, selectionSort, binarySearch, bfs];
```

That is all: the explorer card, search, filters, `/algorithms/selection-sort` (via
`generateStaticParams`), footer link, related-algorithms section and the shared workspace are generated
from the definition. For a brand-new category add it to `CATEGORIES` in the same file.

Finally run:

```bash
npm test
npm run lint
npm run build
```

and, if the algorithm introduces a new journey, add a Playwright case in `e2e/`.
