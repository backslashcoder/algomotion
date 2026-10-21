/** Apply one step's persistent patch to a state, returning a new state. Unchanged keys are shared. */
export function applyStep(state, step) {
  const patch = step.patch;
  if (!patch || Object.keys(patch).length === 0) return state;
  return { ...state, ...patch };
}

/**
 * Pre-compute the state after every step. Because patches only replace the
 * top-level keys they touch, consecutive states share every untouched value, so
 * the whole timeline is cheap and stepping backwards is just an array lookup.
 */
export function buildTimeline(initialState, steps) {
  const states = new Array(steps.length);
  let current = initialState;
  for (let i = 0; i < steps.length; i += 1) {
    current = applyStep(current, steps[i]);
    states[i] = current;
  }
  return states;
}

/** Independent, from-scratch reconstruction of the state at `index` (used to verify the timeline). */
export function reconstructState(trace, index) {
  let state = trace.initialState;
  for (let i = 0; i <= index; i += 1) state = applyStep(state, trace.steps[i]);
  return state;
}

/** The renderable frame (state + step) at an index, or null when the index is invalid. */
export function getFrame(trace, index) {
  if (!trace || !Number.isInteger(index)) return null;
  if (index < 0 || index >= trace.steps.length) return null;
  return { state: trace.states[index], step: trace.steps[index], index };
}
