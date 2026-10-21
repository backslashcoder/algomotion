import {
  isSortedAscending,
  makeItems,
  randomInt,
  randomSortedArray,
  validateIntegerArray,
} from "../shared/array-input";

const LIMITS = { minLength: 2, maxLength: 16, minValue: -99, maxValue: 999 };

export const twoSumSorted = {
  id: "two-sum-sorted",
  slug: "two-sum-sorted",
  name: "Two Sum (Sorted)",
  category: "arrays",
  technique: "two-pointers",
  difficulty: "beginner",
  keywords: ["two pointers", "pair", "sum", "sorted", "opposite ends"],
  shortDescription:
    "Finds two numbers that add up to a target by moving pointers inward from both ends of a sorted array.",
  problem:
    "Given an array sorted in ascending order and a target, find two different positions whose values add up to the target, or report that none exist.",
  whenToUse:
    "Whenever the data is sorted and you need a pair with a given sum or difference. Because the array is sorted, every comparison lets you discard one element for good, giving a single O(n) pass instead of checking all pairs.",
  complexity: {
    time: { best: "O(1)", average: "O(n)", worst: "O(n)" },
    space: "O(1)",
  },
  visualization: {
    type: "array",
    config: {
      mode: "cells",
      rangeLabel: "still possible",
      legend: ["compare", "eliminated", "found"],
      legendLabels: { eliminated: "Discarded" },
    },
  },
  inputEditor: "array-param",
  pseudocode: [
    { id: "proc", text: "procedure twoSum(A, target)", indent: 0 },
    { id: "init", text: "l ← 0; r ← n − 1", indent: 1 },
    { id: "while", text: "while l < r", indent: 1 },
    { id: "sum", text: "sum ← A[l] + A[r]", indent: 2 },
    { id: "found", text: "if sum = target: return (l, r)", indent: 2 },
    { id: "move-left", text: "else if sum < target: l ← l + 1", indent: 2 },
    { id: "move-right", text: "else: r ← r − 1", indent: 2 },
    { id: "none", text: "return no pair", indent: 1 },
  ],
  metrics: [
    { key: "sumsChecked", label: "Sums checked", description: "Times A[l] + A[r] was computed and compared with the target." },
    { key: "pointerMoves", label: "Pointer moves", description: "Times l moved right or r moved left." },
  ],
  input: {
    defaultValue: { array: [1, 3, 4, 6, 8, 11, 15], target: 14 },
    limits: LIMITS,
    param: { key: "target", label: "Target sum", help: "Any whole number." },
    requiresSorted: true,
    examples: [
      {
        label: "Random (pair exists)",
        build() {
          const array = randomSortedArray(10, 1, 40);
          const i = randomInt(0, array.length - 2);
          const j = randomInt(i + 1, array.length - 1);
          return { array, target: array[i] + array[j] };
        },
      },
      {
        label: "Random (no pair)",
        build() {
          const array = randomSortedArray(10, 1, 40, { unique: true });
          return { array, target: 1000 };
        },
      },
    ],
    validate(raw) {
      const errors = validateIntegerArray(raw?.array, LIMITS);
      if (errors.length === 0 && !isSortedAscending(raw.array)) {
        errors.push("The array must be sorted in ascending order. Use “Sort array” to fix it.");
      }
      if (!Number.isInteger(raw?.target)) errors.push("Target must be a whole number.");
      return errors.length
        ? { ok: false, errors }
        : { ok: true, value: { array: [...raw.array], target: raw.target } };
    },
  },
  describeInput: ({ array, target }) =>
    `Looking for two values in a sorted array of ${array.length} numbers that add up to ${target}. Start with one pointer at each end.`,
  createInitialState: ({ array }) => ({
    items: makeItems(array),
    range: [0, array.length - 1],
    eliminated: [],
    found: null,
  }),

  run({ array, target }, tracer) {
    let l = 0;
    let r = array.length - 1;
    const eliminated = new Set();
    let checks = 0;
    const discarded = () => [...eliminated].sort((x, y) => x - y);

    tracer.emit({
      type: "init-pointers",
      line: "init",
      explanation: `Place l on the smallest value (index 0) and r on the largest (index ${r}).`,
      focus: { pointers: { l, r } },
      variables: { l, r, target },
    });

    while (l < r) {
      const sum = array[l] + array[r];
      tracer.count("sumsChecked");
      checks += 1;
      const relation = sum === target ? "=" : sum < target ? "<" : ">";
      tracer.emit({
        type: "check-sum",
        line: "sum",
        explanation: `A[${l}] + A[${r}] = ${array[l]} + ${array[r]} = ${sum}, which is ${relation} ${target}.`,
        focus: { comparing: [l, r], pointers: { l, r } },
        variables: { l, r, "A[l]": array[l], "A[r]": array[r], sum, target },
      });

      if (sum === target) {
        tracer.emit({
          type: "found",
          line: "found",
          explanation: `${array[l]} + ${array[r]} = ${target}. The pair is at indices ${l} and ${r}.`,
          patch: { found: [l, r], range: null },
          focus: { found: [l, r], pointers: { l, r } },
          variables: { l, r, sum, target },
        });
        tracer.emit({
          type: "complete",
          line: "found",
          explanation: `Done: (${array[l]}, ${array[r]}) at indices (${l}, ${r}) after ${checks} sum check${checks === 1 ? "" : "s"}.`,
          focus: { found: [l, r] },
        });
        return [l, r];
      }

      tracer.count("pointerMoves");
      if (sum < target) {
        eliminated.add(l);
        tracer.emit({
          type: "move-left",
          line: "move-left",
          explanation: `${sum} is too small. Even paired with the largest remaining value, ${array[l]} cannot reach ${target}, so discard it and move l to ${l + 1}.`,
          patch: { eliminated: discarded(), range: [l + 1, r] },
          focus: { pointers: { l: l + 1, r } },
          variables: { l: l + 1, r, sum, target },
        });
        l += 1;
      } else {
        eliminated.add(r);
        tracer.emit({
          type: "move-right",
          line: "move-right",
          explanation: `${sum} is too large. Even paired with the smallest remaining value, ${array[r]} overshoots ${target}, so discard it and move r to ${r - 1}.`,
          patch: { eliminated: discarded(), range: [l, r - 1] },
          focus: { pointers: { l, r: r - 1 } },
          variables: { l, r: r - 1, sum, target },
        });
        r -= 1;
      }
    }

    tracer.emit({
      type: "no-pair",
      line: "none",
      explanation: `The pointers met at index ${l}, so every element has been ruled out. No two values add up to ${target}.`,
      patch: { range: null },
      variables: { l, r, target },
    });
    tracer.emit({
      type: "complete",
      line: "none",
      explanation: `Done: no pair sums to ${target}.`,
    });
    return null;
  },
};
