import {
  makeItems,
  randomArray,
  randomInt,
  validateIntegerArray,
} from "../shared/array-input";

const LIMITS = { minLength: 1, maxLength: 16, minValue: -99, maxValue: 999 };

export const fixedWindow = {
  id: "sliding-window-max-sum",
  slug: "sliding-window-max-sum",
  name: "Sliding Window: Max Sum of Size k",
  category: "arrays",
  technique: "sliding-window",
  difficulty: "beginner",
  keywords: ["sliding window", "fixed window", "subarray", "maximum sum", "window size k", "rolling sum"],
  shortDescription:
    "Slides a window of fixed size k across the array, updating the sum in O(1) per step instead of re-adding k numbers.",
  problem:
    "Given an array and a window size k, find the contiguous block of k elements with the largest sum.",
  whenToUse:
    "Any question about every contiguous block of a fixed length: moving averages, best k-day streak, maximum of a rolling total. The trick is to add the element entering the window and subtract the one leaving it.",
  complexity: {
    time: { best: "O(n)", average: "O(n)", worst: "O(n)" },
    space: "O(1)",
  },
  visualization: {
    type: "array",
    config: {
      mode: "cells",
      legend: ["window", "best", "compare"],
      legendLabels: { window: "Current window", best: "Best window so far" },
    },
  },
  inputEditor: "array-param",
  pseudocode: [
    { id: "proc", text: "procedure maxWindowSum(A, k)", indent: 0 },
    { id: "init", text: "sum ← A[0] + … + A[k − 1]; best ← sum", indent: 1 },
    { id: "for", text: "for r ← k to n − 1", indent: 1 },
    { id: "slide", text: "sum ← sum + A[r] − A[r − k]", indent: 2 },
    { id: "compare", text: "if sum > best: best ← sum", indent: 2 },
    { id: "done", text: "return best", indent: 1 },
  ],
  metrics: [
    { key: "slides", label: "Slides", description: "Times the window moved one position to the right." },
    { key: "comparisons", label: "Comparisons", description: "Times a window sum was compared with the best sum." },
    { key: "bestSum", label: "Best sum", description: "Largest window sum found so far." },
  ],
  input: {
    defaultValue: { array: [2, 1, 5, 1, 3, 2, 8, 1, 4], k: 3 },
    limits: LIMITS,
    param: { key: "k", label: "Window size k", help: "A whole number from 1 up to the array length." },
    examples: [
      {
        label: "Random",
        build() {
          const array = randomArray(12, -9, 20);
          return { array, k: randomInt(2, 5) };
        },
      },
      { label: "All negative", build: () => ({ array: randomArray(10, -30, -1), k: 3 }) },
      { label: "Window = whole array", build: () => ({ array: randomArray(6, 1, 20), k: 6 }) },
    ],
    validate(raw) {
      const errors = validateIntegerArray(raw?.array, LIMITS);
      if (!Number.isInteger(raw?.k)) {
        errors.push("Window size k must be a whole number.");
      } else if (errors.length === 0 && (raw.k < 1 || raw.k > raw.array.length)) {
        errors.push(`Window size k must be between 1 and the array length (${raw.array.length}).`);
      }
      return errors.length
        ? { ok: false, errors }
        : { ok: true, value: { array: [...raw.array], k: raw.k } };
    },
  },
  describeInput: ({ array, k }) =>
    `Find the largest sum of ${k} consecutive values in [${array.join(", ")}].`,
  createInitialState: ({ array }) => ({
    items: makeItems(array),
    window: null,
    best: null,
  }),

  run({ array, k }, tracer) {
    const n = array.length;
    let sum = 0;
    for (let i = 0; i < k; i += 1) sum += array[i];
    let best = sum;
    let bestStart = 0;
    tracer.setMetric("bestSum", best);

    tracer.emit({
      type: "init-window",
      line: "init",
      explanation: `Add the first ${k} value${k === 1 ? "" : "s"} (${array.slice(0, k).join(" + ")}) to get the first window sum, ${sum}. It is the best so far.`,
      patch: { window: { from: 0, to: k - 1, label: `sum = ${sum}` }, best: [0, k - 1] },
      focus: { pointers: { l: 0, r: k - 1 } },
      variables: { l: 0, r: k - 1, sum, best },
    });

    for (let r = k; r < n; r += 1) {
      const l = r - k + 1;
      const added = array[r];
      const removed = array[r - k];
      sum += added - removed;
      tracer.count("slides");
      tracer.emit({
        type: "slide",
        line: "slide",
        explanation: `Slide right: add A[${r}] = ${added}, remove A[${r - k}] = ${removed}. New sum = ${sum - added + removed} + ${added} − ${removed} = ${sum}.`,
        patch: { window: { from: l, to: r, label: `sum = ${sum}` } },
        focus: { moving: [r], pointers: { l, r } },
        variables: { l, r, added, removed, sum, best },
      });

      tracer.count("comparisons");
      if (sum > best) {
        best = sum;
        bestStart = l;
        tracer.setMetric("bestSum", best);
        tracer.emit({
          type: "new-best",
          line: "compare",
          explanation: `${sum} is larger than the previous best, so this window becomes the best so far.`,
          patch: { best: [l, r] },
          focus: { pointers: { l, r } },
          variables: { l, r, sum, best },
        });
      } else {
        tracer.emit({
          type: "keep-best",
          line: "compare",
          explanation: `${sum} is not larger than the best sum ${best}, so the best window stays at indices ${bestStart}–${bestStart + k - 1}.`,
          focus: { pointers: { l, r } },
          variables: { l, r, sum, best },
        });
      }
    }

    tracer.emit({
      type: "complete",
      line: "done",
      explanation: `Done: the best window of size ${k} is indices ${bestStart}–${bestStart + k - 1} ([${array.slice(bestStart, bestStart + k).join(", ")}]) with sum ${best}.`,
      patch: { window: null, best: [bestStart, bestStart + k - 1] },
      variables: { best, start: bestStart },
    });
    return { sum: best, start: bestStart };
  },
};
