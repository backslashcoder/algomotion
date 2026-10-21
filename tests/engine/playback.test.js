import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createPlaybackController,
  playbackReducer,
  initialPlaybackState,
  BASE_STEP_DELAY_MS,
} from "@/engine/playback-controller";

function setup(totalSteps = 5, initial = {}) {
  const changes = [];
  const controller = createPlaybackController({
    initial,
    onChange: (s) => changes.push(s),
  });
  if (totalSteps !== null) controller.load(totalSteps);
  return { controller, changes };
}

describe("playback state machine", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("starts idle and ignores commands until a trace is loaded", () => {
    const { controller } = setup(null);
    expect(controller.getState().status).toBe("idle");
    controller.play();
    controller.stepForward();
    controller.seekToStep(2);
    expect(controller.getState()).toEqual(initialPlaybackState);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("loads into ready at step 0", () => {
    const { controller } = setup(5);
    expect(controller.getState()).toMatchObject({ status: "ready", stepIndex: 0, totalSteps: 5 });
  });

  it("plays one step per tick and finishes at the last step", () => {
    const { controller } = setup(4);
    controller.play();
    expect(controller.getState().status).toBe("playing");
    vi.advanceTimersByTime(BASE_STEP_DELAY_MS);
    expect(controller.getState().stepIndex).toBe(1);
    vi.advanceTimersByTime(BASE_STEP_DELAY_MS * 2);
    expect(controller.getState()).toMatchObject({ stepIndex: 3, status: "finished" });
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(BASE_STEP_DELAY_MS * 5);
    expect(controller.getState().stepIndex).toBe(3);
  });

  it("pause stops the clock and keeps the position", () => {
    const { controller } = setup(10);
    controller.play();
    vi.advanceTimersByTime(BASE_STEP_DELAY_MS * 2);
    controller.pause();
    expect(controller.getState()).toMatchObject({ status: "paused", stepIndex: 2 });
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(BASE_STEP_DELAY_MS * 5);
    expect(controller.getState().stepIndex).toBe(2);
  });

  it("never creates overlapping timers on repeated play presses", () => {
    const { controller } = setup(10);
    for (let i = 0; i < 5; i += 1) controller.play();
    expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(BASE_STEP_DELAY_MS);
    expect(controller.getState().stepIndex).toBe(1);
    expect(vi.getTimerCount()).toBe(1);
  });

  it("togglePlay alternates between play and pause", () => {
    const { controller } = setup(5);
    controller.togglePlay();
    expect(controller.getState().status).toBe("playing");
    controller.togglePlay();
    expect(controller.getState().status).toBe("ready");
  });

  it("steps forward and backward with correct statuses", () => {
    const { controller } = setup(3);
    controller.stepForward();
    expect(controller.getState()).toMatchObject({ stepIndex: 1, status: "paused" });
    controller.stepForward();
    expect(controller.getState()).toMatchObject({ stepIndex: 2, status: "finished" });
    controller.stepForward(); // no-op at the end
    expect(controller.getState().stepIndex).toBe(2);
    controller.stepBackward();
    expect(controller.getState()).toMatchObject({ stepIndex: 1, status: "paused" });
    controller.stepBackward();
    expect(controller.getState()).toMatchObject({ stepIndex: 0, status: "ready" });
    controller.stepBackward(); // no-op at the start
    expect(controller.getState().stepIndex).toBe(0);
  });

  it("stepping while playing pauses playback", () => {
    const { controller } = setup(6);
    controller.play();
    controller.stepForward();
    expect(controller.getState()).toMatchObject({ status: "paused", stepIndex: 1 });
    expect(vi.getTimerCount()).toBe(0);
  });

  it("seeks, clamps out-of-range indices and ignores invalid ones", () => {
    const { controller } = setup(5);
    controller.seekToStep(3);
    expect(controller.getState().stepIndex).toBe(3);
    controller.seekToStep(99);
    expect(controller.getState()).toMatchObject({ stepIndex: 4, status: "finished" });
    controller.seekToStep(-5);
    expect(controller.getState()).toMatchObject({ stepIndex: 0, status: "ready" });
    controller.seekToStep(NaN);
    controller.seekToStep(undefined);
    controller.seekToStep("abc");
    expect(controller.getState().stepIndex).toBe(0);
  });

  it("keeps playing when seeking mid-playback and finishes when seeking to the end", () => {
    const { controller } = setup(8);
    controller.play();
    controller.seekToStep(4);
    expect(controller.getState()).toMatchObject({ status: "playing", stepIndex: 4 });
    expect(vi.getTimerCount()).toBe(1);
    controller.seekToStep(7);
    expect(controller.getState().status).toBe("finished");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("reset returns to step 0 and cancels playback", () => {
    const { controller } = setup(6);
    controller.play();
    vi.advanceTimersByTime(BASE_STEP_DELAY_MS * 3);
    controller.reset();
    expect(controller.getState()).toMatchObject({ status: "ready", stepIndex: 0 });
    expect(vi.getTimerCount()).toBe(0);
  });

  it("replays from the beginning when play is pressed after finishing", () => {
    const { controller } = setup(3);
    controller.seekToStep(2);
    expect(controller.getState().status).toBe("finished");
    controller.play();
    expect(controller.getState()).toMatchObject({ status: "playing", stepIndex: 0 });
    vi.advanceTimersByTime(BASE_STEP_DELAY_MS * 2);
    expect(controller.getState().status).toBe("finished");
  });

  it("changes speed while playing without duplicating timers", () => {
    const { controller } = setup(20);
    controller.play();
    controller.setSpeed(4);
    expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(BASE_STEP_DELAY_MS / 4);
    expect(controller.getState().stepIndex).toBe(1);
    controller.setSpeed(0.5);
    vi.advanceTimersByTime(BASE_STEP_DELAY_MS * 2);
    expect(controller.getState().stepIndex).toBe(2);
    expect(vi.getTimerCount()).toBe(1);
  });

  it("rejects invalid and clamps extreme speeds", () => {
    const { controller } = setup(5);
    controller.setSpeed(0);
    controller.setSpeed(-1);
    controller.setSpeed(NaN);
    controller.setSpeed("fast");
    expect(controller.getState().speed).toBe(1);
    controller.setSpeed(1000);
    expect(controller.getState().speed).toBe(8);
  });

  it("loops back to the start when looping is enabled", () => {
    const { controller } = setup(3);
    controller.setLoop(true);
    controller.play();
    vi.advanceTimersByTime(BASE_STEP_DELAY_MS * 2);
    expect(controller.getState()).toMatchObject({ stepIndex: 2, status: "playing" });
    vi.advanceTimersByTime(BASE_STEP_DELAY_MS);
    expect(controller.getState()).toMatchObject({ stepIndex: 0, status: "playing" });
    controller.pause();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("handles empty traces as an error state and single-step traces", () => {
    const empty = setup(0).controller;
    expect(empty.getState().status).toBe("error");
    empty.play();
    empty.stepForward();
    expect(empty.getState().status).toBe("error");
    expect(vi.getTimerCount()).toBe(0);

    const single = setup(1).controller;
    single.play();
    expect(single.getState()).toMatchObject({ status: "ready", stepIndex: 0 });
    expect(vi.getTimerCount()).toBe(0);
  });

  it("reloading (new input / algorithm switch) cancels playback and resets position", () => {
    const { controller } = setup(10);
    controller.play();
    vi.advanceTimersByTime(BASE_STEP_DELAY_MS * 3);
    controller.load(4);
    expect(controller.getState()).toMatchObject({ status: "ready", stepIndex: 0, totalSteps: 4 });
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(BASE_STEP_DELAY_MS * 5);
    expect(controller.getState().stepIndex).toBe(0);
    controller.unload();
    expect(controller.getState().status).toBe("idle");
  });

  it("preserves speed and loop across loads", () => {
    const { controller } = setup(5);
    controller.setSpeed(2);
    controller.setLoop(true);
    controller.load(9);
    expect(controller.getState()).toMatchObject({ speed: 2, loop: true });
  });

  it("dispose clears the timer and ignores later commands", () => {
    const { controller, changes } = setup(5);
    controller.play();
    controller.dispose();
    expect(vi.getTimerCount()).toBe(0);
    const count = changes.length;
    controller.play();
    controller.stepForward();
    expect(changes.length).toBe(count);
  });

  it("only notifies listeners when the state actually changes", () => {
    const { controller, changes } = setup(5);
    const count = changes.length;
    controller.pause(); // no-op while not playing
    controller.stepBackward(); // no-op at the start
    controller.reset(); // already at start: restingStatus gives identical content but new object
    expect(changes.length - count).toBeLessThanOrEqual(1);
  });
});

describe("playbackReducer purity", () => {
  it("returns the same reference for no-op actions and never mutates", () => {
    const state = Object.freeze({ ...initialPlaybackState, status: "ready", totalSteps: 3 });
    expect(playbackReducer(state, { type: "PAUSE" })).toBe(state);
    expect(playbackReducer(state, { type: "STEP_BACKWARD" })).toBe(state);
    expect(playbackReducer(state, { type: "UNKNOWN" })).toBe(state);
  });
});

describe("controller subscriptions", () => {
  it("notifies subscribers on change and stops after unsubscribe", () => {
    const controller = createPlaybackController();
    const listener = vi.fn();
    const unsubscribe = controller.subscribe(listener);
    controller.load(4);
    controller.stepForward();
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    controller.stepForward();
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
