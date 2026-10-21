import { describe, it, expect } from "vitest";
import { createTracer } from "@/engine/tracer";
import { generateTrace, tryGenerateTrace } from "@/engine/trace-generator";
import { validateTrace } from "@/engine/trace-validator";
import { buildTimeline, getFrame, reconstructState } from "@/engine/state-reconstruction";
import { InputValidationError, TraceLimitError, TraceValidationError } from "@/engine/errors";
import { listAlgorithms, getAlgorithm, listSlugs } from "@/algorithms/registry";

// A minimal toy algorithm proving the engine is algorithm-agnostic.
const toy = (run) => ({
  id: "toy",
  slug: "toy",
  metrics: [{ key: "ops" }],
  pseudocode: [{ id: "a", text: "a", indent: 0 }],
  describeInput: () => "toy input",
  createInitialState: () => ({ n: 0, tag: "x" }),
  input: { validate: (raw) => (raw?.ok ? { ok: true, value: raw } : { ok: false, errors: ["nope"] }) },
  run,
});

describe("tracer", () => {
  it("auto-emits the init step and numbers steps with stable ids", () => {
    const t = createTracer({ metricKeys: ["x"] });
    t.emit({ type: "a", explanation: "A" });
    const { steps } = t.finish();
    expect(steps.map((s) => s.id)).toEqual(["s0", "s1"]);
    expect(steps[0].type).toBe("init");
    expect(steps[1].line).toBeNull();
  });

  it("snapshots metrics per step so later counting does not alter history", () => {
    const t = createTracer({ metricKeys: ["x"] });
    t.count("x");
    t.emit({ type: "a", explanation: "A" });
    t.count("x", 2);
    t.emit({ type: "b", explanation: "B" });
    const { steps, metrics } = t.finish();
    expect(steps.map((s) => s.metrics.x)).toEqual([0, 1, 3]);
    expect(metrics.x).toBe(3);
  });

  it("deep-clones patches so the algorithm can keep mutating its data", () => {
    const t = createTracer();
    const data = [1, 2, 3];
    t.emit({ type: "a", explanation: "A", patch: { data } });
    data.push(4);
    expect(t.finish().steps[1].patch.data).toEqual([1, 2, 3]);
  });

  it("enforces the step budget", () => {
    const t = createTracer({ maxSteps: 3 });
    t.emit({ type: "a", explanation: "A" });
    t.emit({ type: "a", explanation: "A" });
    expect(() => t.emit({ type: "a", explanation: "A" })).toThrow(TraceLimitError);
  });
});

describe("generateTrace", () => {
  it("builds a valid trace for any conforming definition", () => {
    const def = toy((_in, tracer) => {
      tracer.count("ops");
      tracer.emit({ type: "step", line: "a", explanation: "work", patch: { n: 1 } });
      tracer.emit({ type: "complete", line: "a", explanation: "done", patch: { n: 2 } });
      return "r";
    });
    const trace = generateTrace(def, { ok: true });
    expect(trace.states.map((s) => s.n)).toEqual([0, 1, 2]);
    expect(trace.states.every((s) => s.tag === "x")).toBe(true);
    expect(trace.result).toBe("r");
    expect(trace.metrics.ops).toBe(1);
  });

  it("throws InputValidationError for invalid input", () => {
    expect(() => generateTrace(toy(() => {}), { ok: false })).toThrow(InputValidationError);
  });

  it("rejects traces that break the contract (missing complete, bad line id, empty explanation)", () => {
    const noComplete = toy((_i, t) => t.emit({ type: "x", explanation: "x" }));
    expect(() => generateTrace(noComplete, { ok: true })).toThrow(TraceValidationError);

    const badLine = toy((_i, t) =>
      t.emit({ type: "complete", line: "zzz", explanation: "x" }),
    );
    expect(() => generateTrace(badLine, { ok: true })).toThrow(/unknown pseudocode line/);

    const noText = toy((_i, t) => t.emit({ type: "complete", explanation: "" }));
    expect(() => generateTrace(noText, { ok: true })).toThrow(/explanation/);
  });

  it("tryGenerateTrace surfaces errors instead of throwing", () => {
    expect(tryGenerateTrace(toy(() => {}), { ok: false })).toEqual({
      ok: false,
      error: { kind: "input", messages: ["nope"] },
    });
    const limit = toy((_i, t) => {
      for (;;) t.emit({ type: "x", explanation: "x" });
    });
    expect(tryGenerateTrace(limit, { ok: true }).error.kind).toBe("limit");
    const boom = toy(() => {
      throw new Error("kaboom");
    });
    const res = tryGenerateTrace(boom, { ok: true });
    expect(res.error.kind).toBe("internal");
    expect(res.error.detail).toBe("kaboom");
  });
});

describe("validateTrace", () => {
  it("flags empty traces", () => {
    expect(validateTrace({ steps: [] })).toEqual(["trace has no steps"]);
    expect(validateTrace(null)).toEqual(["trace has no steps"]);
  });
});

describe("state reconstruction", () => {
  const steps = [
    { patch: {} },
    { patch: { a: 1 } },
    { patch: { b: 2 } },
    { patch: { a: 3 } },
  ];
  const initial = { a: 0, b: 0, c: [1] };

  it("builds the timeline with structural sharing", () => {
    const states = buildTimeline(initial, steps);
    expect(states.map((s) => [s.a, s.b])).toEqual([[0, 0], [1, 0], [1, 2], [3, 2]]);
    expect(states[3].c).toBe(initial.c);
    expect(states[0]).toBe(initial);
  });

  it("matches from-scratch reconstruction for every index, forwards and backwards", () => {
    const trace = { initialState: initial, steps, states: buildTimeline(initial, steps) };
    const order = [0, 1, 2, 3, 2, 1, 0, 3];
    for (const i of order) expect(reconstructState(trace, i)).toEqual(trace.states[i]);
  });

  it("getFrame returns null for invalid indices", () => {
    const trace = { initialState: initial, steps, states: buildTimeline(initial, steps) };
    expect(getFrame(trace, -1)).toBeNull();
    expect(getFrame(trace, 4)).toBeNull();
    expect(getFrame(trace, 1.5)).toBeNull();
    expect(getFrame(null, 0)).toBeNull();
    expect(getFrame(trace, 2).step).toBe(steps[2]);
  });
});

describe("registry contract", () => {
  const REQUIRED = [
    "id", "slug", "name", "category", "difficulty", "shortDescription", "problem",
    "whenToUse", "complexity", "pseudocode", "metrics", "input", "visualization",
    "inputEditor", "createInitialState", "describeInput", "run",
  ];

  it("has unique slugs and ids", () => {
    const defs = listAlgorithms();
    expect(new Set(defs.map((d) => d.slug)).size).toBe(defs.length);
    expect(new Set(defs.map((d) => d.id)).size).toBe(defs.length);
    expect(listSlugs()).toHaveLength(13);
    expect(getAlgorithm("nonexistent")).toBeNull();
  });

  it.each(listAlgorithms().map((d) => [d.name, d]))("%s satisfies the definition contract", (_n, def) => {
    for (const key of REQUIRED) expect(def[key], key).toBeDefined();
    expect(def.input.validate(def.input.defaultValue).ok).toBe(true);
    expect(new Set(def.pseudocode.map((l) => l.id)).size).toBe(def.pseudocode.length);
    const trace = generateTrace(def, def.input.defaultValue);
    expect(trace.steps.length).toBeGreaterThan(2);
    expect(Object.keys(trace.metrics).sort()).toEqual(def.metrics.map((m) => m.key).sort());
  });
});
