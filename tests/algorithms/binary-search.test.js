import { describe, it, expect } from "vitest";
import { binarySearch } from "@/algorithms/searching/binary-search";
import { generateTrace, tryGenerateTrace } from "@/engine/trace-generator";

const run = (array, target) => generateTrace(binarySearch, { array, target });

describe("Binary Search", () => {
  it("finds every element of the default array", () => {
    const { array } = binarySearch.input.defaultValue;
    array.forEach((value, i) => {
      expect(run(array, value).result).toBe(i);
    });
  });

  it("returns −1 for missing targets below, above and between values", () => {
    const array = [10, 20, 30, 40];
    for (const target of [5, 15, 25, 35, 45]) {
      const trace = run(array, target);
      expect(trace.result).toBe(-1);
      expect(trace.steps.at(-1).type).toBe("complete");
      expect(trace.states.at(-1).found).toBeNull();
    }
  });

  it("handles a single element (found and missing)", () => {
    expect(run([7], 7).result).toBe(0);
    expect(run([7], 8).result).toBe(-1);
  });

  it("with duplicates returns an index that really holds the target", () => {
    const array = [1, 2, 2, 2, 2, 3];
    const trace = run(array, 2);
    expect(array[trace.result]).toBe(2);
  });

  it("makes at most ⌊log₂ n⌋ + 1 midpoint checks", () => {
    const array = Array.from({ length: 30 }, (_, i) => i * 3);
    for (const target of [-1, 0, 29, 87, 88]) {
      const trace = run(array, target);
      expect(trace.metrics.midChecks).toBeLessThanOrEqual(
        Math.floor(Math.log2(array.length)) + 1,
      );
    }
  });

  it("shrinks the candidate count monotonically and ends at 0 when missing", () => {
    const trace = run([1, 3, 5, 7, 9, 11], 6);
    const remaining = trace.steps.map((s) => s.metrics.remaining);
    for (let i = 1; i < remaining.length; i += 1) {
      expect(remaining[i]).toBeLessThanOrEqual(remaining[i - 1]);
    }
    expect(remaining.at(-1)).toBe(0);
  });

  it("marks eliminated indices that never include the found index", () => {
    const array = [2, 4, 6, 8, 10, 12, 14];
    const trace = run(array, 12);
    const final = trace.states.at(-1);
    expect(final.found).toBe(5);
    expect(final.eliminated).not.toContain(5);
    expect(final.eliminated.length).toBeGreaterThan(0);
  });

  it("explains each outcome with the actual values", () => {
    const trace = run([1, 3, 5, 7, 9], 7);
    const text = trace.steps.map((s) => s.explanation).join("\n");
    expect(text).toContain("mid = ⌊(0 + 4) / 2⌋ = 2");
    expect(text).toContain("A[2] = 5 < 7");
    expect(text).toContain("Found at index 3");
  });

  describe("input contract", () => {
    it("rejects unsorted arrays with a helpful message", () => {
      const res = binarySearch.input.validate({ array: [3, 1, 2], target: 2 });
      expect(res.ok).toBe(false);
      expect(res.errors[0]).toMatch(/sorted/i);
    });

    it("rejects empty arrays and missing / fractional targets", () => {
      expect(binarySearch.input.validate({ array: [], target: 1 }).ok).toBe(false);
      expect(binarySearch.input.validate({ array: [1], target: NaN }).ok).toBe(false);
      expect(binarySearch.input.validate({ array: [1], target: 1.5 }).ok).toBe(false);
    });

    it("limits array length to 30", () => {
      const array = Array.from({ length: 31 }, (_, i) => i);
      expect(tryGenerateTrace(binarySearch, { array, target: 1 }).ok).toBe(false);
    });
  });
});
