import { describe, it, expect } from "vitest";
import { twoSumSorted } from "@/algorithms/arrays/two-sum-sorted";
import { removeDuplicates } from "@/algorithms/arrays/remove-duplicates";
import { dutchNationalFlag } from "@/algorithms/arrays/dutch-national-flag";
import { fixedWindow } from "@/algorithms/arrays/fixed-window";
import { variableWindow } from "@/algorithms/arrays/variable-window";
import { kadane } from "@/algorithms/arrays/kadane";
import { lowerBound } from "@/algorithms/searching/lower-bound";
import { quickSort } from "@/algorithms/sorting/quick-sort";
import { generateTrace, tryGenerateTrace } from "@/engine/trace-generator";
import { reconstructState } from "@/engine/state-reconstruction";

function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(2024);
const randArray = (len, lo, hi) =>
  Array.from({ length: len }, () => lo + Math.floor(rnd() * (hi - lo + 1)));
const randLen = (max) => 1 + Math.floor(rnd() * max);
const asc = (xs) => [...xs].sort((a, b) => a - b);
const last = (trace) => trace.states.at(-1);

describe("Two Sum (sorted)", () => {
  const run = (array, target) => generateTrace(twoSumSorted, { array, target });

  it("finds the default pair", () => {
    const trace = run([1, 3, 4, 6, 8, 11, 15], 14);
    expect(trace.result).toEqual([1, 5]); // 3 + 11
    expect(last(trace).found).toEqual([1, 5]);
  });

  it("agrees with brute force on 200 random inputs", () => {
    for (let t = 0; t < 200; t += 1) {
      const array = asc(randArray(2 + Math.floor(rnd() * 15), -20, 40));
      const target = Math.floor(rnd() * 80) - 20;
      const { result } = run(array, target);
      let exists = false;
      for (let i = 0; i < array.length; i += 1)
        for (let j = i + 1; j < array.length; j += 1) if (array[i] + array[j] === target) exists = true;
      expect(result !== null).toBe(exists);
      if (result) {
        expect(result[0]).toBeLessThan(result[1]);
        expect(array[result[0]] + array[result[1]]).toBe(target);
      }
    }
  });

  it("handles no pair, duplicates and two elements", () => {
    expect(run([1, 2, 3], 100).result).toBeNull();
    expect(run([3, 3], 6).result).toEqual([0, 1]);
    expect(run([1, 2], 4).result).toBeNull();
    expect(run([2, 2, 2, 2], 4).result).toEqual([0, 3]);
  });

  it("never checks more than n − 1 sums and discards elements monotonically", () => {
    const array = [1, 2, 4, 7, 11, 15, 20, 30];
    const trace = run(array, 1000);
    expect(trace.metrics.sumsChecked).toBeLessThanOrEqual(array.length - 1);
    const sizes = trace.states.map((s) => s.eliminated.length);
    sizes.forEach((v, i) => i > 0 && expect(v).toBeGreaterThanOrEqual(sizes[i - 1]));
  });

  it("rejects unsorted, too short, too long input and bad targets", () => {
    expect(twoSumSorted.input.validate({ array: [3, 1, 2], target: 3 }).errors[0]).toMatch(/sorted/);
    expect(twoSumSorted.input.validate({ array: [1], target: 1 }).ok).toBe(false);
    expect(twoSumSorted.input.validate({ array: asc(randArray(17, 0, 50)), target: 1 }).ok).toBe(false);
    expect(twoSumSorted.input.validate({ array: [1, 2], target: 1.5 }).ok).toBe(false);
  });
});

describe("Remove Duplicates (sorted)", () => {
  const run = (array) => generateTrace(removeDuplicates, { array });

  it("compacts the default example", () => {
    const trace = run(removeDuplicates.input.defaultValue.array);
    expect(trace.result).toEqual({ length: 5, values: [1, 2, 3, 4, 5] });
    expect(last(trace).sorted).toEqual([0, 1, 2, 3, 4]);
    expect(last(trace).eliminated).toEqual([5, 6, 7, 8]);
  });

  it("matches the distinct values for 200 random sorted arrays", () => {
    for (let t = 0; t < 200; t += 1) {
      const array = asc(randArray(randLen(16), 0, 6));
      const { result, metrics } = run(array);
      const expected = [...new Set(array)];
      expect(result.values).toEqual(expected);
      expect(result.length).toBe(expected.length);
      expect(metrics.comparisons).toBe(array.length - 1);
      expect(metrics.writes).toBe(expected.length - 1);
    }
  });

  it("handles a single element, all equal and all distinct", () => {
    expect(run([5]).result).toEqual({ length: 1, values: [5] });
    expect(run([4, 4, 4, 4]).result.length).toBe(1);
    expect(run([1, 2, 3]).result.length).toBe(3);
  });

  it("requires sorted input", () => {
    expect(removeDuplicates.input.validate({ array: [2, 1, 1] }).ok).toBe(false);
    expect(removeDuplicates.input.validate({ array: [] }).ok).toBe(false);
  });
});

describe("Dutch National Flag", () => {
  const run = (array) => generateTrace(dutchNationalFlag, { array });

  it("sorts 300 random 0/1/2 arrays in one pass", () => {
    for (let t = 0; t < 300; t += 1) {
      const array = randArray(randLen(16), 0, 2);
      const trace = run(array);
      expect(trace.result).toEqual(asc(array));
      expect(trace.metrics.inspections).toBeLessThanOrEqual(2 * array.length);
      expect(trace.metrics.swaps).toBeLessThanOrEqual(array.length);
      expect(last(trace).items.map((e) => e.id).sort()).toEqual(array.map((_, i) => `e${i}`).sort());
    }
  });

  it("handles single, uniform and sorted inputs", () => {
    expect(run([1]).result).toEqual([1]);
    expect(run([2, 2, 2]).result).toEqual([2, 2, 2]);
    expect(run([0, 1, 2]).result).toEqual([0, 1, 2]);
    expect(run([2, 1, 0]).result).toEqual([0, 1, 2]);
  });

  it("keeps the zones consistent at every step", () => {
    const trace = run([2, 0, 1, 2, 1, 0, 0, 2, 1]);
    for (const state of trace.states) {
      const values = state.items.map((e) => e.value);
      if (!state.range) {
        expect(values).toEqual(asc(values)); // finished: everything placed
        continue;
      }
      const [lo, hi] = state.range;
      state.sorted.forEach((i) => expect(i < lo || i > hi).toBe(true));
      state.sorted.filter((i) => i < lo).forEach((i) => expect(values[i]).toBeLessThanOrEqual(1));
      state.sorted.filter((i) => i > hi).forEach((i) => expect(values[i]).toBe(2));
    }
  });

  it("rejects values other than 0, 1, 2 with a clear message", () => {
    const res = dutchNationalFlag.input.validate({ array: [0, 3] });
    expect(res.ok).toBe(false);
    expect(res.errors[0]).toMatch(/0, 1 or 2/);
  });
});

describe("Sliding window: max sum of size k", () => {
  const run = (array, k) => generateTrace(fixedWindow, { array, k });

  it("solves the default example", () => {
    const trace = run([2, 1, 5, 1, 3, 2, 8, 1, 4], 3);
    expect(trace.result).toEqual({ sum: 13, start: 4 }); // 3 + 2 + 8
    expect(last(trace).best).toEqual([4, 6]);
  });

  it("agrees with brute force (first best window wins ties) on 200 random inputs", () => {
    for (let t = 0; t < 200; t += 1) {
      const array = randArray(randLen(16), -10, 20);
      const k = 1 + Math.floor(rnd() * array.length);
      let bestSum = -Infinity;
      let bestStart = -1;
      for (let s = 0; s + k <= array.length; s += 1) {
        const sum = array.slice(s, s + k).reduce((a, b) => a + b, 0);
        if (sum > bestSum) {
          bestSum = sum;
          bestStart = s;
        }
      }
      const { result, metrics } = run(array, k);
      expect(result).toEqual({ sum: bestSum, start: bestStart });
      expect(metrics.slides).toBe(array.length - k);
      expect(metrics.bestSum).toBe(bestSum);
    }
  });

  it("window label always shows the true sum of the window", () => {
    const array = [4, -2, 7, 1, -5, 3];
    const trace = run(array, 3);
    for (const state of trace.states) {
      if (!state.window) continue;
      const sum = array.slice(state.window.from, state.window.to + 1).reduce((a, b) => a + b, 0);
      expect(state.window.label).toBe(`sum = ${sum}`);
      expect(state.window.to - state.window.from + 1).toBe(3);
    }
  });

  it("handles k = 1, k = n and all-negative data", () => {
    expect(run([3, 9, 2], 1).result).toEqual({ sum: 9, start: 1 });
    expect(run([3, 9, 2], 3).result).toEqual({ sum: 14, start: 0 });
    expect(run([-5, -2, -8], 2).result).toEqual({ sum: -7, start: 0 });
    expect(run([3, 9, 2], 3).metrics.slides).toBe(0);
  });

  it("validates k", () => {
    for (const k of [0, 4, -1, 1.5, NaN]) {
      expect(fixedWindow.input.validate({ array: [1, 2, 3], k }).ok).toBe(false);
    }
  });
});

describe("Sliding window: smallest subarray ≥ target", () => {
  const run = (array, target) => generateTrace(variableWindow, { array, target });

  it("solves the default example", () => {
    const trace = run([2, 3, 1, 2, 4, 3, 5, 1], 7);
    expect(trace.result.length).toBe(2); // [4, 3] or [3, 5]
    expect(trace.metrics.bestLength).toBe(2);
  });

  it("agrees with brute force on 300 random positive inputs", () => {
    for (let t = 0; t < 300; t += 1) {
      const array = randArray(randLen(16), 1, 9);
      const target = 1 + Math.floor(rnd() * 40);
      let best = 0;
      for (let s = 0; s < array.length; s += 1) {
        let sum = 0;
        for (let e = s; e < array.length; e += 1) {
          sum += array[e];
          if (sum >= target) {
            if (best === 0 || e - s + 1 < best) best = e - s + 1;
            break;
          }
        }
      }
      const { result, metrics } = run(array, target);
      expect(result.length).toBe(best);
      if (best) {
        const window = array.slice(result.start, result.start + best);
        expect(window.reduce((a, b) => a + b, 0)).toBeGreaterThanOrEqual(target);
      }
      expect(metrics.expansions).toBe(array.length);
      expect(metrics.shrinks).toBeLessThanOrEqual(array.length);
    }
  });

  it("returns 0 when unreachable and 1 when a single value suffices", () => {
    const none = run([1, 2, 3], 100);
    expect(none.result).toEqual({ length: 0, start: -1 });
    expect(none.steps.at(-1).explanation).toMatch(/no window/);
    expect(run([1, 2, 30, 2], 20).result).toEqual({ length: 1, start: 2 });
  });

  it("the window never contains a sum that is stale", () => {
    const array = [2, 3, 1, 2, 4, 3];
    const trace = run(array, 7);
    for (const state of trace.states) {
      if (!state.window) continue;
      const sum = array.slice(state.window.from, state.window.to + 1).reduce((a, b) => a + b, 0);
      expect(state.window.label).toBe(`sum = ${sum}`);
    }
  });

  it("requires positive numbers and a target of at least 1", () => {
    expect(variableWindow.input.validate({ array: [1, 0, 2], target: 3 }).ok).toBe(false);
    expect(variableWindow.input.validate({ array: [1, -2], target: 3 }).ok).toBe(false);
    expect(variableWindow.input.validate({ array: [1, 2], target: 0 }).ok).toBe(false);
  });
});

describe("Kadane's maximum subarray", () => {
  const run = (array) => generateTrace(kadane, { array });

  it("solves the classic example", () => {
    const trace = run([-2, 1, -3, 4, -1, 2, 1, -5, 4]);
    expect(trace.result).toEqual({ sum: 6, start: 3, end: 6 });
    expect(last(trace).best).toEqual([3, 6]);
  });

  it("matches the brute-force maximum on 300 random arrays", () => {
    for (let t = 0; t < 300; t += 1) {
      const array = randArray(randLen(16), -15, 15);
      let max = -Infinity;
      for (let s = 0; s < array.length; s += 1) {
        let sum = 0;
        for (let e = s; e < array.length; e += 1) {
          sum += array[e];
          max = Math.max(max, sum);
        }
      }
      const { result } = run(array);
      expect(result.sum).toBe(max);
      expect(array.slice(result.start, result.end + 1).reduce((a, b) => a + b, 0)).toBe(max);
    }
  });

  it("handles single, all-negative and all-positive arrays", () => {
    expect(run([-4]).result).toEqual({ sum: -4, start: 0, end: 0 });
    expect(run([-4, -2, -9]).result).toEqual({ sum: -2, start: 1, end: 1 });
    expect(run([1, 2, 3]).result).toEqual({ sum: 6, start: 0, end: 2 });
  });

  it("restarts only when the running sum is not positive", () => {
    const trace = run([5, -6, 3]);
    expect(trace.steps.some((s) => s.type === "restart")).toBe(true);
    expect(trace.metrics.restarts).toBe(1); // 5 extends with −6 (sum −1), then −1 ≤ 0 restarts at 3
  });
});

describe("Lower Bound", () => {
  const run = (array, target) => generateTrace(lowerBound, { array, target });

  it("returns the leftmost occurrence for the default example", () => {
    const trace = run([2, 4, 4, 4, 7, 9, 9, 12], 4);
    expect(trace.result).toBe(1);
    expect(last(trace).found).toBe(1);
  });

  it("agrees with a linear scan on 300 random inputs (including values past either end)", () => {
    for (let t = 0; t < 300; t += 1) {
      const array = asc(randArray(randLen(16), 0, 12));
      const target = Math.floor(rnd() * 16) - 2;
      const expected = array.findIndex((v) => v >= target);
      const index = expected === -1 ? array.length : expected;
      const trace = run(array, target);
      expect(trace.result).toBe(index);
      expect(trace.metrics.midChecks).toBeLessThanOrEqual(Math.ceil(Math.log2(array.length + 1)) + 1);
    }
  });

  it("reports insertion points and the end-of-array case", () => {
    const missing = run([1, 3, 5, 7], 4);
    expect(missing.result).toBe(2);
    expect(missing.steps.at(-1).explanation).toMatch(/not in the array/);
    const past = run([1, 3], 99);
    expect(past.result).toBe(2);
    expect(last(past).found).toBeNull();
    expect(past.steps.at(-1).explanation).toMatch(/end \(index 2\)/);
    expect(run([5], 1).result).toBe(0);
  });

  it("classifies indices consistently in every state", () => {
    const array = [2, 4, 4, 4, 7, 9, 9, 12];
    const trace = run(array, 5);
    for (const state of trace.states) {
      state.eliminated.forEach((i) => expect(array[i]).toBeLessThan(5));
      state.sorted.forEach((i) => expect(array[i]).toBeGreaterThanOrEqual(5));
    }
  });

  it("requires sorted input", () => {
    expect(lowerBound.input.validate({ array: [3, 1], target: 1 }).ok).toBe(false);
  });
});

describe("Quick Sort", () => {
  const run = (array) => generateTrace(quickSort, { array });

  it("sorts 150 random arrays and keeps every element", () => {
    for (let t = 0; t < 150; t += 1) {
      const array = randArray(randLen(24), -20, 30);
      const trace = run(array);
      expect(trace.result).toEqual(asc(array));
      expect(last(trace).items.map((e) => e.id).sort()).toEqual(array.map((_, i) => `e${i}`).sort());
    }
  });

  it("handles single, equal, sorted and reversed input", () => {
    expect(run([1]).result).toEqual([1]);
    expect(run([2, 2, 2, 2]).result).toEqual([2, 2, 2, 2]);
    expect(run([1, 2, 3, 4, 5]).result).toEqual([1, 2, 3, 4, 5]);
    expect(run([5, 4, 3, 2, 1]).result).toEqual([1, 2, 3, 4, 5]);
  });

  it("shows quadratic behaviour on sorted input (pivot = last element)", () => {
    const n = 12;
    const trace = run(Array.from({ length: n }, (_, i) => i));
    expect(trace.metrics.comparisons).toBe((n * (n - 1)) / 2);
  });

  it("every pivot placement is final: left side smaller, right side not smaller", () => {
    const trace = run([7, 2, 9, 4, 3, 8, 1, 6]);
    const final = last(trace).items.map((e) => e.value);
    for (const state of trace.states) {
      for (const i of state.sorted) {
        expect(state.items[i].value).toBe(final[i]);
      }
    }
  });

  it("counts a swap as two writes and skips self-swaps", () => {
    const trace = run([3, 1, 2]);
    expect(trace.metrics.writes).toBe(trace.metrics.swaps * 2);
    expect(trace.steps.some((s) => s.type === "grow")).toBe(false);
    expect(run([1, 2, 3]).steps.some((s) => s.type === "grow")).toBe(true);
  });

  it("is deterministic and the timeline equals from-scratch reconstruction", () => {
    const input = { array: [4, 9, 2, 7, 1, 8] };
    const a = generateTrace(quickSort, input);
    expect(a.steps).toEqual(generateTrace(quickSort, input).steps);
    for (let i = 0; i < a.steps.length; i += 1) expect(a.states[i]).toEqual(reconstructState(a, i));
  });

  it("worst-case input stays inside the step budget", () => {
    const array = Array.from({ length: 24 }, (_, i) => i + 1);
    expect(tryGenerateTrace(quickSort, { array }).ok).toBe(true);
    expect(tryGenerateTrace(quickSort, { array: [...array].reverse() }).ok).toBe(true);
  });
});
