/**
 * Playback state machine
 * ----------------------
 * Statuses:
 *   idle      no trace loaded
 *   error     a trace was loaded but is empty/invalid; nothing can play
 *   ready     at step 0, not playing
 *   paused    somewhere in the middle, not playing
 *   playing   the clock advances one step per tick
 *   finished  at the last step, not playing
 *
 * `playbackReducer` is pure. `PlaybackController` owns the single timer that
 * turns `playing` into TICK actions. Animation timing is *not* handled here:
 * renderers animate toward whatever step the controller says is current.
 */

export const PLAYBACK_STATUS = Object.freeze({
  IDLE: "idle",
  ERROR: "error",
  READY: "ready",
  PAUSED: "paused",
  PLAYING: "playing",
  FINISHED: "finished",
});

export const SPEEDS = Object.freeze([0.25, 0.5, 1, 2, 4]);
export const MIN_SPEED = 0.1;
export const MAX_SPEED = 8;
export const BASE_STEP_DELAY_MS = 800;

export const initialPlaybackState = Object.freeze({
  status: PLAYBACK_STATUS.IDLE,
  stepIndex: 0,
  totalSteps: 0,
  speed: 1,
  loop: false,
});

const S = PLAYBACK_STATUS;

/** Status for a non-playing position. */
function restingStatus(index, total) {
  if (total <= 0) return S.ERROR;
  if (index >= total - 1 && total > 1) return S.FINISHED;
  if (index === 0) return S.READY;
  return S.PAUSED;
}

function clampIndex(value, total) {
  if (!Number.isFinite(value)) return null;
  return Math.min(Math.max(Math.trunc(value), 0), Math.max(total - 1, 0));
}

export function playbackReducer(state, action) {
  const { status, stepIndex, totalSteps } = state;
  const last = totalSteps - 1;
  const playable = status !== S.IDLE && status !== S.ERROR;

  switch (action.type) {
    case "LOAD": {
      const total = Number.isInteger(action.totalSteps) ? action.totalSteps : 0;
      return {
        ...state,
        totalSteps: Math.max(total, 0),
        stepIndex: 0,
        status: total > 0 ? S.READY : S.ERROR,
      };
    }
    case "UNLOAD":
      return { ...state, totalSteps: 0, stepIndex: 0, status: S.IDLE };
    case "PLAY": {
      if (!playable) return state;
      if (status === S.PLAYING) return state;
      if (totalSteps <= 1) return state;
      const from = status === S.FINISHED ? 0 : stepIndex;
      return { ...state, stepIndex: from, status: S.PLAYING };
    }
    case "PAUSE":
      if (status !== S.PLAYING) return state;
      return { ...state, status: restingStatus(stepIndex, totalSteps) };
    case "TICK": {
      if (status !== S.PLAYING) return state;
      if (stepIndex >= last) {
        // only reachable when looping: wrap to the start
        return state.loop
          ? { ...state, stepIndex: 0 }
          : { ...state, status: S.FINISHED };
      }
      const next = stepIndex + 1;
      if (next >= last && !state.loop) {
        return { ...state, stepIndex: next, status: S.FINISHED };
      }
      return { ...state, stepIndex: next };
    }
    case "SEEK": {
      if (!playable) return state;
      const index = clampIndex(action.index, totalSteps);
      if (index === null) return state;
      if (status === S.PLAYING && !(index >= last && !state.loop)) {
        return { ...state, stepIndex: index };
      }
      return { ...state, stepIndex: index, status: restingStatus(index, totalSteps) };
    }
    case "STEP_FORWARD": {
      if (!playable || stepIndex >= last) return state;
      const index = stepIndex + 1;
      return { ...state, stepIndex: index, status: restingStatus(index, totalSteps) };
    }
    case "STEP_BACKWARD": {
      if (!playable || stepIndex <= 0) return state;
      const index = stepIndex - 1;
      return { ...state, stepIndex: index, status: restingStatus(index, totalSteps) };
    }
    case "RESET":
      if (!playable) return state;
      return { ...state, stepIndex: 0, status: restingStatus(0, totalSteps) };
    case "SET_SPEED": {
      const speed = Number(action.speed);
      if (!Number.isFinite(speed) || speed <= 0) return state;
      return { ...state, speed: Math.min(Math.max(speed, MIN_SPEED), MAX_SPEED) };
    }
    case "SET_LOOP":
      return { ...state, loop: Boolean(action.loop) };
    default:
      return state;
  }
}

export function createPlaybackController({
  onChange = () => {},
  initial = {},
  setTimer = (fn, ms) => setTimeout(fn, ms),
  clearTimer = (handle) => clearTimeout(handle),
} = {}) {
  let state = { ...initialPlaybackState, ...initial };
  let handle = null;
  let scheduledSpeed = null;
  let disposed = false;
  const listeners = new Set();

  function stopClock() {
    if (handle !== null) clearTimer(handle);
    handle = null;
    scheduledSpeed = null;
  }

  function startClock() {
    stopClock();
    scheduledSpeed = state.speed;
    handle = setTimer(onTick, BASE_STEP_DELAY_MS / state.speed);
  }

  function onTick() {
    handle = null; // this timer has fired
    if (disposed) return;
    dispatch({ type: "TICK" });
  }

  // Single place where state changes and the clock is reconciled with it.
  function dispatch(action) {
    if (disposed) return state;
    const next = playbackReducer(state, action);
    const changed = next !== state;
    state = next;
    if (state.status !== S.PLAYING) {
      stopClock();
    } else if (handle === null || scheduledSpeed !== state.speed) {
      startClock();
    } else if (action.type === "TICK") {
      startClock();
    }
    if (changed) {
      onChange(state);
      listeners.forEach((listener) => listener());
    }
    return state;
  }

  return {
    getState: () => state,
    /** useSyncExternalStore-compatible subscription; returns an unsubscribe function. */
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    load: (totalSteps) => dispatch({ type: "LOAD", totalSteps }),
    unload: () => dispatch({ type: "UNLOAD" }),
    play: () => dispatch({ type: "PLAY" }),
    pause: () => dispatch({ type: "PAUSE" }),
    togglePlay: () =>
      dispatch({ type: state.status === S.PLAYING ? "PAUSE" : "PLAY" }),
    stepForward: () => dispatch({ type: "STEP_FORWARD" }),
    stepBackward: () => dispatch({ type: "STEP_BACKWARD" }),
    seekToStep: (index) => dispatch({ type: "SEEK", index }),
    reset: () => dispatch({ type: "RESET" }),
    setSpeed: (speed) => dispatch({ type: "SET_SPEED", speed }),
    setLoop: (loop) => dispatch({ type: "SET_LOOP", loop }),
    /** Stop the timer for good (call on unmount). */
    dispose() {
      disposed = true;
      stopClock();
    },
  };
}
