import { makeItems, randomArray, validateIntegerArray } from "../shared/array-input";

const LIMITS = { minLength: 1, maxLength: 16, minValue: -99, maxValue: 999 };

export const kadane = {
  id: "kadane",
  slug: "kadane",
  name: "Kadane's Maximum Subarray",
  category: "arrays",
  technique: "dynamic-scan",
  difficulty: "intermediate",
  keywords: ["maximum subarray", "kadane", "dynamic programming", "running sum", "contiguous", "negative numbers"],
  shortDescription:
    "Finds the contiguous subarray with the largest sum in one pass by deciding at each element whether to extend the running subarray or start fresh.",
  problem:
    "Given an array of integers (possibly negative), find the contiguous block with the largest sum.",
  whenToUse:
    "Maximum-profit and best-streak problems on a single sequence. It is a one-dimensional dynamic program: the best subarray ending at i depends only on the best one ending at i − 1.",
  complexity: {
    time: { best: "O(n)", average: "O(n)", worst: "O(n)" },
    space: "O(1)",
  },
  visualization: {
    type: "array",
    config: {
      mode: "cells",
      legend: ["window", "best", "compare"],
      legendLabels: { window: "Current subarray", best: "Best subarray so far" },
    },
  },
  inputEditor: "number-array",
  pseudocode: [
    { id: "proc", text: "procedure maxSubarray(A)", indent: 0 },
    { id: "init", text: "cur ← A[0]; best ← A[0]", indent: 1 },
    { id: "for", text: "for i ← 1 to n − 1", indent: 1 },
    { id: "step", text: "cur ← max(A[i], cur + A[i])", indent: 2 },
    { id: "best", text: "best ← max(best, cur)", indent: 2 },
    { id: "done", text: "return best", indent: 1 },
  ],
  metrics: [
    { key: "restarts", label: "Restarts", description: "Times the running subarray was abandoned because its sum was not positive." },
    { key: "bestUpdates", label: "Best updates", description: "Times a strictly larger best sum was found after the first element." },
  ],
  input: {
    defaultValue: { array: [-2, 1, -3, 4, -1, 2, 1, -5, 4] },
    limits: LIMITS,
    examples: [
      { label: "Mixed", build: () => ({ array: randomArray(12, -9, 9) }) },
      { label: "All negative", build: () => ({ array: randomArray(8, -20, -1) }) },
      { label: "All positive", build: () => ({ array: randomArray(8, 1, 9) }) },
    ],
    validate(raw) {
      const errors = validateIntegerArray(raw?.array, LIMITS);
      return errors.length
        ? { ok: false, errors }
        : { ok: true, value: { array: [...raw.array] } };
    },
  },
  describeInput: ({ array }) =>
    `Find the contiguous block of [${array.join(", ")}] with the largest sum. At each element we either extend the running subarray or restart at that element.`,
  createInitialState: ({ array }) => ({
    items: makeItems(array),
    window: null,
    best: null,
  }),

  run({ array }, tracer) {
    let cur = array[0];
    let start = 0;
    let best = array[0];
    let bestStart = 0;
    let bestEnd = 0;

    tracer.emit({
      type: "init",
      line: "init",
      explanation: `Start with the first element: the running subarray is [${array[0]}] and so is the best, with sum ${best}.`,
      patch: { window: { from: 0, to: 0, label: `current = ${cur}` }, best: [0, 0] },
      focus: { pointers: { i: 0 } },
      variables: { i: 0, cur, best },
    });

    for (let i = 1; i < array.length; i += 1) {
      const extend = cur > 0;
      const previous = cur;
      if (extend) {
        cur += array[i];
      } else {
        cur = array[i];
        start = i;
        tracer.count("restarts");
      }
      tracer.emit({
        type: extend ? "extend" : "restart",
        line: "step",
        explanation: extend
          ? `The running sum ${previous} is positive, so it helps: extend the subarray with A[${i}] = ${array[i]}. cur = ${previous} + ${array[i]} = ${cur}.`
          : `The running sum ${previous} is not positive, so carrying it forward can only hurt. Restart at A[${i}] = ${array[i]}: cur = ${cur}.`,
        patch: { window: { from: start, to: i, label: `current = ${cur}` } },
        focus: { moving: [i], pointers: { i } },
        variables: { i, "A[i]": array[i], cur, best, start },
      });

      if (cur > best) {
        best = cur;
        bestStart = start;
        bestEnd = i;
        tracer.count("bestUpdates");
        tracer.emit({
          type: "new-best",
          line: "best",
          explanation: `${cur} is larger than the previous best, so indices ${start}–${i} become the best subarray.`,
          patch: { best: [start, i] },
          focus: { pointers: { i } },
          variables: { i, cur, best, start },
        });
      } else {
        tracer.emit({
          type: "keep-best",
          line: "best",
          explanation: `${cur} does not beat the best sum ${best}, so the best subarray stays at indices ${bestStart}–${bestEnd}.`,
          focus: { pointers: { i } },
          variables: { i, cur, best, start },
        });
      }
    }

    tracer.emit({
      type: "complete",
      line: "done",
      explanation: `Done: the maximum subarray sum is ${best}, from indices ${bestStart}–${bestEnd} ([${array.slice(bestStart, bestEnd + 1).join(", ")}]).`,
      patch: { window: null, best: [bestStart, bestEnd] },
      variables: { best },
    });
    return { sum: best, start: bestStart, end: bestEnd };
  },
};
