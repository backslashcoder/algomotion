/**
 * Execution trace contract
 * ------------------------
 * A trace is plain, serialisable data produced once per (algorithm, input) pair:
 *
 *   {
 *     algorithmId: string,
 *     input: any,                 // validated input the trace was generated from
 *     initialState: object,       // visualization state before the first step
 *     steps: Step[],              // steps[0] is always the automatic `init` step
 *     states: object[],           // states[i] = state after applying steps[0..i] (structurally shared)
 *     result: any,                // whatever the algorithm returned
 *     metrics: object,            // final metric values
 *   }
 *
 * A Step describes one semantic event:
 *
 *   {
 *     id: "s12",                  // stable, unique within the trace
 *     type: "compare",            // free-form event type; `init`, `complete`, `error` are reserved
 *     line: "compare" | null,     // pseudocode line id (see definition.pseudocode)
 *     explanation: string,        // plain-English description built from real data
 *     patch: object,              // PERSISTENT state changes (shallow-merged into the state)
 *     focus: object,              // TRANSIENT highlights, valid for this step only
 *     variables: object,          // named values shown in the inspector
 *     metrics: object,            // cumulative metric snapshot after this step
 *     annotations?: object,       // optional semantic labels
 *   }
 *
 * The state shape and the `focus` vocabulary belong to the visualization type, not to the engine.
 */

export const RESERVED_EVENT_TYPES = Object.freeze({
  INIT: "init",
  COMPLETE: "complete",
  ERROR: "error",
});

/** Hard cap on steps a single trace may contain. */
export const MAX_TRACE_STEPS = 5000;
