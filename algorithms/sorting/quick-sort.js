import {
  ARRAY_LIMITS,
  makeItems,
  range,
  validateIntegerArray,
} from "../shared/array-input";

const values = (items) => items.map((e) => e.value);

export const quickSort = {
  id: "quick-sort",
  slug: "quick-sort",
  name: "Quick Sort",
  category: "sorting",
  technique: "divide-and-conquer",
  difficulty: "intermediate",
  keywords: ["sort", "partition", "pivot", "divide and conquer", "recursion", "lomuto", "in-place"],
  shortDescription:
    "Picks a pivot, partitions the array into smaller and larger values around it, then sorts each side recursively.",
  problem:
    "Sort a list by repeatedly choosing a pivot and rearranging so everything smaller is on its left and everything larger on its right; the pivot is then in its final position.",
  whenToUse:
    "A fast general-purpose in-place sort in practice. This version uses the last element as the pivot (Lomuto partition), which is simple to follow but degrades to O(n²) on already sorted input.",
  complexity: {
    time: { best: "O(n log n)", average: "O(n log n)", worst: "O(n²)" },
    space: "O(log n)",
  },
  visualization: {
    type: "array",
    config: {
      mode: "bars",
      sortedLabel: "Final position",
      rangeLabel: "partition",
      legend: ["compare", "swap", "key", "sorted"],
      legendLabels: { key: "Pivot" },
    },
  },
  inputEditor: "number-array",
  pseudocode: [
    { id: "sort", text: "procedure quickSort(A, lo, hi)", indent: 0 },
    { id: "base", text: "if lo ≥ hi: return", indent: 1 },
    { id: "call", text: "p ← partition(A, lo, hi)", indent: 1 },
    { id: "left", text: "quickSort(A, lo, p − 1)", indent: 1 },
    { id: "right", text: "quickSort(A, p + 1, hi)", indent: 1 },
    { id: "part", text: "procedure partition(A, lo, hi)", indent: 0 },
    { id: "pivot", text: "pivot ← A[hi]; i ← lo", indent: 1 },
    { id: "for", text: "for j ← lo to hi − 1", indent: 1 },
    { id: "compare", text: "if A[j] < pivot", indent: 2 },
    { id: "swap", text: "swap(A[i], A[j]); i ← i + 1", indent: 3 },
    { id: "place", text: "swap(A[i], A[hi]); return i", indent: 1 },
  ],
  metrics: [
    { key: "comparisons", label: "Comparisons", description: "Times an element was compared with the pivot." },
    { key: "swaps", label: "Swaps", description: "Exchanges of two different positions (a swap of a position with itself is not counted)." },
    { key: "writes", label: "Writes", description: "Array assignments. Each swap writes two positions." },
    { key: "partitions", label: "Partitions", description: "Partition passes performed." },
  ],
  input: {
    defaultValue: { array: [7, 2, 9, 4, 3, 8, 1, 6] },
    limits: ARRAY_LIMITS,
    validate(raw) {
      const errors = validateIntegerArray(raw?.array);
      return errors.length
        ? { ok: false, errors }
        : { ok: true, value: { array: [...raw.array] } };
    },
  },
  describeInput: ({ array }) =>
    `Starting with [${array.join(", ")}]. Quick sort will partition around a pivot, then recurse on each side.`,
  createInitialState: ({ array }) => ({
    items: makeItems(array),
    sorted: [],
    range: null,
  }),

  run({ array }, tracer) {
    const a = makeItems(array);
    const sorted = new Set();
    const sortedList = () => [...sorted].sort((x, y) => x - y);
    const fmt = (lo, hi) => (lo === hi ? `[${lo}]` : `[${lo}..${hi}]`);

    function swap(i, j) {
      [a[i], a[j]] = [a[j], a[i]];
      tracer.count("swaps");
      tracer.count("writes", 2);
    }

    function partition(lo, hi, depth) {
      const pivot = a[hi].value;
      let i = lo;
      tracer.count("partitions");
      tracer.emit({
        type: "pick-pivot",
        line: "pivot",
        explanation: `Partition ${fmt(lo, hi)}: the last element, ${pivot}, is the pivot. Values smaller than ${pivot} will be collected from index ${lo} onward.`,
        patch: { range: [lo, hi] },
        focus: { key: hi, pointers: { i, j: lo } },
        variables: { lo, hi, pivot, i, depth },
      });

      for (let j = lo; j < hi; j += 1) {
        tracer.count("comparisons");
        const smaller = a[j].value < pivot;
        tracer.emit({
          type: "compare",
          line: "compare",
          explanation: smaller
            ? `Compare A[${j}] = ${a[j].value} with the pivot ${pivot}: ${a[j].value} < ${pivot}, so it belongs in the smaller region.`
            : `Compare A[${j}] = ${a[j].value} with the pivot ${pivot}: ${a[j].value} ≥ ${pivot}, so it stays in the larger region.`,
          focus: { comparing: [j], key: hi, pointers: { i, j } },
          variables: { lo, hi, pivot, i, j, "A[j]": a[j].value },
        });
        if (smaller) {
          if (i !== j) {
            const moved = a[j].value;
            const displaced = a[i].value;
            swap(i, j);
            tracer.emit({
              type: "swap",
              line: "swap",
              explanation: `Swap ${displaced} (index ${i}) with ${moved} (index ${j}) so ${moved} joins the smaller region. Move i to ${i + 1}.`,
              patch: { items: a },
              focus: { swapping: [i, j], key: hi, pointers: { i: i + 1, j } },
              variables: { lo, hi, pivot, i: i + 1, j },
            });
          } else {
            tracer.emit({
              type: "grow",
              line: "swap",
              explanation: `${a[j].value} is already at index ${i}, the next slot of the smaller region, so no swap is needed. Move i to ${i + 1}.`,
              focus: { key: hi, pointers: { i: i + 1, j } },
              variables: { lo, hi, pivot, i: i + 1, j },
            });
          }
          i += 1;
        }
      }

      if (i !== hi) swap(i, hi);
      sorted.add(i);
      tracer.emit({
        type: "place-pivot",
        line: "place",
        explanation:
          i === hi
            ? `Every other value was smaller, so the pivot ${pivot} is already at index ${i}. It is in its final position.`
            : `Swap the pivot ${pivot} into index ${i}: everything to its left is smaller, everything to its right is at least as large. It is in its final position.`,
        patch: { items: a, sorted: sortedList() },
        focus: { placed: i },
        variables: { lo, hi, pivot, p: i, depth },
      });
      return i;
    }

    function sort(lo, hi, depth) {
      if (lo > hi) return;
      if (lo === hi) {
        sorted.add(lo);
        tracer.emit({
          type: "base-case",
          line: "base",
          explanation: `Range ${fmt(lo, hi)} has one element (${a[lo].value}), so it is already in its final position.`,
          patch: { range: [lo, hi], sorted: sortedList() },
          focus: { placed: lo },
          variables: { lo, hi, depth },
        });
        return;
      }
      tracer.emit({
        type: "partition-call",
        line: "call",
        explanation: `Sort ${fmt(lo, hi)}: partition it around a pivot first.`,
        patch: { range: [lo, hi] },
        variables: { lo, hi, depth },
      });
      const p = partition(lo, hi, depth);
      if (p - 1 >= lo) {
        tracer.emit({
          type: "recurse-left",
          line: "left",
          explanation: `Recursively sort the smaller side ${fmt(lo, p - 1)}.`,
          patch: { range: [lo, p - 1] },
          variables: { lo, hi, p, depth },
        });
        sort(lo, p - 1, depth + 1);
      }
      if (p + 1 <= hi) {
        tracer.emit({
          type: "recurse-right",
          line: "right",
          explanation: `Now recursively sort the larger side ${fmt(p + 1, hi)}.`,
          patch: { range: [p + 1, hi] },
          variables: { lo, hi, p, depth },
        });
        sort(p + 1, hi, depth + 1);
      }
    }

    sort(0, a.length - 1, 0);

    tracer.emit({
      type: "complete",
      line: "sort",
      explanation: `Sorted: [${values(a).join(", ")}].`,
      patch: { items: a, range: null, sorted: range(0, a.length - 1) },
    });
    return values(a);
  },
};
