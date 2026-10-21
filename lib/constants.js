export const SITE = Object.freeze({
  name: "AlgoMotion",
  tagline: "See how algorithms think.",
  description:
    "An interactive laboratory for understanding algorithms: step through real executions, inspect every variable, and experiment with your own input.",
});

export const NAV_LINKS = Object.freeze([
  { href: "/algorithms", label: "Algorithms" },
  { href: "/about", label: "About" },
]);

/** Badge colours per difficulty (semantic, not decorative). */
export const DIFFICULTY_STYLES = Object.freeze({
  beginner: "border-viz-done/40 bg-viz-done/10 text-viz-done",
  intermediate: "border-viz-compare/40 bg-viz-compare/10 text-viz-compare",
  advanced: "border-viz-move/40 bg-viz-move/10 text-viz-move",
});

/** Algorithm families shown on the landing page; `planned` ones are not built yet. */
export const FAMILIES = Object.freeze([
  { id: "sorting", label: "Sorting", planned: false },
  { id: "searching", label: "Searching", planned: false },
  { id: "graphs", label: "Graph traversal", planned: false },
  { id: "arrays", label: "Array patterns", planned: false },
  { id: "trees", label: "Trees & heaps", planned: true },
  { id: "dp", label: "Dynamic programming", planned: true },
  { id: "recursion", label: "Recursion & backtracking", planned: true },
  { id: "greedy", label: "Greedy algorithms", planned: true },
  { id: "strings", label: "String matching", planned: true },
]);
