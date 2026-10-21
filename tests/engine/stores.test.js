import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useWorkspaceStore, selectCurrentFrame } from "@/stores/workspace-store";
import { usePlaybackStore } from "@/stores/playback-store";
import { BASE_STEP_DELAY_MS } from "@/engine/playback-controller";
import { getAlgorithm } from "@/algorithms/registry";

const workspace = () => useWorkspaceStore.getState();
const playback = () => usePlaybackStore.getState();

describe("workspace + playback stores", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    workspace().close();
    vi.useRealTimers();
  });

  it("opens an algorithm with its default trace and ready playback", () => {
    expect(workspace().openAlgorithm("bubble-sort").ok).toBe(true);
    const { trace } = workspace();
    expect(trace.algorithmId).toBe("bubble-sort");
    expect(playback()).toMatchObject({ status: "ready", stepIndex: 0, totalSteps: trace.steps.length });
  });

  it("reports unknown slugs without crashing", () => {
    const res = workspace().openAlgorithm("does-not-exist");
    expect(res.ok).toBe(false);
    expect(workspace().error.kind).toBe("not-found");
    expect(playback().status).toBe("idle");
  });

  it("derives the current frame from the step index (forwards and backwards)", () => {
    workspace().openAlgorithm("bubble-sort");
    playback().stepForward();
    playback().stepForward();
    const forward = selectCurrentFrame(workspace(), playback().stepIndex);
    expect(forward.index).toBe(2);
    playback().stepBackward();
    playback().stepBackward();
    expect(selectCurrentFrame(workspace(), playback().stepIndex).state).toBe(
      workspace().trace.states[0],
    );
  });

  it("applying valid input regenerates the trace and resets playback", () => {
    workspace().openAlgorithm("bubble-sort");
    playback().play();
    vi.advanceTimersByTime(BASE_STEP_DELAY_MS * 3);
    const res = workspace().applyInput({ array: [3, 1, 2] });
    expect(res.ok).toBe(true);
    expect(workspace().input).toEqual({ array: [3, 1, 2] });
    expect(playback()).toMatchObject({ status: "ready", stepIndex: 0 });
    expect(playback().totalSteps).toBe(workspace().trace.steps.length);
    vi.advanceTimersByTime(BASE_STEP_DELAY_MS * 5);
    expect(playback().stepIndex).toBe(0); // old timer is gone
  });

  it("rejecting invalid input keeps the previous trace and surfaces the error", () => {
    workspace().openAlgorithm("bubble-sort");
    const before = workspace().trace;
    const res = workspace().applyInput({ array: [] });
    expect(res.ok).toBe(false);
    expect(res.error.messages[0]).toMatch(/at least 1/);
    expect(workspace().trace).toBe(before);
    expect(workspace().error.kind).toBe("input");
    expect(playback().status).toBe("ready");
    workspace().applyInput({ array: [2, 1] });
    expect(workspace().error).toBeNull();
  });

  it("switching algorithms mid-playback cancels the timer and loads the new trace", () => {
    workspace().openAlgorithm("bubble-sort");
    playback().play();
    vi.advanceTimersByTime(BASE_STEP_DELAY_MS * 2);
    expect(playback().stepIndex).toBe(2);
    workspace().openAlgorithm("breadth-first-search");
    expect(workspace().trace.algorithmId).toBe("bfs");
    expect(playback()).toMatchObject({ status: "ready", stepIndex: 0 });
    vi.advanceTimersByTime(BASE_STEP_DELAY_MS * 3);
    expect(playback().stepIndex).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("closing the workspace stops playback", () => {
    workspace().openAlgorithm("insertion-sort");
    playback().play();
    workspace().close();
    expect(vi.getTimerCount()).toBe(0);
    expect(playback().status).toBe("idle");
    expect(workspace().trace).toBeNull();
  });

  it("resetInput restores the default example", () => {
    workspace().openAlgorithm("merge-sort");
    workspace().applyInput({ array: [1, 2] });
    workspace().resetInput();
    expect(workspace().input).toEqual(getAlgorithm("merge-sort").input.defaultValue);
  });

  it("plays a full trace end to end and lands on the complete step", () => {
    workspace().openAlgorithm("binary-search");
    playback().setSpeed(4);
    playback().play();
    vi.advanceTimersByTime(BASE_STEP_DELAY_MS * workspace().trace.steps.length);
    expect(playback().status).toBe("finished");
    const frame = selectCurrentFrame(workspace(), playback().stepIndex);
    expect(frame.step.type).toBe("complete");
    expect(frame.state.found).toBe(6);
  });
});
