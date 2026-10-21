import { bubbleSort } from "./sorting/bubble-sort";
import { insertionSort } from "./sorting/insertion-sort";
import { mergeSort } from "./sorting/merge-sort";
import { binarySearch } from "./searching/binary-search";
import { bfs } from "./graphs/bfs";

/**
 * The internal algorithm registry. To add an algorithm: create its definition
 * module and append it to this list (see docs/adding-an-algorithm.md).
 */
const DEFINITIONS = [bubbleSort, insertionSort, mergeSort, binarySearch, bfs];

export const CATEGORIES = Object.freeze({
  sorting: { id: "sorting", label: "Sorting", blurb: "Arrange data into order." },
  searching: { id: "searching", label: "Searching", blurb: "Locate items efficiently." },
  graphs: { id: "graphs", label: "Graphs", blurb: "Traverse and explore networks." },
});

export const DIFFICULTIES = Object.freeze([
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
]);

const bySlug = new Map();
for (const def of DEFINITIONS) {
  if (bySlug.has(def.slug)) throw new Error(`Duplicate algorithm slug: ${def.slug}`);
  bySlug.set(def.slug, def);
}

export function listAlgorithms() {
  return DEFINITIONS;
}

export function getAlgorithm(slug) {
  return bySlug.get(slug) ?? null;
}

export function listSlugs() {
  return DEFINITIONS.map((d) => d.slug);
}

export function getRelatedAlgorithms(slug, limit = 3) {
  const current = bySlug.get(slug);
  if (!current) return [];
  return DEFINITIONS.filter(
    (d) => d.slug !== slug && d.category === current.category,
  ).slice(0, limit);
}
