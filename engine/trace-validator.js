import { RESERVED_EVENT_TYPES } from "./trace-schema";

const isPlainObject = (v) =>
  v !== null && typeof v === "object" && !Array.isArray(v);

/** Returns a list of contract violations (empty when the trace is valid). */
export function validateTrace(trace, { lineIds } = {}) {
  const problems = [];
  if (!trace || !Array.isArray(trace.steps) || trace.steps.length === 0) {
    return ["trace has no steps"];
  }
  if (!isPlainObject(trace.initialState)) problems.push("missing initialState");

  const seen = new Set();
  trace.steps.forEach((step, i) => {
    const where = `step ${i}`;
    if (typeof step.id !== "string" || seen.has(step.id)) {
      problems.push(`${where}: id must be a unique string`);
    }
    seen.add(step.id);
    if (typeof step.type !== "string" || !step.type) {
      problems.push(`${where}: missing type`);
    }
    if (typeof step.explanation !== "string" || !step.explanation) {
      problems.push(`${where}: missing explanation`);
    }
    if (step.line !== null && lineIds && !lineIds.has(step.line)) {
      problems.push(`${where}: unknown pseudocode line "${step.line}"`);
    }
    for (const key of ["patch", "focus", "variables", "metrics"]) {
      if (!isPlainObject(step[key])) problems.push(`${where}: ${key} must be an object`);
    }
  });

  if (trace.steps[0].type !== RESERVED_EVENT_TYPES.INIT) {
    problems.push("first step must be of type init");
  }
  const last = trace.steps[trace.steps.length - 1].type;
  if (last !== RESERVED_EVENT_TYPES.COMPLETE && last !== RESERVED_EVENT_TYPES.ERROR) {
    problems.push("last step must be of type complete or error");
  }
  return problems;
}
