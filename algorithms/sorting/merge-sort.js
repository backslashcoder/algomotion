import {
  ARRAY_LIMITS,
  makeItems,
  range,
  validateIntegerArray,
} from "../shared/array-input";

const values = (items) => items.map((e) => e.value);

export const mergeSort = {
  id: "merge-sort",
  slug: "merge-sort",
  name: "Merge Sort",
  category: "sorting",
  difficulty: "intermediate",
  keywords: ["sort", "divide and conquer", "recursion", "merge", "stable"],
  shortDescription:
    "Splits the array in half, sorts each half recursively, then merges the two sorted halves.",
  problem:
    "Sort a list by recursively splitting it into single elements, then combining neighbouring sorted runs into larger sorted runs.",
  whenToUse:
    "When you need guaranteed O(n log n) time and a stable result, or when sorting linked lists and external data. It costs O(n) extra memory.",
  complexity: {
    time: { best: "O(n log n)", average: "O(n log n)", worst: "O(n log n)" },
    space: "O(n)",
  },
  visualization: { type: "array", config: { mode: "bars", sortedLabel: "Sorted run", auxRow: true, rangeLabel: "range", legend: ["compare", "swap", "sorted", "active"] } },
  inputEditor: "number-array",
  pseudocode: [
    { id: "sort", text: "procedure mergeSort(A, lo, hi)", indent: 0 },
    { id: "base", text: "if lo ≥ hi: return", indent: 1 },
    { id: "mid", text: "mid ← ⌊(lo + hi) / 2⌋", indent: 1 },
    { id: "left", text: "mergeSort(A, lo, mid)", indent: 1 },
    { id: "right", text: "mergeSort(A, mid + 1, hi)", indent: 1 },
    { id: "merge", text: "merge(A, lo, mid, hi)", indent: 1 },
    { id: "merge-init", text: "i ← lo; j ← mid + 1; out ← []", indent: 2 },
    { id: "merge-compare", text: "while i ≤ mid and j ≤ hi: compare A[i] and A[j]", indent: 2 },
    { id: "take-left", text: "A[i] ≤ A[j]: append A[i] to out; i ← i + 1", indent: 3 },
    { id: "take-right", text: "otherwise: append A[j] to out; j ← j + 1", indent: 3 },
    { id: "take-rest", text: "append whatever remains of either half", indent: 2 },
    { id: "copy", text: "copy out back into A[lo..hi]", indent: 2 },
  ],
  metrics: [
    { key: "comparisons", label: "Comparisons", description: "Times the front elements of the two halves were compared." },
    { key: "merges", label: "Merges", description: "Completed merge operations." },
    { key: "writes", label: "Writes", description: "Elements copied from the merge buffer back into the array." },
    { key: "splits", label: "Splits", description: "Times a range was divided into two halves." },
  ],
  input: {
    defaultValue: { array: [7, 3, 9, 1, 8, 2, 6, 4] },
    limits: ARRAY_LIMITS,
    validate(raw) {
      const errors = validateIntegerArray(raw?.array);
      return errors.length
        ? { ok: false, errors }
        : { ok: true, value: { array: [...raw.array] } };
    },
  },
  describeInput: ({ array }) =>
    `Starting with [${array.join(", ")}]. Merge sort will split this range until single elements remain, then merge them back together.`,
  createInitialState: ({ array }) => ({
    items: makeItems(array),
    sorted: [],
    range: null,
    aux: null,
    consumed: [],
  }),

  run({ array }, tracer) {
    const a = makeItems(array);
    const sorted = new Set();
    const fmt = (lo, hi) => (lo === hi ? `[${lo}]` : `[${lo}..${hi}]`);

    function merge(lo, mid, hi, depth) {
      let i = lo;
      let j = mid + 1;
      const out = [];
      const consumed = [];
      const vars = () => ({ lo, mid, hi, i, j, depth, "out size": out.length });

      tracer.emit({
        type: "merge-start",
        line: "merge-init",
        explanation: `Merge the sorted halves ${fmt(lo, mid)} and ${fmt(mid + 1, hi)}. Pointer i starts at ${i}, pointer j at ${j}.`,
        patch: { range: [lo, hi], aux: [], consumed: [] },
        focus: { divider: mid, pointers: { i, j } },
        variables: vars(),
      });

      const take = (index, side) => {
        out.push(a[index]);
        consumed.push(index);
        return side;
      };

      while (i <= mid && j <= hi) {
        tracer.count("comparisons");
        const takeLeft = a[i].value <= a[j].value;
        tracer.emit({
          type: "compare",
          line: "merge-compare",
          explanation: takeLeft
            ? `Compare ${a[i].value} (left, index ${i}) with ${a[j].value} (right, index ${j}). ${a[i].value} ≤ ${a[j].value}, so the left value goes next.`
            : `Compare ${a[i].value} (left, index ${i}) with ${a[j].value} (right, index ${j}). ${a[j].value} < ${a[i].value}, so the right value goes next.`,
          focus: { comparing: [i, j], divider: mid, pointers: { i, j } },
          variables: vars(),
        });
        const index = takeLeft ? i : j;
        take(index, takeLeft ? "left" : "right");
        if (takeLeft) i += 1;
        else j += 1;
        tracer.emit({
          type: takeLeft ? "take-left" : "take-right",
          line: takeLeft ? "take-left" : "take-right",
          explanation: `Move ${a[index].value} into the merge buffer (position ${out.length - 1}).`,
          patch: { aux: [...out], consumed: [...consumed] },
          focus: { moving: [index], divider: mid, pointers: { i, j } },
          variables: vars(),
        });
      }

      while (i <= mid || j <= hi) {
        const fromLeft = i <= mid;
        const index = fromLeft ? i : j;
        take(index, fromLeft ? "left" : "right");
        if (fromLeft) i += 1;
        else j += 1;
        tracer.emit({
          type: fromLeft ? "take-left" : "take-right",
          line: "take-rest",
          explanation: `The ${fromLeft ? "right" : "left"} half is used up, so the remaining ${a[index].value} from the ${fromLeft ? "left" : "right"} half is appended unchanged.`,
          patch: { aux: [...out], consumed: [...consumed] },
          focus: { moving: [index], divider: mid, pointers: { i, j } },
          variables: vars(),
        });
      }

      out.forEach((item, k) => {
        a[lo + k] = item;
      });
      tracer.count("merges");
      tracer.count("writes", out.length);
      range(lo, hi).forEach((k) => sorted.add(k));
      tracer.emit({
        type: "copy-back",
        line: "copy",
        explanation: `Copy the merged result back into indices ${lo}–${hi}: [${values(out).join(", ")}]. This range is now a sorted run.`,
        patch: {
          items: [...a],
          aux: null,
          consumed: [],
          sorted: [...sorted].sort((x, y) => x - y),
        },
        focus: { placed: range(lo, hi) },
        variables: { lo, mid, hi, depth },
      });
    }

    function sort(lo, hi, depth) {
      if (lo >= hi) {
        tracer.emit({
          type: "base-case",
          line: "base",
          explanation: `Range ${fmt(lo, hi)} holds a single element (${a[lo].value}); a single element is already sorted.`,
          patch: { range: [lo, hi] },
          focus: { active: [lo] },
          variables: { lo, hi, depth },
        });
        return;
      }
      const mid = Math.floor((lo + hi) / 2);
      tracer.count("splits");
      tracer.emit({
        type: "split",
        line: "mid",
        explanation: `Split ${fmt(lo, hi)} at mid = ${mid} into ${fmt(lo, mid)} and ${fmt(mid + 1, hi)}.`,
        patch: { range: [lo, hi] },
        focus: { divider: mid },
        variables: { lo, mid, hi, depth },
      });
      tracer.emit({
        type: "recurse-left",
        line: "left",
        explanation: `Recursively sort the left half ${fmt(lo, mid)}.`,
        patch: { range: [lo, mid] },
        variables: { lo, mid, hi, depth },
      });
      sort(lo, mid, depth + 1);
      tracer.emit({
        type: "recurse-right",
        line: "right",
        explanation: `Left half done. Now recursively sort the right half ${fmt(mid + 1, hi)}.`,
        patch: { range: [mid + 1, hi] },
        variables: { lo, mid, hi, depth },
      });
      sort(mid + 1, hi, depth + 1);
      tracer.emit({
        type: "merge-call",
        line: "merge",
        explanation: `Both halves of ${fmt(lo, hi)} are sorted. Merge them.`,
        patch: { range: [lo, hi] },
        focus: { divider: mid },
        variables: { lo, mid, hi, depth },
      });
      merge(lo, mid, hi, depth);
    }

    sort(0, a.length - 1, 0);

    tracer.emit({
      type: "complete",
      line: "merge",
      explanation: `Sorted: [${values(a).join(", ")}].`,
      patch: { items: [...a], range: null, sorted: range(0, a.length - 1) },
    });
    return values(a);
  },
};
