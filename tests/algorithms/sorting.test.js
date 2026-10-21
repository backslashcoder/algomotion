import { describe, it, expect } from "vitest";
import { bubbleSort } from "@/algorithms/sorting/bubble-sort";
import { insertionSort } from "@/algorithms/sorting/insertion-sort";
import { mergeSort } from "@/algorithms/sorting/merge-sort";
import { quickSort } from "@/algorithms/sorting/quick-sort";
import { generateTrace, tryGenerateTrace } from "@/engine/trace-generator";
import { reconstructState } from "@/engine/state-reconstruction";

const SORTS = [bubbleSort, insertionSort, mergeSort, quickSort];
const UNSTABLE = new Set(["quick-sort"]);
const ascending = (xs) => [...xs].sort((a, b) => a - b);

// small deterministic PRNG so property checks are repeatable
function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe.each(SORTS.map((d) => [d.name, d]))("%s", (_name, def) => {
  const finalItems = (trace) => trace.states.at(-1).items;

  const cases = {
    "default example": def.input.defaultValue.array,
    "single element": [42],
    "two elements": [2, 1],
    "already sorted": [1, 2, 3, 4, 5, 6],
    "reverse sorted": [9, 8, 7, 6, 5, 4, 3],
    "all equal": [4, 4, 4, 4],
    duplicates: [3, 1, 3, 2, 1, 3],
    negatives: [0, -5, 7, -99, 999],
  };

  it.each(Object.entries(cases))("sorts: %s", (_label, array) => {
    const trace = generateTrace(def, { array });
    expect(finalItems(trace).map((e) => e.value)).toEqual(ascending(array));
    expect(trace.result).toEqual(ascending(array));
  });

  it("is a permutation of the input at every step and stable for equal values", () => {
    const array = [5, 3, 5, 1, 3, 5, 1];
    const trace = generateTrace(def, { array });
    for (const state of trace.states) {
      expect(state.items.map((e) => e.id).sort()).toEqual(
        array.map((_, i) => `e${i}`).sort(),
      );
    }
    if (UNSTABLE.has(def.id)) return;
    const idsByValue = {};
    finalItems(trace).forEach((e) => {
      (idsByValue[e.value] ||= []).push(Number(e.id.slice(1)));
    });
    for (const ids of Object.values(idsByValue)) {
      expect(ids).toEqual([...ids].sort((a, b) => a - b));
    }
  });

  it("sorts 100 random arrays (property check)", () => {
    const random = mulberry32(1234);
    for (let t = 0; t < 100; t += 1) {
      const length = 1 + Math.floor(random() * 24);
      const array = Array.from({ length }, () => Math.floor(random() * 50) - 10);
      const trace = generateTrace(def, { array });
      expect(trace.result).toEqual(ascending(array));
    }
  });

  it("is deterministic and its timeline equals from-scratch reconstruction", () => {
    const input = { array: [4, 9, 2, 7, 1, 8] };
    const a = generateTrace(def, input);
    const b = generateTrace(def, input);
    expect(a.steps).toEqual(b.steps);
    for (let i = 0; i < a.steps.length; i += 1) {
      expect(a.states[i]).toEqual(reconstructState(a, i));
    }
  });

  it("ends with a complete step and every pseudocode line id is declared", () => {
    const trace = generateTrace(def, { array: def.input.defaultValue.array });
    expect(trace.steps.at(-1).type).toBe("complete");
    expect(trace.states.at(-1).sorted).toHaveLength(
      def.input.defaultValue.array.length,
    );
    const ids = new Set(def.pseudocode.map((l) => l.id));
    trace.steps.filter((s) => s.line).forEach((s) => expect(ids.has(s.line)).toBe(true));
  });

  it("rejects empty, oversized, non-integer and out-of-range input", () => {
    for (const array of [[], Array(25).fill(1), [1.5, 2], [1000], [-100], "x"]) {
      expect(def.input.validate({ array }).ok).toBe(false);
    }
    expect(tryGenerateTrace(def, { array: [] }).error.kind).toBe("input");
  });

  it("metrics never decrease from step to step", () => {
    const trace = generateTrace(def, { array: [5, 2, 9, 1, 7] });
    for (let i = 1; i < trace.steps.length; i += 1) {
      for (const key of Object.keys(trace.steps[i].metrics)) {
        expect(trace.steps[i].metrics[key]).toBeGreaterThanOrEqual(
          trace.steps[i - 1].metrics[key],
        );
      }
    }
  });
});

describe("Bubble Sort metrics", () => {
  it("makes n−1 comparisons and no swaps on a sorted array (early exit)", () => {
    const trace = generateTrace(bubbleSort, { array: [1, 2, 3, 4, 5] });
    expect(trace.metrics.comparisons).toBe(4);
    expect(trace.metrics.swaps).toBe(0);
    expect(trace.metrics.passes).toBe(1);
    expect(trace.steps.some((s) => s.type === "early-exit")).toBe(true);
  });

  it("performs n(n−1)/2 swaps on a reversed array", () => {
    const trace = generateTrace(bubbleSort, { array: [5, 4, 3, 2, 1] });
    expect(trace.metrics.swaps).toBe(10);
    expect(trace.metrics.writes).toBe(20);
  });

  it("emits a swap step only when the compared pair is out of order", () => {
    const trace = generateTrace(bubbleSort, { array: [3, 1] });
    expect(trace.steps.map((s) => s.type)).toEqual([
      "init", "pass-start", "compare", "swap", "mark-sorted", "complete",
    ]);
    expect(trace.metrics.comparisons).toBe(1);
  });
});

describe("Insertion Sort metrics", () => {
  it("shifts once per inversion", () => {
    const trace = generateTrace(insertionSort, { array: [3, 2, 1] });
    expect(trace.metrics.shifts).toBe(3);
    expect(trace.metrics.writes).toBe(3 + 2); // 3 shifts + 2 key insertions
  });

  it("does n−1 comparisons on sorted input", () => {
    const trace = generateTrace(insertionSort, { array: [1, 2, 3, 4] });
    expect(trace.metrics.comparisons).toBe(3);
    expect(trace.metrics.shifts).toBe(0);
  });
});

describe("Merge Sort metrics", () => {
  it("performs n−1 merges and n−1 splits", () => {
    const trace = generateTrace(mergeSort, { array: [8, 7, 6, 5, 4, 3, 2, 1] });
    expect(trace.metrics.merges).toBe(7);
    expect(trace.metrics.splits).toBe(7);
  });

  it("uses at most n·⌈log₂ n⌉ comparisons", () => {
    const trace = generateTrace(mergeSort, { array: [5, 1, 4, 2, 8, 7, 3, 6] });
    expect(trace.metrics.comparisons).toBeLessThanOrEqual(8 * 3);
  });

  it("buffers merged output before copying it back", () => {
    const trace = generateTrace(mergeSort, { array: [2, 1] });
    const buffered = trace.states.find((s) => s.aux && s.aux.length === 2);
    expect(buffered.aux.map((e) => e.value)).toEqual([1, 2]);
    expect(buffered.items.map((e) => e.value)).toEqual([2, 1]);
    expect(trace.states.at(-1).aux).toBeNull();
  });
});
