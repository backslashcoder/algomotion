import {
  ARRAY_LIMITS,
  makeItems,
  range,
  validateIntegerArray,
} from "../shared/array-input";

const values = (items) => items.map((e) => e.value);

export const bubbleSort = {
  id: "bubble-sort",
  slug: "bubble-sort",
  name: "Bubble Sort",
  category: "sorting",
  difficulty: "beginner",
  keywords: ["sort", "swap", "adjacent", "stable", "in-place"],
  shortDescription:
    "Repeatedly swaps adjacent out-of-order elements so the largest values bubble to the end.",
  problem:
    "Given a list of numbers, rearrange them into ascending order using only comparisons and swaps of neighbouring elements.",
  whenToUse:
    "Mostly for teaching: it is simple and stable, and with the early-exit check it finishes in one pass on already sorted data. For real workloads prefer O(n log n) sorts.",
  complexity: {
    time: { best: "O(n)", average: "O(n²)", worst: "O(n²)" },
    space: "O(1)",
  },
  visualization: { type: "array", config: { mode: "bars", sortedLabel: "Sorted" } },
  inputEditor: "number-array",
  pseudocode: [
    { id: "proc", text: "procedure bubbleSort(A)", indent: 0 },
    { id: "outer", text: "for pass ← 0 to n − 2", indent: 1 },
    { id: "reset", text: "swapped ← false", indent: 2 },
    { id: "inner", text: "for j ← 0 to n − pass − 2", indent: 2 },
    { id: "compare", text: "if A[j] > A[j + 1]", indent: 3 },
    { id: "swap", text: "swap(A[j], A[j + 1]); swapped ← true", indent: 4 },
    { id: "pass-end", text: "A[n − pass − 1] is now in its final place", indent: 2 },
    { id: "early-exit", text: "if not swapped: break", indent: 2 },
    { id: "done", text: "return A", indent: 1 },
  ],
  metrics: [
    { key: "comparisons", label: "Comparisons", description: "Times two neighbouring elements were compared." },
    { key: "swaps", label: "Swaps", description: "Times two neighbouring elements were exchanged." },
    { key: "writes", label: "Writes", description: "Array assignments. Each swap writes two positions." },
    { key: "passes", label: "Passes", description: "Sweeps through the unsorted part of the array." },
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
    `Starting with [${array.join(", ")}]. Bubble sort will sweep through the array comparing neighbours.`,
  createInitialState: ({ array }) => ({ items: makeItems(array), sorted: [] }),

  run({ array }, tracer) {
    const a = makeItems(array);
    const n = a.length;
    const sorted = new Set();
    const state = () => ({ sorted: [...sorted].sort((x, y) => x - y) });

    for (let pass = 0; pass < n - 1; pass += 1) {
      let swapped = false;
      tracer.count("passes");
      tracer.emit({
        type: "pass-start",
        line: "outer",
        explanation: `Pass ${pass + 1}: sweep from index 0 to ${n - pass - 2}, pushing the largest remaining value to index ${n - pass - 1}.`,
        variables: { pass, n },
      });

      for (let j = 0; j < n - pass - 1; j += 1) {
        const left = a[j].value;
        const right = a[j + 1].value;
        tracer.count("comparisons");
        const outOfOrder = left > right;
        tracer.emit({
          type: "compare",
          line: "compare",
          explanation: outOfOrder
            ? `Compare ${left} and ${right}. Since ${left} > ${right}, they are out of order and will be swapped.`
            : `Compare ${left} and ${right}. Since ${left} ≤ ${right}, they are already in order, so nothing changes.`,
          focus: { comparing: [j, j + 1], pointers: { j } },
          variables: { pass, j, "A[j]": left, "A[j+1]": right, swapped },
        });
        if (outOfOrder) {
          [a[j], a[j + 1]] = [a[j + 1], a[j]];
          swapped = true;
          tracer.count("swaps");
          tracer.count("writes", 2);
          tracer.emit({
            type: "swap",
            line: "swap",
            explanation: `Swap ${left} and ${right}: ${left} moves one place to the right.`,
            patch: { items: a },
            focus: { swapping: [j, j + 1], pointers: { j } },
            variables: { pass, j, "A[j]": a[j].value, "A[j+1]": a[j + 1].value, swapped },
          });
        }
      }

      sorted.add(n - pass - 1);
      tracer.emit({
        type: "mark-sorted",
        line: "pass-end",
        explanation: `End of pass ${pass + 1}: ${a[n - pass - 1].value} has reached index ${n - pass - 1}, its final position.`,
        patch: state(),
        variables: { pass, swapped },
      });

      if (!swapped) {
        range(0, n - pass - 2).forEach((i) => sorted.add(i));
        tracer.emit({
          type: "early-exit",
          line: "early-exit",
          explanation: `No swaps happened during pass ${pass + 1}, so the array is already sorted and the algorithm can stop early.`,
          patch: state(),
          variables: { pass, swapped },
        });
        break;
      }
    }

    range(0, n - 1).forEach((i) => sorted.add(i));
    tracer.emit({
      type: "complete",
      line: "done",
      explanation: `Sorted: [${values(a).join(", ")}].`,
      patch: { items: a, ...state() },
    });
    return values(a);
  },
};
