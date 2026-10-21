import {
  ARRAY_LIMITS,
  makeItems,
  range,
  validateIntegerArray,
} from "../shared/array-input";

const values = (items) => items.map((e) => e.value);

export const insertionSort = {
  id: "insertion-sort",
  slug: "insertion-sort",
  name: "Insertion Sort",
  category: "sorting",
  technique: "incremental",
  difficulty: "beginner",
  keywords: ["sort", "shift", "key", "stable", "in-place", "online"],
  shortDescription:
    "Grows a sorted prefix by picking the next element and sliding it left into place.",
  problem:
    "Given a list of numbers, build the sorted order one element at a time by inserting each new element into the already sorted part to its left.",
  whenToUse:
    "Excellent for small or nearly sorted inputs and for data that arrives one item at a time. Many library sorts use it for tiny sub-arrays.",
  complexity: {
    time: { best: "O(n)", average: "O(n²)", worst: "O(n²)" },
    space: "O(1)",
  },
  visualization: { type: "array", config: { mode: "bars", sortedLabel: "Sorted prefix" } },
  inputEditor: "number-array",
  pseudocode: [
    { id: "proc", text: "procedure insertionSort(A)", indent: 0 },
    { id: "for", text: "for i ← 1 to n − 1", indent: 1 },
    { id: "key", text: "key ← A[i]; j ← i − 1", indent: 2 },
    { id: "while", text: "while j ≥ 0 and A[j] > key", indent: 2 },
    { id: "shift", text: "A[j + 1] ← A[j]; j ← j − 1", indent: 3 },
    { id: "insert", text: "A[j + 1] ← key", indent: 2 },
    { id: "done", text: "return A", indent: 1 },
  ],
  metrics: [
    { key: "comparisons", label: "Comparisons", description: "Times an element of the sorted prefix was compared with the key." },
    { key: "shifts", label: "Shifts", description: "Times a larger element moved one place right to open a gap." },
    { key: "writes", label: "Writes", description: "Array assignments: one per shift plus one per key insertion." },
  ],
  input: {
    defaultValue: { array: [6, 3, 8, 2, 9, 1, 5] },
    limits: ARRAY_LIMITS,
    validate(raw) {
      const errors = validateIntegerArray(raw?.array);
      return errors.length
        ? { ok: false, errors }
        : { ok: true, value: { array: [...raw.array] } };
    },
  },
  describeInput: ({ array }) =>
    `Starting with [${array.join(", ")}]. The first element is a sorted prefix of length 1.`,
  createInitialState: ({ array }) => ({ items: makeItems(array), sorted: [0] }),

  run({ array }, tracer) {
    const a = makeItems(array);
    const n = a.length;

    for (let i = 1; i < n; i += 1) {
      const key = a[i];
      // The key is "lifted" out of the row. `hole` is the gap it will drop into.
      // Internally the key sits in the hole, so shifting a neighbour right is
      // an exchange of the key with that neighbour.
      let hole = i;
      tracer.emit({
        type: "pick-key",
        line: "key",
        explanation: `Pick ${key.value} (index ${i}) as the key. Everything to its left is sorted; the key must be inserted among it.`,
        focus: { key: hole },
        variables: { i, key: key.value, j: i - 1 },
      });

      let j = i - 1;
      while (j >= 0) {
        tracer.count("comparisons");
        const shiftNeeded = a[j].value > key.value;
        tracer.emit({
          type: "compare",
          line: "while",
          explanation: shiftNeeded
            ? `Compare ${a[j].value} with the key ${key.value}. ${a[j].value} > ${key.value}, so ${a[j].value} must move right.`
            : `Compare ${a[j].value} with the key ${key.value}. ${a[j].value} ≤ ${key.value}, so the key belongs right after it.`,
          focus: { comparing: [j], key: hole, pointers: { j } },
          variables: { i, key: key.value, j, "A[j]": a[j].value },
        });
        if (!shiftNeeded) break;

        [a[j], a[hole]] = [a[hole], a[j]];
        hole = j;
        tracer.count("shifts");
        tracer.count("writes");
        tracer.emit({
          type: "shift",
          line: "shift",
          explanation: `Shift ${a[hole + 1].value} one place right into the gap. The gap moves to index ${hole}.`,
          patch: { items: a },
          focus: { shifting: [hole + 1], key: hole, pointers: { j: j - 1 } },
          variables: { i, key: key.value, j: j - 1 },
        });
        j -= 1;
      }

      tracer.count("writes");
      tracer.emit({
        type: "insert",
        line: "insert",
        explanation:
          hole === i
            ? `${key.value} is already at least as large as everything on its left, so it stays at index ${hole}. The sorted prefix now covers indices 0–${i}.`
            : `Drop the key ${key.value} into the gap at index ${hole}. The sorted prefix now covers indices 0–${i}.`,
        patch: { sorted: range(0, i) },
        focus: { placed: hole },
        variables: { i, key: key.value, "insert at": hole },
      });
    }

    tracer.emit({
      type: "complete",
      line: "done",
      explanation: `Sorted: [${values(a).join(", ")}].`,
      patch: { items: a, sorted: range(0, n - 1) },
    });
    return values(a);
  },
};
