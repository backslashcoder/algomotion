import { createTracer } from "./tracer";
import { buildTimeline } from "./state-reconstruction";
import { validateTrace } from "./trace-validator";
import {
  InputValidationError,
  TraceLimitError,
  TraceValidationError,
} from "./errors";

/**
 * Generate a deterministic trace for an algorithm definition.
 * Throws InputValidationError, TraceLimitError or TraceValidationError.
 */
export function generateTrace(definition, rawInput) {
  const validation = definition.input.validate(rawInput);
  if (!validation.ok) throw new InputValidationError(validation.errors);
  const input = validation.value;

  const initialState = definition.createInitialState(input);
  const tracer = createTracer({
    metricKeys: definition.metrics.map((m) => m.key),
    initialMetrics: definition.initialMetrics?.(input),
    initialExplanation: definition.describeInput(input),
  });

  const result = definition.run(input, tracer);
  const { steps, metrics } = tracer.finish();
  const trace = {
    algorithmId: definition.id,
    input,
    initialState,
    steps,
    states: buildTimeline(initialState, steps),
    result,
    metrics,
  };

  const lineIds = new Set(definition.pseudocode.map((l) => l.id));
  const problems = validateTrace(trace, { lineIds });
  if (problems.length > 0) throw new TraceValidationError(problems);
  return trace;
}

/** Non-throwing variant for UI code: returns `{ ok, trace }` or `{ ok: false, error }`. */
export function tryGenerateTrace(definition, rawInput) {
  try {
    return { ok: true, trace: generateTrace(definition, rawInput) };
  } catch (error) {
    if (error instanceof InputValidationError) {
      return { ok: false, error: { kind: "input", messages: error.errors } };
    }
    if (error instanceof TraceLimitError) {
      return { ok: false, error: { kind: "limit", messages: [error.message] } };
    }
    return {
      ok: false,
      error: {
        kind: "internal",
        messages: [
          "Something went wrong while running this algorithm. Try a different input.",
        ],
        detail: error?.message,
      },
    };
  }
}
