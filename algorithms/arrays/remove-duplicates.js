import {
  isSortedAscending,
  makeItems,
  randomArray,
  randomSortedArray,
  range,
  validateIntegerArray,
} from "../shared/array-input";

const LIMITS = { minLength: 1, maxLength: 16, minValue: -99, maxValue: 999 };

export const removeDuplicates = {
  id: "remove-duplicates",
  slug: "remove-duplicates",
  name: "Remove Duplicates (Sorted)",
  category: "arrays",
  technique: "two-pointers",
  difficulty: "beginner",
  keywords: ["two pointers", "in-place", "unique", "dedupe", "read write", "sorted"],
  shortDescription:
    "Compacts a sorted array in place so each value appears once, using a read pointer and a write pointer.",
  problem:
    "Given a sorted array, remove duplicate values in place so the first k positions hold the distinct values in order, and return k.",
  whenToUse:
    "Deduplicating sorted data without extra memory. The read/write (slow/fast) pointer pattern also solves filtering problems such as moving zeroes or removing a given value.",
  complexity: {
    time: { best: "O(n)", average: "O(n)", worst: "O(n)" },
    space: "O(1)",
  },
  visualization: {
    type: "array",
    config: {
      mode: "cells",
      sortedLabel: "Unique prefix",
      legend: ["compare", "placed", "sorted", "eliminated"],
      legendLabels: { eliminated: "Leftover (ignored)", placed: "Just written" },
    },
  },
  inputEditor: "number-array",
  pseudocode: [
    { id: "proc", text: "procedure removeDuplicates(A)", indent: 0 },
    { id: "init", text: "w ← 1", indent: 1 },
    { id: "for", text: "for r ← 1 to n − 1", indent: 1 },
    { id: "compare", text: "if A[r] ≠ A[w − 1]", indent: 2 },
    { id: "write", text: "A[w] ← A[r]; w ← w + 1", indent: 3 },
    { id: "done", text: "return w", indent: 1 },
  ],
  metrics: [
    { key: "comparisons", label: "Comparisons", description: "Times A[r] was compared with the last kept value A[w − 1]." },
    { key: "writes", label: "Writes", description: "Assignments A[w] ← A[r]. A write is counted even when w = r." },
  ],
  input: {
    defaultValue: { array: [1, 1, 2, 2, 2, 3, 4, 4, 5] },
    limits: LIMITS,
    note: "The array must be sorted in ascending order.",
    examples: [
      {
        label: "Many duplicates",
        build: () => ({ array: randomSortedArray(12, 1, 5) }),
      },
      {
        label: "All distinct",
        build: () => ({ array: randomSortedArray(10, 1, 60, { unique: true }) }),
      },
      { label: "All equal", build: () => ({ array: Array(8).fill(randomArray(1, 1, 9)[0]) }) },
    ],
    validate(raw) {
      const errors = validateIntegerArray(raw?.array, LIMITS);
      if (errors.length === 0 && !isSortedAscending(raw.array)) {
        errors.push("This algorithm needs the array sorted in ascending order (equal values next to each other).");
      }
      return errors.length
        ? { ok: false, errors }
        : { ok: true, value: { array: [...raw.array] } };
    },
  },
  describeInput: ({ array }) =>
    `Starting with the sorted array [${array.join(", ")}]. The first element is trivially unique, so the unique prefix has length 1.`,
  createInitialState: ({ array }) => ({
    items: makeItems(array),
    sorted: [0],
    eliminated: [],
  }),

  run({ array }, tracer) {
    const a = makeItems(array);
    const n = a.length;
    let w = 1;

    tracer.emit({
      type: "init-writer",
      line: "init",
      explanation: "Set the write pointer w to 1: the next unique value will be written there.",
      focus: { pointers: { w } },
      variables: { w, n },
    });

    for (let r = 1; r < n; r += 1) {
      tracer.count("comparisons");
      const isNew = a[r].value !== a[w - 1].value;
      tracer.emit({
        type: "compare",
        line: "compare",
        explanation: isNew
          ? `Compare A[${r}] = ${a[r].value} with the last kept value A[${w - 1}] = ${a[w - 1].value}. They differ, so ${a[r].value} is a new value to keep.`
          : `Compare A[${r}] = ${a[r].value} with the last kept value A[${w - 1}] = ${a[w - 1].value}. They are equal, so this is a duplicate: skip it.`,
        focus: { comparing: [r, w - 1], pointers: { r, w } },
        variables: { r, w, "A[r]": a[r].value, "A[w-1]": a[w - 1].value },
      });
      if (isNew) {
        const same = r === w;
        a[w] = { id: a[w].id, value: a[r].value };
        tracer.count("writes");
        w += 1;
        tracer.emit({
          type: "write",
          line: "write",
          explanation: same
            ? `Write ${a[w - 1].value} to index ${w - 1} (it is already there), then move w to ${w}. The unique prefix now has ${w} values.`
            : `Copy ${a[w - 1].value} from index ${r} to index ${w - 1}, then move w to ${w}. The unique prefix now has ${w} values.`,
          patch: { items: a, sorted: range(0, w - 1) },
          focus: { placed: w - 1, pointers: { r, w } },
          variables: { r, w },
        });
      }
    }

    tracer.emit({
      type: "complete",
      line: "done",
      explanation: `Done: ${w} unique value${w === 1 ? "" : "s"} — [${a.slice(0, w).map((e) => e.value).join(", ")}]. Anything after index ${w - 1} is leftover and ignored.`,
      patch: { items: a, sorted: range(0, w - 1), eliminated: w < n ? range(w, n - 1) : [] },
      variables: { w },
    });
    return { length: w, values: a.slice(0, w).map((e) => e.value) };
  },
};
