import { makeItems, randomArray, validateIntegerArray } from "../shared/array-input";

const LIMITS = { minLength: 1, maxLength: 16, minValue: 1, maxValue: 999 };

export const variableWindow = {
  id: "min-size-subarray-sum",
  slug: "min-size-subarray-sum",
  name: "Sliding Window: Smallest Subarray ≥ Target",
  category: "arrays",
  technique: "sliding-window",
  difficulty: "intermediate",
  keywords: ["sliding window", "variable window", "shrinking window", "minimum length subarray", "positive numbers", "two pointers"],
  shortDescription:
    "Grows a window until its sum reaches the target, then shrinks it from the left to find the shortest window that still qualifies.",
  problem:
    "Given an array of positive integers and a target, find the length of the shortest contiguous subarray whose sum is at least the target (0 if none exists).",
  whenToUse:
    "Shortest or longest window that satisfies a condition that only gets easier as the window grows (positive numbers, distinct characters, at most k of something). Each element enters and leaves the window at most once.",
  complexity: {
    time: { best: "O(n)", average: "O(n)", worst: "O(n)" },
    space: "O(1)",
  },
  visualization: {
    type: "array",
    config: {
      mode: "cells",
      legend: ["window", "best", "compare"],
      legendLabels: { window: "Current window", best: "Shortest qualifying window" },
    },
  },
  inputEditor: "array-param",
  pseudocode: [
    { id: "proc", text: "procedure minSubarrayLen(A, target)", indent: 0 },
    { id: "init", text: "l ← 0; sum ← 0; best ← ∞", indent: 1 },
    { id: "for", text: "for r ← 0 to n − 1", indent: 1 },
    { id: "expand", text: "sum ← sum + A[r]", indent: 2 },
    { id: "check", text: "while sum ≥ target", indent: 2 },
    { id: "record", text: "best ← min(best, r − l + 1)", indent: 3 },
    { id: "shrink", text: "sum ← sum − A[l]; l ← l + 1", indent: 3 },
    { id: "done", text: "return best (0 if still ∞)", indent: 1 },
  ],
  metrics: [
    { key: "expansions", label: "Expansions", description: "Times the right end r moved forward, adding a value." },
    { key: "shrinks", label: "Shrinks", description: "Times the left end l moved forward, removing a value." },
    { key: "bestLength", label: "Best length", description: "Length of the shortest qualifying window so far (0 means none yet)." },
  ],
  input: {
    defaultValue: { array: [2, 3, 1, 2, 4, 3, 5, 1], target: 7 },
    limits: LIMITS,
    param: { key: "target", label: "Target sum", help: "A whole number of at least 1." },
    examples: [
      { label: "Random", build: () => ({ array: randomArray(12, 1, 9), target: 15 }) },
      { label: "Target unreachable", build: () => ({ array: randomArray(8, 1, 5), target: 500 }) },
      { label: "Single value suffices", build: () => ({ array: [1, 2, 3, 20, 2, 1], target: 15 }) },
    ],
    validate(raw) {
      const errors = validateIntegerArray(raw?.array, LIMITS);
      if (!Number.isInteger(raw?.target) || raw.target < 1) {
        errors.push("Target must be a whole number of at least 1.");
      }
      return errors.length
        ? { ok: false, errors }
        : { ok: true, value: { array: [...raw.array], target: raw.target } };
    },
  },
  describeInput: ({ array, target }) =>
    `Find the shortest block of consecutive values in [${array.join(", ")}] whose sum is at least ${target}. All values are positive, so adding to a window can only increase its sum.`,
  createInitialState: ({ array }) => ({
    items: makeItems(array),
    window: null,
    best: null,
  }),

  run({ array, target }, tracer) {
    const n = array.length;
    let l = 0;
    let sum = 0;
    let bestLen = 0;
    let bestStart = -1;

    tracer.emit({
      type: "init",
      line: "init",
      explanation: `Start with an empty window (l = 0, sum = 0). The right end r will move forward one value at a time.`,
      variables: { l, sum, target, best: "none" },
    });

    const windowState = (from, to) =>
      from <= to ? { from, to, label: `sum = ${sum}` } : null;

    for (let r = 0; r < n; r += 1) {
      sum += array[r];
      tracer.count("expansions");
      const reached = sum >= target;
      tracer.emit({
        type: "expand",
        line: "expand",
        explanation: `Expand: add A[${r}] = ${array[r]}. The window ${l}–${r} now sums to ${sum}, which is ${reached ? `at least ${target}, so try to shrink it` : `below ${target}, so keep growing`}.`,
        patch: { window: windowState(l, r) },
        focus: { moving: [r], pointers: { l, r } },
        variables: { l, r, sum, target, best: bestLen || "none" },
      });

      while (sum >= target) {
        const length = r - l + 1;
        const improved = bestLen === 0 || length < bestLen;
        if (improved) {
          bestLen = length;
          bestStart = l;
          tracer.setMetric("bestLength", bestLen);
        }
        tracer.emit({
          type: "record",
          line: "record",
          explanation: improved
            ? `The window ${l}–${r} (length ${length}) reaches ${target}. It is the shortest so far, so remember it.`
            : `The window ${l}–${r} (length ${length}) reaches ${target}, but the best length is ${bestLen}, so it is not an improvement.`,
          patch: improved ? { best: [l, r] } : {},
          focus: { pointers: { l, r } },
          variables: { l, r, sum, length, best: bestLen },
        });

        const removed = array[l];
        sum -= removed;
        l += 1;
        tracer.count("shrinks");
        tracer.emit({
          type: "shrink",
          line: "shrink",
          explanation: `Shrink: remove A[${l - 1}] = ${removed} from the left. The sum drops to ${sum}${l > r ? " and the window is empty" : ""}${sum >= target ? ", which still reaches the target, so keep shrinking" : ""}.`,
          patch: { window: windowState(l, r) },
          focus: { pointers: l <= r ? { l, r } : { r } },
          variables: { l, r, sum, best: bestLen },
        });
      }
    }

    tracer.emit({
      type: "complete",
      line: "done",
      explanation:
        bestLen === 0
          ? `Done: no window reaches ${target} (the whole array sums to less), so the answer is 0.`
          : `Done: the shortest window is indices ${bestStart}–${bestStart + bestLen - 1} ([${array.slice(bestStart, bestStart + bestLen).join(", ")}]) with length ${bestLen}.`,
      patch: { window: null },
      variables: { best: bestLen },
    });
    return { length: bestLen, start: bestLen ? bestStart : -1 };
  },
};
