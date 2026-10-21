import { makeItems, randomArray, range, validateIntegerArray } from "../shared/array-input";

const LIMITS = { minLength: 1, maxLength: 16, minValue: 0, maxValue: 2 };

const settled = (low, mid, high, n) => [
  ...range(0, mid - 1),
  ...range(high + 1, n - 1),
];

export const dutchNationalFlag = {
  id: "dutch-national-flag",
  slug: "dutch-national-flag",
  name: "Dutch National Flag",
  category: "arrays",
  technique: "two-pointers",
  difficulty: "intermediate",
  keywords: ["three way partition", "sort colors", "0 1 2", "two pointers", "in-place", "dijkstra"],
  shortDescription:
    "Sorts an array of 0s, 1s and 2s in a single pass with three pointers (three-way partitioning).",
  problem:
    "Given an array containing only 0, 1 and 2, sort it in place in one pass without counting and without a general-purpose sort.",
  whenToUse:
    "Three-way partitioning appears in Quick Sort with many equal keys, in sorting colours or categories, and anywhere you must group items into three buckets in O(n) time and O(1) space.",
  complexity: {
    time: { best: "O(n)", average: "O(n)", worst: "O(n)" },
    space: "O(1)",
  },
  visualization: {
    type: "array",
    config: {
      mode: "cells",
      rangeLabel: "unknown",
      sortedLabel: "Placed",
      legend: ["active", "swap", "sorted"],
      legendLabels: { sorted: "Placed in its zone" },
    },
  },
  inputEditor: "number-array",
  pseudocode: [
    { id: "proc", text: "procedure dutchFlag(A)", indent: 0 },
    { id: "init", text: "low ← 0; mid ← 0; high ← n − 1", indent: 1 },
    { id: "while", text: "while mid ≤ high", indent: 1 },
    { id: "zero", text: "if A[mid] = 0: swap(A[low], A[mid]); low++; mid++", indent: 2 },
    { id: "one", text: "else if A[mid] = 1: mid++", indent: 2 },
    { id: "two", text: "else: swap(A[mid], A[high]); high−−", indent: 2 },
    { id: "done", text: "return A", indent: 1 },
  ],
  metrics: [
    { key: "inspections", label: "Inspections", description: "Times the element at mid was examined." },
    { key: "swaps", label: "Swaps", description: "Exchanges of two positions (including a position with itself)." },
  ],
  input: {
    defaultValue: { array: [2, 0, 1, 2, 1, 0, 0, 2, 1] },
    limits: LIMITS,
    examples: [
      { label: "Random", build: () => ({ array: randomArray(12, 0, 2) }) },
      { label: "Reversed", build: () => ({ array: [2, 2, 2, 2, 1, 1, 1, 0, 0, 0] }) },
      { label: "Already sorted", build: () => ({ array: [0, 0, 0, 1, 1, 1, 2, 2, 2] }) },
    ],
    validate(raw) {
      const errors = validateIntegerArray(raw?.array, LIMITS);
      return errors.length
        ? { ok: false, errors: errors.map((e) => e.replace(/between 0 and 2/, "0, 1 or 2")) }
        : { ok: true, value: { array: [...raw.array] } };
    },
  },
  describeInput: ({ array }) =>
    `Starting with [${array.join(", ")}]. Zeros will be gathered at the front, twos at the back, and ones will end up in the middle.`,
  createInitialState: ({ array }) => ({
    items: makeItems(array),
    range: [0, array.length - 1],
    sorted: [],
  }),

  run({ array }, tracer) {
    const a = makeItems(array);
    const n = a.length;
    let low = 0;
    let mid = 0;
    let high = n - 1;
    const view = () => ({
      range: mid <= high ? [mid, high] : null,
      sorted: settled(low, mid, high, n),
    });
    const vars = (extra = {}) => ({ low, mid, high, ...extra });

    tracer.emit({
      type: "init-pointers",
      line: "init",
      explanation: `Zone boundaries: indices before low are 0s, indices from low up to mid are 1s, indices after high are 2s. Everything from mid to high is still unknown.`,
      focus: { pointers: { low, mid, high } },
      variables: vars(),
    });

    while (mid <= high) {
      const value = a[mid].value;
      tracer.count("inspections");
      tracer.emit({
        type: "inspect",
        line: "while",
        explanation: `Look at A[mid] = A[${mid}] = ${value}.`,
        focus: { active: [mid], pointers: { low, mid, high } },
        variables: vars({ "A[mid]": value }),
      });

      if (value === 0) {
        [a[low], a[mid]] = [a[mid], a[low]];
        tracer.count("swaps");
        const same = low === mid;
        const lowOld = low;
        low += 1;
        mid += 1;
        tracer.emit({
          type: "swap-low",
          line: "zero",
          explanation: same
            ? `It is a 0 and low = mid, so it is already in the 0 zone. Advance both low and mid.`
            : `It is a 0: swap it with A[${lowOld}] (a 1) to put it in the 0 zone, then advance low and mid.`,
          patch: { items: a, ...view() },
          focus: { swapping: same ? [] : [lowOld, mid - 1], pointers: { low, mid, high } },
          variables: vars(),
        });
      } else if (value === 1) {
        mid += 1;
        tracer.emit({
          type: "advance",
          line: "one",
          explanation: `It is a 1, which belongs in the middle zone. Just advance mid.`,
          patch: view(),
          focus: { pointers: { low, mid, high } },
          variables: vars(),
        });
      } else {
        [a[mid], a[high]] = [a[high], a[mid]];
        tracer.count("swaps");
        const same = mid === high;
        const highOld = high;
        high -= 1;
        tracer.emit({
          type: "swap-high",
          line: "two",
          explanation: same
            ? `It is a 2 and mid = high, so it is already at the end. Shrink high.`
            : `It is a 2: swap it with A[${highOld}] to send it to the 2 zone and shrink high. The value that arrived at mid has not been examined yet, so mid stays.`,
          patch: { items: a, ...view() },
          focus: { swapping: same ? [] : [mid, highOld], pointers: { low, mid, high } },
          variables: vars(),
        });
      }
    }

    tracer.emit({
      type: "complete",
      line: "done",
      explanation: `Sorted: [${a.map((e) => e.value).join(", ")}]. Every element was examined exactly once.`,
      patch: { items: a, range: null, sorted: range(0, n - 1) },
    });
    return a.map((e) => e.value);
  },
};
