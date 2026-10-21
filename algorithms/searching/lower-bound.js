import {
  isSortedAscending,
  makeItems,
  randomInt,
  randomSortedArray,
  range,
  validateIntegerArray,
} from "../shared/array-input";

const LIMITS = { minLength: 1, maxLength: 16, minValue: -99, maxValue: 999 };

export const lowerBound = {
  id: "lower-bound",
  slug: "lower-bound",
  name: "Lower Bound",
  category: "searching",
  technique: "binary-search",
  difficulty: "intermediate",
  keywords: ["binary search", "first occurrence", "leftmost", "insertion point", "bisect_left", "sorted", "duplicates"],
  shortDescription:
    "Binary search variant that finds the first position whose value is at least the target — the leftmost match or the insertion point.",
  problem:
    "Given a sorted array and a target, find the smallest index i such that A[i] ≥ target (or n if every value is smaller).",
  whenToUse:
    "Finding the first occurrence among duplicates, counting how many values are below a threshold, or deciding where to insert a value to keep an array sorted. It is the building block behind bisect_left and std::lower_bound.",
  complexity: {
    time: { best: "O(log n)", average: "O(log n)", worst: "O(log n)" },
    space: "O(1)",
  },
  visualization: {
    type: "array",
    config: {
      mode: "cells",
      rangeLabel: "candidates",
      legend: ["active", "eliminated", "sorted", "found"],
      legendLabels: { eliminated: "Less than target", sorted: "At least target (kept)", found: "Answer" },
    },
  },
  inputEditor: "array-param",
  pseudocode: [
    { id: "proc", text: "procedure lowerBound(A, target)", indent: 0 },
    { id: "init", text: "lo ← 0; hi ← n", indent: 1 },
    { id: "while", text: "while lo < hi", indent: 1 },
    { id: "mid", text: "mid ← ⌊(lo + hi) / 2⌋", indent: 2 },
    { id: "go-right", text: "if A[mid] < target: lo ← mid + 1", indent: 2 },
    { id: "go-left", text: "else: hi ← mid", indent: 2 },
    { id: "done", text: "return lo", indent: 1 },
  ],
  metrics: [
    { key: "midChecks", label: "Midpoint checks", description: "Times A[mid] was compared with the target." },
    { key: "remaining", label: "Candidates left", description: "Indices still between lo and hi (hi is exclusive)." },
  ],
  input: {
    defaultValue: { array: [2, 4, 4, 4, 7, 9, 9, 12], target: 4 },
    limits: LIMITS,
    param: { key: "target", label: "Target", help: "Any whole number; it does not need to be in the array." },
    requiresSorted: true,
    examples: [
      {
        label: "Duplicates of target",
        build() {
          const array = randomSortedArray(12, 1, 6);
          return { array, target: array[randomInt(0, array.length - 1)] };
        },
      },
      {
        label: "Target missing",
        build() {
          const array = randomSortedArray(10, 1, 40, { unique: true });
          return { array, target: array[0] + 1 === array[1] ? array[0] - 1 : array[0] + 1 };
        },
      },
      { label: "Target too large", build: () => ({ array: randomSortedArray(9, 1, 30), target: 100 }) },
    ],
    validate(raw) {
      const errors = validateIntegerArray(raw?.array, LIMITS);
      if (errors.length === 0 && !isSortedAscending(raw.array)) {
        errors.push("Lower bound needs the array sorted in ascending order. Use “Sort array” to fix it.");
      }
      if (!Number.isInteger(raw?.target)) errors.push("Target must be a whole number.");
      return errors.length
        ? { ok: false, errors }
        : { ok: true, value: { array: [...raw.array], target: raw.target } };
    },
  },
  describeInput: ({ array, target }) =>
    `Find the first index in a sorted array of ${array.length} values whose value is at least ${target}. The answer can be ${array.length} if every value is smaller.`,
  initialMetrics: ({ array }) => ({ remaining: array.length }),
  createInitialState: ({ array }) => ({
    items: makeItems(array),
    range: [0, array.length - 1],
    eliminated: [],
    sorted: [],
    found: null,
  }),

  run({ array, target }, tracer) {
    const n = array.length;
    let lo = 0;
    let hi = n;
    let checks = 0;
    const view = () => ({
      range: lo < hi ? [lo, hi - 1] : null,
      eliminated: range(0, lo - 1),
      sorted: range(hi, n - 1),
    });

    tracer.emit({
      type: "init-bounds",
      line: "init",
      explanation: `The answer lies somewhere in 0..${n}. Set lo = 0 and hi = ${n} (hi is exclusive: it may point past the last element).`,
      focus: { pointers: { lo } },
      variables: { lo, hi, target },
    });

    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      tracer.emit({
        type: "compute-mid",
        line: "mid",
        explanation: `mid = ⌊(${lo} + ${hi}) / 2⌋ = ${mid}.`,
        focus: { active: [mid], pointers: { lo, mid, hi } },
        variables: { lo, mid, hi, target },
      });
      tracer.count("midChecks");
      checks += 1;
      if (array[mid] < target) {
        lo = mid + 1;
        tracer.setMetric("remaining", hi - lo);
        tracer.emit({
          type: "move-lo",
          line: "go-right",
          explanation: `A[${mid}] = ${array[mid]} < ${target}, so this value and everything before it is too small. Move lo to ${lo}.`,
          patch: view(),
          focus: { comparing: [mid], pointers: { lo, hi } },
          variables: { lo, mid, hi, target, "A[mid]": array[mid] },
        });
      } else {
        hi = mid;
        tracer.setMetric("remaining", hi - lo);
        tracer.emit({
          type: "move-hi",
          line: "go-left",
          explanation: `A[${mid}] = ${array[mid]} ≥ ${target}, so index ${mid} could be the answer, but an earlier index might also qualify. Keep it and set hi = ${hi}.`,
          patch: view(),
          focus: { comparing: [mid], pointers: { lo, hi } },
          variables: { lo, mid, hi, target, "A[mid]": array[mid] },
        });
      }
    }

    const hit = lo < n;
    tracer.emit({
      type: "complete",
      line: "done",
      explanation: !hit
        ? `lo = hi = ${lo} = n: every value is smaller than ${target}, so ${target} would be inserted at the end (index ${n}). Found after ${checks} midpoint check${checks === 1 ? "" : "s"}.`
        : array[lo] === target
          ? `lo = hi = ${lo}: the first value that is at least ${target} is A[${lo}] = ${array[lo]}, the leftmost occurrence. Found after ${checks} midpoint check${checks === 1 ? "" : "s"}.`
          : `lo = hi = ${lo}: the first value that is at least ${target} is A[${lo}] = ${array[lo]}. ${target} is not in the array, but this is where it would be inserted. Found after ${checks} midpoint check${checks === 1 ? "" : "s"}.`,
      patch: { ...view(), found: hit ? lo : null },
      focus: hit ? { found: lo } : {},
      variables: { lo, hi, target },
    });
    return lo;
  },
};
