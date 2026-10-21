import { RESERVED_EVENT_TYPES, MAX_TRACE_STEPS } from "./trace-schema";
import { TraceLimitError } from "./errors";

const clone = (value) =>
  value === undefined ? value : structuredClone(value);

/**
 * Collects steps while an algorithm runs. Algorithms depend only on this
 * interface; they never touch React, Zustand or playback.
 *
 *   tracer.count("comparisons")        // increment a metric
 *   tracer.setMetric("remaining", 4)   // set a metric to a value
 *   tracer.emit({ type, line, explanation, patch, focus, variables })
 *
 * `patch`, `focus` and `variables` are deep-cloned on emit, so an algorithm
 * can keep mutating its own working data without corrupting earlier steps.
 */
export function createTracer({
  metricKeys = [],
  initialMetrics = {},
  initialExplanation = "Initial input.",
  initialFocus = {},
  maxSteps = MAX_TRACE_STEPS,
} = {}) {
  const metrics = {
    ...Object.fromEntries(metricKeys.map((key) => [key, 0])),
    ...initialMetrics,
  };
  const steps = [];

  function push(step) {
    if (steps.length >= maxSteps) throw new TraceLimitError(maxSteps);
    steps.push({
      id: `s${steps.length}`,
      type: step.type,
      line: step.line ?? null,
      explanation: step.explanation ?? "",
      patch: clone(step.patch ?? {}),
      focus: clone(step.focus ?? {}),
      variables: clone(step.variables ?? {}),
      metrics: { ...metrics },
      ...(step.annotations ? { annotations: clone(step.annotations) } : {}),
    });
  }

  push({
    type: RESERVED_EVENT_TYPES.INIT,
    explanation: initialExplanation,
    focus: initialFocus,
  });

  return {
    count(key, amount = 1) {
      metrics[key] = (metrics[key] ?? 0) + amount;
    },
    setMetric(key, value) {
      metrics[key] = value;
    },
    emit: push,
    get stepCount() {
      return steps.length;
    },
    /** @internal used by generateTrace */
    finish() {
      return { steps, metrics: { ...metrics } };
    },
  };
}
