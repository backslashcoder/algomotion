import { create } from "zustand";
import { createPlaybackController } from "@/engine/playback-controller";

/**
 * Global playback state for the algorithm workspace. The framework-agnostic
 * PlaybackController owns the timer and state machine; this store only mirrors
 * its state for React and exposes its commands.
 */
export const usePlaybackStore = create((set) => {
  const controller = createPlaybackController({
    onChange: (state) => set(state),
  });
  return {
    ...controller.getState(),
    load: controller.load,
    unload: controller.unload,
    play: controller.play,
    pause: controller.pause,
    togglePlay: controller.togglePlay,
    stepForward: controller.stepForward,
    stepBackward: controller.stepBackward,
    seekToStep: controller.seekToStep,
    reset: controller.reset,
    setSpeed: controller.setSpeed,
    setLoop: controller.setLoop,
  };
});
