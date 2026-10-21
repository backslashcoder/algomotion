import {
  ARRAY_LIMITS,
  isSortedAscending,
  makeItems,
  range,
  validateIntegerArray,
} from "../shared/array-input";

const SEARCH_LIMITS = { ...ARRAY_LIMITS, maxLength: 30 };

export const binarySearch = {
  id: "binary-search",
  slug: "binary-search",
  name: "Binary Search",
  category: "searching",
  difficulty: "beginner",
  keywords: ["search", "divide and conquer", "sorted", "logarithmic", "midpoint"],
  shortDescription:
    "Finds a target in a sorted array by repeatedly halving the range that could contain it.",
  problem:
    "Given an array sorted in ascending order and a target value, find the index of the target or report that it is absent.",
  whenToUse:
    "Whenever data is sorted (or monotonic) and random access is cheap. With duplicates it returns the first matching midpoint it lands on, not necessarily the leftmost match.",
  complexity: {
    time: { best: "O(1)", average: "O(log n)", worst: "O(log n)" },
    space: "O(1)",
  },
  visualization: { type: "array", config: { mode: "cells", rangeLabel: "candidates" } },
  inputEditor: "sorted-array-target",
  pseudocode: [
    { id: "proc", text: "procedure binarySearch(A, target)", indent: 0 },
    { id: "init", text: "lo ← 0; hi ← n − 1", indent: 1 },
    { id: "while", text: "while lo ≤ hi", indent: 1 },
    { id: "mid", text: "mid ← ⌊(lo + hi) / 2⌋", indent: 2 },
    { id: "found", text: "if A[mid] = target: return mid", indent: 2 },
    { id: "go-right", text: "else if A[mid] < target: lo ← mid + 1", indent: 2 },
    { id: "go-left", text: "else: hi ← mid − 1", indent: 2 },
    { id: "not-found", text: "return −1", indent: 1 },
  ],
  metrics: [
    { key: "midChecks", label: "Midpoint checks", description: "Times A[mid] was compared with the target." },
    { key: "remaining", label: "Candidates left", description: "Elements still inside the search interval right now." },
  ],
  input: {
    defaultValue: { array: [3, 8, 14, 21, 27, 33, 41, 56, 62, 78, 90], target: 41 },
    limits: SEARCH_LIMITS,
    validate(raw) {
      const errors = validateIntegerArray(raw?.array, SEARCH_LIMITS);
      if (errors.length === 0 && !isSortedAscending(raw.array)) {
        errors.push(
          "Binary search needs the array sorted in ascending order. Use “Sort array” to fix it.",
        );
      }
      if (!Number.isInteger(raw?.target)) {
        errors.push("Target must be a whole number.");
      }
      return errors.length
        ? { ok: false, errors }
        : { ok: true, value: { array: [...raw.array], target: raw.target } };
    },
  },
  describeInput: ({ array, target }) =>
    `Searching for ${target} in a sorted array of ${array.length} elements.`,
  initialMetrics: ({ array }) => ({ remaining: array.length }),
  createInitialState: ({ array }) => ({
    items: makeItems(array),
    range: [0, array.length - 1],
    eliminated: [],
    found: null,
  }),

  run({ array, target }, tracer) {
    const n = array.length;
    let lo = 0;
    let hi = n - 1;
    const eliminated = new Set();
    let checks = 0;
    const list = () => [...eliminated].sort((x, y) => x - y);

    tracer.emit({
      type: "init-bounds",
      line: "init",
      explanation: `The whole array is a candidate: lo = 0, hi = ${hi}.`,
      focus: { pointers: { lo, hi } },
      variables: { lo, hi, target },
    });

    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      tracer.emit({
        type: "compute-mid",
        line: "mid",
        explanation: `Look at the middle of indices ${lo}–${hi}: mid = ⌊(${lo} + ${hi}) / 2⌋ = ${mid}.`,
        focus: { active: [mid], pointers: { lo, mid, hi } },
        variables: { lo, mid, hi, target },
      });

      tracer.count("midChecks");
      checks += 1;
      const value = array[mid];
      if (value === target) {
        tracer.emit({
          type: "found",
          line: "found",
          explanation: `A[${mid}] = ${value} equals the target ${target}. Found at index ${mid}.`,
          patch: { found: mid },
          focus: { found: mid, pointers: { lo, mid, hi } },
          variables: { lo, mid, hi, target, "A[mid]": value },
        });
        tracer.emit({
          type: "complete",
          line: "found",
          explanation: `Search complete: ${target} is at index ${mid}, after ${checks} midpoint check${checks === 1 ? "" : "s"}.`,
          focus: { found: mid },
        });
        return mid;
      }

      if (value < target) {
        range(lo, mid).forEach((i) => eliminated.add(i));
        tracer.setMetric("remaining", Math.max(hi - mid, 0));
        tracer.emit({
          type: "eliminate-left",
          line: "go-right",
          explanation: `A[${mid}] = ${value} < ${target}, so the target can only be to the right. Discard indices ${lo}–${mid} and set lo = ${mid + 1}.`,
          patch: { eliminated: list(), range: mid + 1 <= hi ? [mid + 1, hi] : null },
          focus: { comparing: [mid], pointers: { lo, mid, hi } },
          variables: { lo, mid, hi, target, "A[mid]": value },
        });
        lo = mid + 1;
      } else {
        range(mid, hi).forEach((i) => eliminated.add(i));
        tracer.setMetric("remaining", Math.max(mid - lo, 0));
        tracer.emit({
          type: "eliminate-right",
          line: "go-left",
          explanation: `A[${mid}] = ${value} > ${target}, so the target can only be to the left. Discard indices ${mid}–${hi} and set hi = ${mid - 1}.`,
          patch: { eliminated: list(), range: lo <= mid - 1 ? [lo, mid - 1] : null },
          focus: { comparing: [mid], pointers: { lo, mid, hi } },
          variables: { lo, mid, hi, target, "A[mid]": value },
        });
        hi = mid - 1;
      }
    }

    tracer.emit({
      type: "not-found",
      line: "not-found",
      explanation: `lo (${lo}) is now greater than hi (${hi}), so no candidates remain. ${target} is not in the array.`,
      patch: { range: null },
      variables: { lo, hi, target },
    });
    tracer.emit({
      type: "complete",
      line: "not-found",
      explanation: `Search complete: ${target} is not present (returned −1).`,
    });
    return -1;
  },
};
