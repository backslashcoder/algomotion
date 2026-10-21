import { create } from "zustand";
import { getAlgorithm } from "@/algorithms/registry";
import { tryGenerateTrace } from "@/engine/trace-generator";
import { getFrame } from "@/engine/state-reconstruction";
import { usePlaybackStore } from "./playback-store";

/**
 * Which algorithm is open, its last valid input and the trace generated from it.
 * Algorithms know nothing about this store; it calls into the engine.
 */
export const useWorkspaceStore = create((set, get) => ({
  slug: null,
  version: 0, // bumps whenever a new trace is generated (used to replay entrance motion)
  input: null,
  trace: null,
  error: null, // { kind, messages } for the most recent failed generation

  /** Open an algorithm with its default example. Cancels any running playback. */
  openAlgorithm(slug) {
    const playback = usePlaybackStore.getState();
    playback.unload(); // stops the timer before anything else changes
    const definition = getAlgorithm(slug);
    if (!definition) {
      set({ slug: null, input: null, trace: null, error: { kind: "not-found", messages: [`There is no algorithm called "${slug}".`] } });
      return { ok: false };
    }
    const result = tryGenerateTrace(definition, definition.input.defaultValue);
    if (!result.ok) {
      set({ slug, input: null, trace: null, error: result.error });
      return { ok: false, error: result.error };
    }
    set((st) => ({ slug, version: st.version + 1, input: result.trace.input, trace: result.trace, error: null }));
    playback.load(result.trace.steps.length);
    return { ok: true };
  },

  /**
   * Validate `rawInput` and, if valid, regenerate the trace and reset playback.
   * On failure the previous trace stays in place so the workspace remains usable.
   */
  applyInput(rawInput) {
    const definition = getAlgorithm(get().slug);
    if (!definition) return { ok: false, error: { kind: "not-found", messages: ["No algorithm is open."] } };
    const result = tryGenerateTrace(definition, rawInput);
    if (!result.ok) {
      set({ error: result.error });
      return { ok: false, error: result.error };
    }
    const playback = usePlaybackStore.getState();
    playback.pause();
    set((st) => ({ version: st.version + 1, input: result.trace.input, trace: result.trace, error: null }));
    playback.load(result.trace.steps.length);
    return { ok: true };
  },

  resetInput() {
    const definition = getAlgorithm(get().slug);
    return definition
      ? get().applyInput(definition.input.defaultValue)
      : { ok: false };
  },

  clearError() {
    set({ error: null });
  },

  /** Leave the workspace: stop playback and drop the trace. */
  close() {
    usePlaybackStore.getState().unload();
    set({ slug: null, input: null, trace: null, error: null });
  },
}));

/** The renderable frame for the current step, derived (never stored). */
export function selectCurrentFrame(workspace, stepIndex) {
  const trace = workspace.trace;
  if (!trace) return null;
  const clamped = Math.min(Math.max(stepIndex, 0), trace.steps.length - 1);
  return getFrame(trace, clamped);
}
